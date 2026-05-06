from datetime import date
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import extract
from sqlalchemy.orm import Session

import models
from auth import requer_qualquer
from database import get_db

router = APIRouter(prefix="/mapa", tags=["Mapa"])


class ClienteSimples(BaseModel):
    id: int
    nome: str
    logotipo_url: str | None

    model_config = {"from_attributes": True}


class ObraMapaResponse(BaseModel):
    id: int
    codigo: str
    nome: str
    cliente: ClienteSimples
    local_execucao: str | None
    latitude: float | None
    longitude: float | None
    status: str
    campanhas_total: int
    campanhas_ativas: int
    rdos_mes_atual: int
    metros_executados_mes: float

    model_config = {"from_attributes": True}


class KPIsGlobais(BaseModel):
    obras_ativas: int
    campanhas_em_execucao: int
    rdos_aprovados_mes: int
    metros_executados_mes: float


@router.get("/obras", response_model=list[ObraMapaResponse])
def listar_obras_mapa(db: Session = Depends(get_db), _=Depends(requer_qualquer)):
    hoje = date.today()

    obras = (
        db.query(models.Projeto)
        .filter(
            models.Projeto.latitude.isnot(None),
            models.Projeto.longitude.isnot(None),
        )
        .order_by(models.Projeto.nome)
        .all()
    )

    resultado = []
    for obra in obras:
        campanhas = (
            db.query(models.Campanha)
            .filter(models.Campanha.obra_id == obra.id)
            .all()
        )
        campanhas_total = len(campanhas)
        campanhas_ativas = sum(1 for c in campanhas if c.status == "em_execucao")
        campanha_ids = [c.id for c in campanhas]

        rdos_mes = 0
        metros_mes = 0.0

        if campanha_ids:
            rdos_do_mes = (
                db.query(models.RDO)
                .filter(
                    models.RDO.campanha_id.in_(campanha_ids),
                    extract("year", models.RDO.data) == hoje.year,
                    extract("month", models.RDO.data) == hoje.month,
                )
                .all()
            )
            rdos_mes = len(rdos_do_mes)
            rdo_ids = [r.id for r in rdos_do_mes]

            if rdo_ids:
                linhas = (
                    db.query(models.RDOFuro)
                    .filter(models.RDOFuro.rdo_id.in_(rdo_ids))
                    .all()
                )
                for linha in linhas:
                    ini = float(linha.prof_inicial_dia or 0)
                    fim = float(linha.prof_final_dia or 0)
                    if fim > ini:
                        metros_mes += fim - ini

        resultado.append(ObraMapaResponse(
            id=obra.id,
            codigo=obra.codigo,
            nome=obra.nome,
            cliente=ClienteSimples(
                id=obra.cliente.id,
                nome=obra.cliente.nome,
                logotipo_url=obra.cliente.logotipo_url,
            ),
            local_execucao=obra.local_execucao,
            latitude=float(obra.latitude),
            longitude=float(obra.longitude),
            status=obra.status_projeto,
            campanhas_total=campanhas_total,
            campanhas_ativas=campanhas_ativas,
            rdos_mes_atual=rdos_mes,
            metros_executados_mes=round(metros_mes, 2),
        ))

    return resultado


@router.get("/kpis-globais", response_model=KPIsGlobais)
def kpis_globais(db: Session = Depends(get_db), _=Depends(requer_qualquer)):
    hoje = date.today()

    obras_ativas = (
        db.query(models.Projeto)
        .filter(models.Projeto.status_projeto == "em_execucao")
        .count()
    )

    campanhas_em_execucao = (
        db.query(models.Campanha)
        .filter(models.Campanha.status == "em_execucao")
        .count()
    )

    rdos_aprovados_mes = (
        db.query(models.RDO)
        .filter(
            extract("year", models.RDO.data) == hoje.year,
            extract("month", models.RDO.data) == hoje.month,
        )
        .count()
    )

    linhas_mes = (
        db.query(models.RDOFuro)
        .join(models.RDO, models.RDOFuro.rdo_id == models.RDO.id)
        .filter(
            extract("year", models.RDO.data) == hoje.year,
            extract("month", models.RDO.data) == hoje.month,
        )
        .all()
    )
    metros_mes = sum(
        float(l.prof_final_dia or 0) - float(l.prof_inicial_dia or 0)
        for l in linhas_mes
        if (l.prof_final_dia or 0) > (l.prof_inicial_dia or 0)
    )

    return KPIsGlobais(
        obras_ativas=obras_ativas,
        campanhas_em_execucao=campanhas_em_execucao,
        rdos_aprovados_mes=rdos_aprovados_mes,
        metros_executados_mes=round(metros_mes, 2),
    )
