from datetime import date, datetime
from sqlalchemy import (
    Boolean, Column, Date, DateTime, Enum, ForeignKey,
    Integer, Numeric, String, UniqueConstraint, CheckConstraint, func,
)
from sqlalchemy.orm import relationship

from database import Base


# ── Enums ──────────────────────────────────────────────────────────────────

StatusFuro = Enum(
    "Pendente", "Em Execução", "Concluído", "Cancelado",
    name="status_furo",
)

CategoriaAtividade = Enum(
    "Ensaio", "Coleta",
    name="categoria_atividade",
)

RoleUsuario = Enum(
    "admin", "gerente", "tecnico",
    name="role_usuario",
)


# ── Tabelas ────────────────────────────────────────────────────────────────

class Cliente(Base):
    __tablename__ = "clientes"

    id          = Column(Integer, primary_key=True, index=True)
    nome        = Column(String(200), nullable=False)
    cnpj        = Column(String(18), unique=True, nullable=True)
    criado_em   = Column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    projetos = relationship("Projeto", back_populates="cliente")


class Sonda(Base):
    __tablename__ = "sondas"

    id          = Column(Integer, primary_key=True, index=True)
    nome        = Column(String(100), nullable=False)
    ativa       = Column(Boolean, default=True, nullable=False)
    criado_em   = Column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    projetos = relationship("Projeto", back_populates="sonda")


class Projeto(Base):
    __tablename__ = "projetos"

    id          = Column(Integer, primary_key=True, index=True)
    codigo      = Column(String(20), unique=True, nullable=False, index=True)
    nome        = Column(String(300), nullable=False)
    cliente_id  = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    sonda_id    = Column(Integer, ForeignKey("sondas.id"), nullable=False)
    cidade      = Column(String(100), nullable=False)
    uf          = Column(String(2), nullable=False)
    criado_em   = Column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    cliente = relationship("Cliente", back_populates="projetos")
    sonda   = relationship("Sonda", back_populates="projetos")
    furos   = relationship("Furo", back_populates="projeto")


class Furo(Base):
    __tablename__ = "furos"
    __table_args__ = (
        CheckConstraint(
            "data_termino IS NULL OR data_inicio IS NULL OR data_termino >= data_inicio",
            name="chk_furo_datas",
        ),
    )

    id               = Column(Integer, primary_key=True, index=True)
    projeto_id       = Column(Integer, ForeignKey("projetos.id"), nullable=False, index=True)
    id_furo          = Column(String(50), nullable=False)
    tipo_furo        = Column(String(20), nullable=True)
    coordenada_e     = Column(Numeric(12, 3), nullable=True)
    coordenada_n     = Column(Numeric(12, 3), nullable=True)
    prof_prevista_m  = Column(Numeric(7, 2), nullable=True)
    prof_realizada_m = Column(Numeric(7, 2), nullable=True)
    data_inicio      = Column(Date, nullable=True)
    data_termino     = Column(Date, nullable=True)
    status           = Column(StatusFuro, nullable=False, default="Pendente")
    ativo            = Column(Boolean, default=True, nullable=False)
    criado_em        = Column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em    = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    projeto     = relationship("Projeto", back_populates="furos")
    atividades  = relationship("AtividadeFuro", back_populates="furo", cascade="all, delete-orphan")


class AtividadeFuro(Base):
    __tablename__ = "atividades_furo"
    __table_args__ = (
        CheckConstraint(
            "prof_inicio_m IS NULL OR prof_fim_m IS NULL OR prof_fim_m > prof_inicio_m",
            name="chk_atividade_prof",
        ),
    )

    id            = Column(Integer, primary_key=True, index=True)
    furo_id       = Column(Integer, ForeignKey("furos.id"), nullable=False, index=True)
    categoria     = Column(CategoriaAtividade, nullable=False)
    tipo          = Column(String(30), nullable=True)
    prof_inicio_m = Column(Numeric(7, 2), nullable=True)
    prof_fim_m    = Column(Numeric(7, 2), nullable=True)
    criado_em     = Column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    furo = relationship("Furo", back_populates="atividades")


class Usuario(Base):
    __tablename__ = "usuarios"

    id            = Column(Integer, primary_key=True, index=True)
    nome          = Column(String(150), nullable=False)
    email         = Column(String(150), unique=True, nullable=False, index=True)
    senha_hash    = Column(String(200), nullable=False)
    role          = Column(RoleUsuario, nullable=False, default="tecnico")
    ativo         = Column(Boolean, default=True, nullable=False)
    criado_em     = Column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)
