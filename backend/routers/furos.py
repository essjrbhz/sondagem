from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

import models
import schemas
from auth import requer_admin_gerente, requer_qualquer, get_usuario_atual
from database import get_db

router = APIRouter(prefix="/furos", tags=["Furos"])

# Transições válidas por role
# tecnico: Pendente→Em Execução, Em Execução→Concluído
# gerente/admin: todas + reabrir (Concluído→Em Execução) + cancelar
TRANSICOES_TECNICO = {
    "Pendente":    ["Em Execução"],
    "Em Execução": ["Concluído"],
}
TRANSICOES_GERENTE = {
    "Pendente":    ["Em Execução", "Cancelado"],
    "Em Execução": ["Concluído",   "Cancelado", "Pendente"],
    "Concluído":   ["Em Execução", "Cancelado"],
    "Cancelado":   ["Pendente"],
}


def _get_furo_ativo(furo_id: int, db: Session) -> models.Furo:
    furo = db.query(models.Furo).filter(
        models.Furo.id == furo_id,
        models.Furo.ativo == True,
    ).first()
    if not furo:
        raise HTTPException(status_code=404, detail="Furo não encontrado")
    return furo


def _aviso_prof(furo: models.Furo) -> Optional[str]:
    if furo.prof_realizada_m and furo.prof_prevista_m:
        if furo.prof_realizada_m > furo.prof_prevista_m:
            excesso = float(furo.prof_realizada_m - furo.prof_prevista_m)
            return f"Profundidade realizada excede a prevista em {excesso:.2f}m"
    return None


@router.get("/", response_model=list[schemas.FuroResponse])
def listar(
    projeto_id: Optional[int] = Query(None),
    status:     Optional[str] = Query(None),
    tipo_furo:  Optional[str] = Query(None),
    db: Session = Depends(get_db),
    _=Depends(requer_qualquer),
):
    q = db.query(models.Furo).filter(models.Furo.ativo == True)
    if projeto_id:
        q = q.filter(models.Furo.projeto_id == projeto_id)
    if status:
        q = q.filter(models.Furo.status == status)
    if tipo_furo:
        q = q.filter(models.Furo.tipo_furo == tipo_furo)

    furos = q.order_by(models.Furo.projeto_id, models.Furo.id).all()
    return [schemas.FuroResponse.model_validate(f).model_copy(update={"aviso_prof": _aviso_prof(f)}) for f in furos]


@router.get("/{furo_id}", response_model=schemas.FuroDetalhe)
def obter(furo_id: int, db: Session = Depends(get_db), _=Depends(requer_qualquer)):
    furo = _get_furo_ativo(furo_id, db)
    resp = schemas.FuroDetalhe.model_validate(furo)
    resp.aviso_prof = _aviso_prof(furo)
    return resp


@router.post("/", response_model=schemas.FuroResponse, status_code=201)
def criar(
    payload: schemas.FuroCreate,
    db: Session = Depends(get_db),
    _=Depends(requer_qualquer),
):
    if not db.query(models.Projeto).filter(models.Projeto.id == payload.projeto_id).first():
        raise HTTPException(status_code=400, detail="Projeto não encontrado")

    furo = models.Furo(**payload.model_dump(), status="Pendente")
    db.add(furo)
    db.commit()
    db.refresh(furo)
    return schemas.FuroResponse.model_validate(furo).model_copy(update={"aviso_prof": None})


@router.patch("/{furo_id}/progresso", response_model=schemas.FuroResponse)
def atualizar_progresso(
    furo_id: int,
    payload: schemas.FuroProgressoUpdate,
    db: Session = Depends(get_db),
    _=Depends(requer_qualquer),
):
    furo = _get_furo_ativo(furo_id, db)

    dados = payload.model_dump(exclude_none=True)

    # Validação de datas combinando com valores existentes
    nova_inicio  = dados.get("data_inicio",  furo.data_inicio)
    nova_termino = dados.get("data_termino", furo.data_termino)
    if nova_inicio and nova_termino and nova_termino < nova_inicio:
        raise HTTPException(status_code=400, detail="data_termino não pode ser anterior a data_inicio")

    for campo, valor in dados.items():
        setattr(furo, campo, valor)

    db.commit()
    db.refresh(furo)
    return schemas.FuroResponse.model_validate(furo).model_copy(update={"aviso_prof": _aviso_prof(furo)})


@router.patch("/{furo_id}/status", response_model=schemas.FuroResponse)
def mudar_status(
    furo_id: int,
    payload: schemas.FuroStatusUpdate,
    db: Session = Depends(get_db),
    usuario: models.Usuario = Depends(get_usuario_atual),
):
    furo = _get_furo_ativo(furo_id, db)
    status_atual = furo.status
    novo_status  = payload.status

    if status_atual == novo_status:
        return schemas.FuroResponse.model_validate(furo).model_copy(update={"aviso_prof": _aviso_prof(furo)})

    # Selecionar mapa de transições pelo role
    if usuario.role in ("admin", "gerente"):
        transicoes = TRANSICOES_GERENTE
    else:
        transicoes = TRANSICOES_TECNICO

    permitidos = transicoes.get(status_atual, [])
    if novo_status not in permitidos:
        raise HTTPException(
            status_code=400,
            detail=f"Transição inválida: {status_atual} → {novo_status}. Permitidas: {permitidos}",
        )

    furo.status = novo_status

    # Limpar data_termino ao reabrir furo
    if novo_status == "Em Execução" and status_atual == "Concluído":
        furo.data_termino = None

    # Soft delete ao cancelar
    if novo_status == "Cancelado":
        furo.ativo = False

    db.commit()
    db.refresh(furo)
    return schemas.FuroResponse.model_validate(furo).model_copy(update={"aviso_prof": _aviso_prof(furo)})


@router.delete("/{furo_id}", status_code=204)
def deletar(
    furo_id: int,
    db: Session = Depends(get_db),
    _=Depends(requer_admin_gerente),
):
    furo = _get_furo_ativo(furo_id, db)
    furo.ativo = False
    furo.status = "Cancelado"
    db.commit()
