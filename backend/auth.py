from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from config import settings
from database import get_db
import models

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ── Senha ──────────────────────────────────────────────────────────────────

def hash_senha(senha: str) -> str:
    return pwd_context.hash(senha)


def verificar_senha(senha: str, hash: str) -> bool:
    return pwd_context.verify(senha, hash)


# ── JWT ────────────────────────────────────────────────────────────────────

def criar_token(data: dict) -> str:
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.ACCESS_TOKEN_EXPIRE_HOURS)
    payload.update({"exp": expire})
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decodificar_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )


# ── Dependências ───────────────────────────────────────────────────────────

def get_usuario_atual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> models.Usuario:
    payload = decodificar_token(token)
    usuario_id: Optional[int] = payload.get("sub")
    if usuario_id is None:
        raise HTTPException(status_code=401, detail="Token sem identificador")

    usuario = db.query(models.Usuario).filter(
        models.Usuario.id == int(usuario_id),
        models.Usuario.ativo == True,
    ).first()

    if not usuario:
        raise HTTPException(status_code=401, detail="Usuário não encontrado ou inativo")
    return usuario


def require_role(*roles: str):
    """Retorna dependência que exige que o usuário tenha um dos roles informados."""
    def dependency(usuario: models.Usuario = Depends(get_usuario_atual)) -> models.Usuario:
        if usuario.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado. Requer perfil: {', '.join(roles)}",
            )
        return usuario
    return dependency


# Atalhos de role
requer_admin          = require_role("admin")
requer_admin_gerente  = require_role("admin", "gerente")
requer_qualquer       = require_role("admin", "gerente", "tecnico")
