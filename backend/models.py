from datetime import date, datetime
from sqlalchemy import (
    Boolean, Column, Date, DateTime, Enum, ForeignKey,
    Integer, Numeric, String, Text, UniqueConstraint, CheckConstraint, func,
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

TipoEquipamento = Enum(
    "sonda", "percussao", "trado_mecanico", "trado_manual", "cptu", "mach700",
    name="tipo_equipamento",
)

StatusEquipamento = Enum(
    "operante", "inoperante", "manutencao", "reserva", "venda",
    name="status_equipamento",
)

TipoContrato = Enum(
    "guarda_chuva", "escopo_fechado",
    name="tipo_contrato",
)

StatusOS = Enum(
    "em_execucao", "concluido", "mobilizacao", "aguardando",
    name="status_os",
)

StatusRDO = Enum(
    "rascunho", "enviado", "aprovado", "rejeitado",
    name="status_rdo",
)


# ── Tabelas ────────────────────────────────────────────────────────────────

class Cliente(Base):
    __tablename__ = "clientes"

    id          = Column(Integer, primary_key=True, index=True)
    nome        = Column(String(200), nullable=False)
    cnpj        = Column(String(18), unique=True, nullable=True)
    criado_em   = Column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    projetos  = relationship("Projeto", back_populates="cliente")
    contratos = relationship("Contrato", back_populates="cliente")


class Sonda(Base):
    __tablename__ = "sondas"

    id          = Column(Integer, primary_key=True, index=True)
    nome        = Column(String(100), nullable=False)
    ativa       = Column(Boolean, default=True, nullable=False)
    criado_em   = Column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    projetos = relationship("Projeto", back_populates="sonda")


class Equipamento(Base):
    __tablename__ = "equipamentos"

    id                = Column(Integer, primary_key=True, index=True)
    nome              = Column(String(100), nullable=False)
    tipo              = Column(TipoEquipamento, nullable=False)
    status            = Column(StatusEquipamento, nullable=False, default="operante")
    idce_equipamento  = Column(Integer, unique=True, nullable=True)
    criado_em         = Column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em     = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    campanhas = relationship("Campanha", back_populates="equipamento")


class Contrato(Base):
    __tablename__ = "contratos"

    id               = Column(Integer, primary_key=True, index=True)
    cliente_id       = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    numero           = Column(String(100), nullable=False)
    tipo             = Column(TipoContrato, nullable=False)
    data_inicio      = Column(Date, nullable=True)
    data_termino     = Column(Date, nullable=True)
    valor_total      = Column(Numeric(14, 2), nullable=True)
    objeto           = Column(Text, nullable=True)
    gestor_cliente   = Column(String(200), nullable=True)
    gestor_geothra   = Column(String(200), nullable=True)
    criado_em        = Column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em    = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    cliente  = relationship("Cliente", back_populates="contratos")
    projetos = relationship("Projeto", back_populates="contrato")


class Projeto(Base):
    __tablename__ = "projetos"

    id               = Column(Integer, primary_key=True, index=True)
    codigo           = Column(String(20), unique=True, nullable=False, index=True)
    nome             = Column(String(300), nullable=False)
    cliente_id       = Column(Integer, ForeignKey("clientes.id"), nullable=False)
    sonda_id         = Column(Integer, ForeignKey("sondas.id"), nullable=False)  # legado — manter
    cidade           = Column(String(100), nullable=False)
    uf               = Column(String(2), nullable=False)
    # ── campos novos ──
    contrato_id      = Column(Integer, ForeignKey("contratos.id"), nullable=True)
    centro_custo     = Column(String(30), nullable=True)
    numero_contrato  = Column(String(100), nullable=True)
    objeto_contrato  = Column(Text, nullable=True)
    gestor_cliente   = Column(String(200), nullable=True)
    gestor_geothra   = Column(String(200), nullable=True)
    data_inicio      = Column(Date, nullable=True)
    data_termino     = Column(Date, nullable=True)
    status_projeto   = Column(StatusOS, nullable=False, default="em_execucao")
    idce_projeto     = Column(Integer, unique=True, nullable=True)
    latitude         = Column(Numeric(9, 6), nullable=True)
    longitude        = Column(Numeric(9, 6), nullable=True)
    criado_em        = Column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em    = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    cliente  = relationship("Cliente", back_populates="projetos")
    sonda    = relationship("Sonda", back_populates="projetos")
    contrato = relationship("Contrato", back_populates="projetos")
    furos    = relationship("Furo", back_populates="projeto")
    ordens_servico = relationship("OS", back_populates="projeto")


class Furo(Base):
    __tablename__ = "furos"
    __table_args__ = (
        CheckConstraint(
            "data_termino IS NULL OR data_inicio IS NULL OR data_termino >= data_inicio",
            name="chk_furo_datas",
        ),
    )

    id               = Column(Integer, primary_key=True, index=True)
    projeto_id       = Column(Integer, ForeignKey("projetos.id"), nullable=False, index=True)  # legado — manter
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
    # ── campo novo ──
    campanha_id      = Column(Integer, ForeignKey("campanhas.id"), nullable=True)
    criado_em        = Column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em    = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    projeto    = relationship("Projeto", back_populates="furos")
    campanha   = relationship("Campanha", back_populates="furos")
    atividades = relationship("AtividadeFuro", back_populates="furo", cascade="all, delete-orphan")
    rdos_furo  = relationship("RDOFuro", back_populates="furo")


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

    campanhas_coordenadas  = relationship("Campanha", foreign_keys="Campanha.coordenador_geothra_id", back_populates="coordenador_geothra")
    campanhas_medicao      = relationship("Campanha", foreign_keys="Campanha.responsavel_medicao_id", back_populates="responsavel_medicao")


class OS(Base):
    __tablename__ = "ordens_servico"

    id            = Column(Integer, primary_key=True, index=True)
    projeto_id    = Column(Integer, ForeignKey("projetos.id"), nullable=False, index=True)
    numero        = Column(String(30), nullable=False)
    descricao     = Column(Text, nullable=True)
    valor         = Column(Numeric(14, 2), nullable=True)
    data_inicio   = Column(Date, nullable=True)
    data_termino  = Column(Date, nullable=True)
    status        = Column(StatusOS, nullable=False, default="em_execucao")
    criado_em     = Column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    projeto   = relationship("Projeto", back_populates="ordens_servico")
    campanhas = relationship("Campanha", back_populates="os")


class Campanha(Base):
    __tablename__ = "campanhas"

    id                       = Column(Integer, primary_key=True, index=True)
    os_id                    = Column(Integer, ForeignKey("ordens_servico.id"), nullable=False, index=True)
    codigo                   = Column(String(30), nullable=False)
    descricao                = Column(Text, nullable=True)
    equipamento_id           = Column(Integer, ForeignKey("equipamentos.id"), nullable=True)
    coordenador_geothra_id   = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    responsavel_medicao_id   = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    data_inicio              = Column(Date, nullable=True)
    data_termino             = Column(Date, nullable=True)
    status                   = Column(StatusOS, nullable=False, default="em_execucao")
    idce_frenteservico       = Column(Integer, unique=True, nullable=True)
    criado_em                = Column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em            = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    os                  = relationship("OS", back_populates="campanhas")
    equipamento         = relationship("Equipamento", back_populates="campanhas")
    coordenador_geothra = relationship("Usuario", foreign_keys=[coordenador_geothra_id], back_populates="campanhas_coordenadas")
    responsavel_medicao = relationship("Usuario", foreign_keys=[responsavel_medicao_id], back_populates="campanhas_medicao")
    furos               = relationship("Furo", back_populates="campanha")
    rdos                = relationship("RDO", back_populates="campanha")


class RDO(Base):
    __tablename__ = "rdos"

    id                = Column(Integer, primary_key=True, index=True)
    campanha_id       = Column(Integer, ForeignKey("campanhas.id"), nullable=False, index=True)
    numero_rdo        = Column(Integer, nullable=False)
    data              = Column(Date, nullable=False)
    tipo_rdo          = Column(String(50), nullable=True)
    status_rdo        = Column(StatusRDO, nullable=False, default="rascunho")
    tempo_manha       = Column(String(50), nullable=True)
    tempo_tarde       = Column(String(50), nullable=True)
    tempo_noite       = Column(String(50), nullable=True)
    horimetro_inicial = Column(Numeric(10, 2), nullable=True)
    horimetro_final   = Column(Numeric(10, 2), nullable=True)
    tem_hora_extra    = Column(Boolean, default=False, nullable=False)
    publicado         = Column(Boolean, default=False, nullable=False)
    idce_rdo          = Column(Integer, unique=True, nullable=True)
    criado_em         = Column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em     = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    campanha = relationship("Campanha", back_populates="rdos")
    furos    = relationship("RDOFuro", back_populates="rdo")


class RDOFuro(Base):
    __tablename__ = "rdos_furos"

    id              = Column(Integer, primary_key=True, index=True)
    rdo_id          = Column(Integer, ForeignKey("rdos.id"), nullable=False, index=True)
    furo_id         = Column(Integer, ForeignKey("furos.id"), nullable=False, index=True)
    prof_inicial_dia = Column(Numeric(7, 2), nullable=True)
    prof_final_dia   = Column(Numeric(7, 2), nullable=True)
    criado_em        = Column(DateTime, server_default=func.now(), nullable=False)
    atualizado_em    = Column(DateTime, server_default=func.now(), onupdate=func.now(), nullable=False)

    rdo  = relationship("RDO", back_populates="furos")
    furo = relationship("Furo", back_populates="rdos_furo")
