from typing import Optional
from datetime import date
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

import models
import schemas
from auth import requer_qualquer
from database import get_db

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/resumo", response_model=schemas.ResumoCard)
def resumo(
    projeto_id: Optional[int] = Query(None, description="Filtrar por projeto específico"),
    db: Session = Depends(get_db),
    _=Depends(requer_qualquer),
):
    q = db.query(models.Furo).filter(models.Furo.ativo == True)
    if projeto_id:
        q = q.filter(models.Furo.projeto_id == projeto_id)

    furos = q.all()

    total        = len(furos)
    pendente     = sum(1 for f in furos if f.status == "Pendente")
    em_execucao  = sum(1 for f in furos if f.status == "Em Execução")
    concluido    = sum(1 for f in furos if f.status == "Concluído")
    cancelado    = sum(1 for f in furos if f.status == "Cancelado")
    prof_prev    = float(sum(f.prof_prevista_m  or 0 for f in furos))
    prof_real    = float(sum(f.prof_realizada_m or 0 for f in furos))
    avanco       = round((prof_real / prof_prev * 100) if prof_prev else 0, 1)

    return schemas.ResumoCard(
        total_furos=total,
        pendente=pendente,
        em_execucao=em_execucao,
        concluido=concluido,
        cancelado=cancelado,
        prof_prevista_total=prof_prev,
        prof_realizada_total=prof_real,
        avanco_pct=avanco,
    )


@router.get("/avanco-temporal", response_model=list[schemas.PontoTemporal])
def avanco_temporal(
    projeto_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(requer_qualquer),
):
    """
    Retorna série temporal de metragem acumulada (realizada vs prevista)
    agrupada por data_termino dos furos concluídos.
    """
    q = db.query(models.Furo).filter(
        models.Furo.ativo == True,
        models.Furo.data_termino != None,
        models.Furo.prof_realizada_m != None,
    )
    if projeto_id:
        q = q.filter(models.Furo.projeto_id == projeto_id)

    furos = q.order_by(models.Furo.data_termino).all()

    # Agrupa por data e acumula
    por_data: dict[date, dict] = {}
    for f in furos:
        d = f.data_termino
        if d not in por_data:
            por_data[d] = {"realizado": 0.0}
        por_data[d]["realizado"] += float(f.prof_realizada_m or 0)

    # Total previsto para distribuir linearmente como linha de meta
    todos_furos = db.query(models.Furo).filter(models.Furo.ativo == True)
    if projeto_id:
        todos_furos = todos_furos.filter(models.Furo.projeto_id == projeto_id)
    total_previsto = float(sum(f.prof_prevista_m or 0 for f in todos_furos.all()))

    pontos = sorted(por_data.items())
    acumulado_real = 0.0
    resultado = []
    n = len(pontos)
    for i, (d, vals) in enumerate(pontos):
        acumulado_real += vals["realizado"]
        # Meta distribuída linearmente entre as datas
        previsto_acumulado = round(total_previsto * (i + 1) / n, 2) if n else 0
        resultado.append(schemas.PontoTemporal(
            data=d,
            realizado_acumulado=round(acumulado_real, 2),
            previsto_acumulado=previsto_acumulado,
        ))

    return resultado


@router.get("/produtividade", response_model=list[schemas.ProdutividadeSonda])
def produtividade(
    db: Session = Depends(get_db),
    _=Depends(requer_qualquer),
):
    """Produtividade por sonda: metragem total, furos, média m/furo."""
    sondas = db.query(models.Sonda).all()
    resultado = []

    for sonda in sondas:
        projetos = db.query(models.Projeto).filter(models.Projeto.sonda_id == sonda.id).all()
        projeto_ids = [p.id for p in projetos]

        if not projeto_ids:
            continue

        furos = db.query(models.Furo).filter(
            models.Furo.projeto_id.in_(projeto_ids),
            models.Furo.ativo == True,
        ).all()

        total_furos    = len(furos)
        metragem_total = float(sum(f.prof_realizada_m or 0 for f in furos))
        media          = round(metragem_total / total_furos, 2) if total_furos else 0.0

        resultado.append(schemas.ProdutividadeSonda(
            sonda_id=sonda.id,
            sonda_nome=sonda.nome,
            total_projetos=len(projetos),
            total_furos=total_furos,
            metragem_total=metragem_total,
            media_m_por_furo=media,
        ))

    return resultado
