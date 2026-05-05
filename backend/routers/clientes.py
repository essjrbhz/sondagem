from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

import models
import schemas
from auth import requer_admin_gerente, requer_qualquer
from database import get_db

router = APIRouter(prefix="/clientes", tags=["Clientes"])


@router.get("/", response_model=list[schemas.ClienteResponse])
def listar(db: Session = Depends(get_db), _=Depends(requer_qualquer)):
    return db.query(models.Cliente).order_by(models.Cliente.nome).all()


@router.get("/{cliente_id}", response_model=schemas.ClienteResponse)
def obter(cliente_id: int, db: Session = Depends(get_db), _=Depends(requer_qualquer)):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    return cliente


@router.post("/", response_model=schemas.ClienteResponse, status_code=201)
def criar(
    payload: schemas.ClienteCreate,
    db: Session = Depends(get_db),
    _=Depends(requer_admin_gerente),
):
    cliente = models.Cliente(**payload.model_dump())
    db.add(cliente)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="CNPJ já cadastrado")
    db.refresh(cliente)
    return cliente


@router.put("/{cliente_id}", response_model=schemas.ClienteResponse)
def atualizar(
    cliente_id: int,
    payload: schemas.ClienteUpdate,
    db: Session = Depends(get_db),
    _=Depends(requer_admin_gerente),
):
    cliente = db.query(models.Cliente).filter(models.Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    for campo, valor in payload.model_dump(exclude_none=True).items():
        setattr(cliente, campo, valor)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="CNPJ já cadastrado")
    db.refresh(cliente)
    return cliente
