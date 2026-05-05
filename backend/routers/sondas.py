from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from auth import requer_admin, requer_admin_gerente, requer_qualquer
from database import get_db

router = APIRouter(prefix="/sondas", tags=["Sondas"])


@router.get("/", response_model=list[schemas.SondaResponse])
def listar(db: Session = Depends(get_db), _=Depends(requer_qualquer)):
    return db.query(models.Sonda).order_by(models.Sonda.nome).all()


@router.get("/{sonda_id}", response_model=schemas.SondaResponse)
def obter(sonda_id: int, db: Session = Depends(get_db), _=Depends(requer_qualquer)):
    sonda = db.query(models.Sonda).filter(models.Sonda.id == sonda_id).first()
    if not sonda:
        raise HTTPException(status_code=404, detail="Sonda não encontrada")
    return sonda


@router.post("/", response_model=schemas.SondaResponse, status_code=201)
def criar(
    payload: schemas.SondaCreate,
    db: Session = Depends(get_db),
    _=Depends(requer_admin_gerente),
):
    sonda = models.Sonda(**payload.model_dump())
    db.add(sonda)
    db.commit()
    db.refresh(sonda)
    return sonda


@router.put("/{sonda_id}", response_model=schemas.SondaResponse)
def atualizar(
    sonda_id: int,
    payload: schemas.SondaUpdate,
    db: Session = Depends(get_db),
    _=Depends(requer_admin_gerente),
):
    sonda = db.query(models.Sonda).filter(models.Sonda.id == sonda_id).first()
    if not sonda:
        raise HTTPException(status_code=404, detail="Sonda não encontrada")

    for campo, valor in payload.model_dump(exclude_none=True).items():
        setattr(sonda, campo, valor)

    db.commit()
    db.refresh(sonda)
    return sonda


@router.patch("/{sonda_id}/desativar", response_model=schemas.SondaResponse)
def desativar(sonda_id: int, db: Session = Depends(get_db), _=Depends(requer_admin)):
    sonda = db.query(models.Sonda).filter(models.Sonda.id == sonda_id).first()
    if not sonda:
        raise HTTPException(status_code=404, detail="Sonda não encontrada")
    sonda.ativa = False
    db.commit()
    db.refresh(sonda)
    return sonda


@router.patch("/{sonda_id}/ativar", response_model=schemas.SondaResponse)
def ativar(sonda_id: int, db: Session = Depends(get_db), _=Depends(requer_admin)):
    sonda = db.query(models.Sonda).filter(models.Sonda.id == sonda_id).first()
    if not sonda:
        raise HTTPException(status_code=404, detail="Sonda não encontrada")
    sonda.ativa = True
    db.commit()
    db.refresh(sonda)
    return sonda
