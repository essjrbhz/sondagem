from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from auth import requer_qualquer, requer_admin_gerente
from database import get_db

router = APIRouter(tags=["Atividades"])


@router.get("/furos/{furo_id}/atividades", response_model=list[schemas.AtividadeResponse])
def listar_atividades(
    furo_id: int,
    db: Session = Depends(get_db),
    _=Depends(requer_qualquer),
):
    furo = db.query(models.Furo).filter(models.Furo.id == furo_id).first()
    if not furo:
        raise HTTPException(status_code=404, detail="Furo não encontrado")

    return (
        db.query(models.AtividadeFuro)
        .filter(models.AtividadeFuro.furo_id == furo_id)
        .order_by(models.AtividadeFuro.categoria, models.AtividadeFuro.prof_inicio_m)
        .all()
    )


@router.post("/furos/{furo_id}/atividades", response_model=schemas.AtividadeResponse, status_code=201)
def criar_atividade(
    furo_id: int,
    payload: schemas.AtividadeCreate,
    db: Session = Depends(get_db),
    _=Depends(requer_qualquer),
):
    furo = db.query(models.Furo).filter(
        models.Furo.id == furo_id,
        models.Furo.ativo == True,
    ).first()
    if not furo:
        raise HTTPException(status_code=404, detail="Furo não encontrado ou inativo")

    atividade = models.AtividadeFuro(furo_id=furo_id, **payload.model_dump())
    db.add(atividade)
    db.commit()
    db.refresh(atividade)
    return atividade


@router.delete("/atividades/{atividade_id}", status_code=204)
def deletar_atividade(
    atividade_id: int,
    db: Session = Depends(get_db),
    _=Depends(requer_admin_gerente),
):
    atividade = db.query(models.AtividadeFuro).filter(models.AtividadeFuro.id == atividade_id).first()
    if not atividade:
        raise HTTPException(status_code=404, detail="Atividade não encontrada")
    db.delete(atividade)
    db.commit()
