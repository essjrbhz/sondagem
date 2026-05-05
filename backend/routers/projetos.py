from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

import models
import schemas
from auth import requer_admin_gerente, requer_qualquer
from database import get_db

router = APIRouter(prefix="/projetos", tags=["Projetos"])


def _resumo_projeto(projeto: models.Projeto, db: Session) -> schemas.ProjetoComResumo:
    furos = db.query(models.Furo).filter(
        models.Furo.projeto_id == projeto.id,
        models.Furo.ativo == True,
    ).all()

    total = len(furos)
    pendente     = sum(1 for f in furos if f.status == "Pendente")
    em_execucao  = sum(1 for f in furos if f.status == "Em Execução")
    concluido    = sum(1 for f in furos if f.status == "Concluído")
    cancelado    = sum(1 for f in furos if f.status == "Cancelado")

    prof_prev  = float(sum(f.prof_prevista_m  or 0 for f in furos))
    prof_real  = float(sum(f.prof_realizada_m or 0 for f in furos))
    avanco     = round((prof_real / prof_prev * 100) if prof_prev else 0, 1)

    return schemas.ProjetoComResumo(
        **schemas.ProjetoResponse.model_validate(projeto).model_dump(),
        cliente_nome=projeto.cliente.nome,
        sonda_nome=projeto.sonda.nome,
        total_furos=total,
        furos_pendente=pendente,
        furos_em_execucao=em_execucao,
        furos_concluido=concluido,
        furos_cancelado=cancelado,
        prof_prevista_total=prof_prev,
        prof_realizada_total=prof_real,
        avanco_pct=avanco,
    )


@router.get("/", response_model=list[schemas.ProjetoComResumo])
def listar(
    cliente_id: Optional[int] = Query(None),
    sonda_id:   Optional[int] = Query(None),
    uf:         Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(requer_qualquer),
):
    q = db.query(models.Projeto)
    if cliente_id:
        q = q.filter(models.Projeto.cliente_id == cliente_id)
    if sonda_id:
        q = q.filter(models.Projeto.sonda_id == sonda_id)
    if uf:
        q = q.filter(models.Projeto.uf == uf.upper())

    projetos = q.order_by(models.Projeto.codigo).all()
    return [_resumo_projeto(p, db) for p in projetos]


@router.get("/{projeto_id}", response_model=schemas.ProjetoComResumo)
def obter(projeto_id: int, db: Session = Depends(get_db), _=Depends(requer_qualquer)):
    projeto = db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")
    return _resumo_projeto(projeto, db)


@router.post("/", response_model=schemas.ProjetoResponse, status_code=201)
def criar(
    payload: schemas.ProjetoCreate,
    db: Session = Depends(get_db),
    _=Depends(requer_admin_gerente),
):
    # Validar FK cliente
    if not db.query(models.Cliente).filter(models.Cliente.id == payload.cliente_id).first():
        raise HTTPException(status_code=400, detail="Cliente não encontrado")

    # Validar FK sonda (e deve estar ativa)
    sonda = db.query(models.Sonda).filter(models.Sonda.id == payload.sonda_id).first()
    if not sonda:
        raise HTTPException(status_code=400, detail="Sonda não encontrada")
    if not sonda.ativa:
        raise HTTPException(status_code=400, detail="Sonda inativa — escolha uma sonda ativa")

    projeto = models.Projeto(**payload.model_dump())
    db.add(projeto)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Código de projeto já cadastrado")
    db.refresh(projeto)
    return projeto


@router.put("/{projeto_id}", response_model=schemas.ProjetoResponse)
def atualizar(
    projeto_id: int,
    payload: schemas.ProjetoUpdate,
    db: Session = Depends(get_db),
    _=Depends(requer_admin_gerente),
):
    projeto = db.query(models.Projeto).filter(models.Projeto.id == projeto_id).first()
    if not projeto:
        raise HTTPException(status_code=404, detail="Projeto não encontrado")

    dados = payload.model_dump(exclude_none=True)

    if "sonda_id" in dados:
        sonda = db.query(models.Sonda).filter(models.Sonda.id == dados["sonda_id"]).first()
        if not sonda or not sonda.ativa:
            raise HTTPException(status_code=400, detail="Sonda não encontrada ou inativa")

    for campo, valor in dados.items():
        setattr(projeto, campo, valor)

    db.commit()
    db.refresh(projeto)
    return projeto
