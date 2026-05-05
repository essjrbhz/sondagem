from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from auth import (
    hash_senha, verificar_senha, criar_token,
    get_usuario_atual, requer_admin, requer_qualquer,
)
from database import get_db

router = APIRouter()


@router.post("/auth/login", response_model=schemas.TokenResponse, tags=["Auth"])
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(
        models.Usuario.email == payload.email,
        models.Usuario.ativo == True,
    ).first()

    if not usuario or not verificar_senha(payload.senha, usuario.senha_hash):
        raise HTTPException(status_code=401, detail="Email ou senha inválidos")

    token = criar_token({"sub": str(usuario.id), "role": usuario.role})
    return schemas.TokenResponse(
        access_token=token,
        role=usuario.role,
        nome=usuario.nome,
    )


@router.get("/usuarios/me", response_model=schemas.UsuarioResponse, tags=["Usuários"])
def me(usuario: models.Usuario = Depends(get_usuario_atual)):
    return usuario


@router.get("/usuarios/", response_model=list[schemas.UsuarioResponse], tags=["Usuários"])
def listar_usuarios(
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(requer_admin),
):
    return db.query(models.Usuario).all()


@router.post("/usuarios/", response_model=schemas.UsuarioResponse, status_code=201, tags=["Usuários"])
def criar_usuario(
    payload: schemas.UsuarioCreate,
    db: Session = Depends(get_db),
    _: models.Usuario = Depends(requer_admin),
):
    if db.query(models.Usuario).filter(models.Usuario.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    usuario = models.Usuario(
        nome=payload.nome,
        email=payload.email,
        senha_hash=hash_senha(payload.senha),
        role=payload.role,
    )
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    return usuario


@router.patch("/usuarios/{usuario_id}/desativar", response_model=schemas.UsuarioResponse, tags=["Usuários"])
def desativar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    atual: models.Usuario = Depends(requer_admin),
):
    if usuario_id == atual.id:
        raise HTTPException(status_code=400, detail="Não é possível desativar o próprio usuário")

    usuario = db.query(models.Usuario).filter(models.Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")

    usuario.ativo = False
    db.commit()
    db.refresh(usuario)
    return usuario
