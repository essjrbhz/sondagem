from __future__ import annotations
from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, EmailStr, field_validator, model_validator


# ── Helpers ────────────────────────────────────────────────────────────────

StatusFuroLiteral = Literal["Pendente", "Em Execução", "Concluído", "Cancelado"]
CategoriaLiteral  = Literal["Ensaio", "Coleta"]
RoleLiteral       = Literal["admin", "gerente", "tecnico"]


# ── Auth ───────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    senha: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: RoleLiteral
    nome: str


# ── Usuario ────────────────────────────────────────────────────────────────

class UsuarioCreate(BaseModel):
    nome: str
    email: str
    senha: str
    role: RoleLiteral = "tecnico"


class UsuarioResponse(BaseModel):
    id: int
    nome: str
    email: str
    role: RoleLiteral
    ativo: bool
    criado_em: datetime

    model_config = {"from_attributes": True}


# ── Cliente ────────────────────────────────────────────────────────────────

class ClienteCreate(BaseModel):
    nome: str
    cnpj: Optional[str] = None


class ClienteUpdate(BaseModel):
    nome: Optional[str] = None
    cnpj: Optional[str] = None


class ClienteResponse(BaseModel):
    id: int
    nome: str
    cnpj: Optional[str]
    criado_em: datetime

    model_config = {"from_attributes": True}


# ── Sonda ──────────────────────────────────────────────────────────────────

class SondaCreate(BaseModel):
    nome: str
    ativa: bool = True


class SondaUpdate(BaseModel):
    nome: Optional[str] = None
    ativa: Optional[bool] = None


class SondaResponse(BaseModel):
    id: int
    nome: str
    ativa: bool
    criado_em: datetime

    model_config = {"from_attributes": True}


# ── Projeto ────────────────────────────────────────────────────────────────

class ProjetoCreate(BaseModel):
    codigo: str
    nome: str
    cliente_id: int
    sonda_id: int
    cidade: str
    uf: str

    @field_validator("uf")
    @classmethod
    def uf_maiusculo(cls, v: str) -> str:
        return v.upper()


class ProjetoUpdate(BaseModel):
    nome: Optional[str] = None
    cliente_id: Optional[int] = None
    sonda_id: Optional[int] = None
    cidade: Optional[str] = None
    uf: Optional[str] = None


class ProjetoResponse(BaseModel):
    id: int
    codigo: str
    nome: str
    cliente_id: int
    sonda_id: int
    cidade: str
    uf: str
    criado_em: datetime

    model_config = {"from_attributes": True}


class ProjetoComResumo(ProjetoResponse):
    cliente_nome: str
    sonda_nome: str
    total_furos: int
    furos_pendente: int
    furos_em_execucao: int
    furos_concluido: int
    furos_cancelado: int
    prof_prevista_total: float
    prof_realizada_total: float
    avanco_pct: float


# ── Furo ───────────────────────────────────────────────────────────────────

class FuroCreate(BaseModel):
    projeto_id: int
    id_furo: str
    tipo_furo: Optional[str] = None
    coordenada_e: Optional[Decimal] = None
    coordenada_n: Optional[Decimal] = None
    prof_prevista_m: Optional[Decimal] = None
    data_inicio: Optional[date] = None


class FuroProgressoUpdate(BaseModel):
    prof_realizada_m: Optional[Decimal] = None
    data_inicio: Optional[date] = None
    data_termino: Optional[date] = None

    @model_validator(mode="after")
    def validar_datas(self) -> FuroProgressoUpdate:
        if self.data_inicio and self.data_termino:
            if self.data_termino < self.data_inicio:
                raise ValueError("data_termino não pode ser anterior a data_inicio")
        return self


class FuroStatusUpdate(BaseModel):
    status: StatusFuroLiteral


class FuroResponse(BaseModel):
    id: int
    projeto_id: int
    id_furo: str
    tipo_furo: Optional[str]
    coordenada_e: Optional[Decimal]
    coordenada_n: Optional[Decimal]
    prof_prevista_m: Optional[Decimal]
    prof_realizada_m: Optional[Decimal]
    data_inicio: Optional[date]
    data_termino: Optional[date]
    status: StatusFuroLiteral
    ativo: bool
    aviso_prof: Optional[str] = None

    model_config = {"from_attributes": True}


class FuroDetalhe(FuroResponse):
    atividades: list[AtividadeResponse] = []


# ── Atividade ──────────────────────────────────────────────────────────────

class AtividadeCreate(BaseModel):
    categoria: CategoriaLiteral
    tipo: Optional[str] = None
    prof_inicio_m: Optional[Decimal] = None
    prof_fim_m: Optional[Decimal] = None

    @model_validator(mode="after")
    def validar_profundidades(self) -> AtividadeCreate:
        if self.prof_inicio_m is not None and self.prof_fim_m is not None:
            if self.prof_fim_m <= self.prof_inicio_m:
                raise ValueError("prof_fim_m deve ser maior que prof_inicio_m")
        return self


class AtividadeResponse(BaseModel):
    id: int
    furo_id: int
    categoria: CategoriaLiteral
    tipo: Optional[str]
    prof_inicio_m: Optional[Decimal]
    prof_fim_m: Optional[Decimal]
    criado_em: datetime

    model_config = {"from_attributes": True}


# Resolve forward reference (FuroDetalhe usa AtividadeResponse antes da definição)
FuroDetalhe.model_rebuild()


# ── Dashboard ──────────────────────────────────────────────────────────────

class ResumoCard(BaseModel):
    total_furos: int
    pendente: int
    em_execucao: int
    concluido: int
    cancelado: int
    prof_prevista_total: float
    prof_realizada_total: float
    avanco_pct: float


class PontoTemporal(BaseModel):
    data: date
    realizado_acumulado: float
    previsto_acumulado: float


class ProdutividadeSonda(BaseModel):
    sonda_id: int
    sonda_nome: str
    total_projetos: int
    total_furos: int
    metragem_total: float
    media_m_por_furo: float
