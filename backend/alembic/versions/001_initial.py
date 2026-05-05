"""initial schema

Revision ID: 001
Revises:
Create Date: 2026-04-10
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# Definir ENUMs uma vez — create_type=False nas colunas impede que SQLAlchemy
# tente recriá-los durante op.create_table
status_furo        = postgresql.ENUM("Pendente", "Em Execução", "Concluído", "Cancelado", name="status_furo",        create_type=False)
categoria_atividade = postgresql.ENUM("Ensaio", "Coleta",                                  name="categoria_atividade", create_type=False)
role_usuario        = postgresql.ENUM("admin",   "gerente",     "tecnico",                 name="role_usuario",        create_type=False)


def upgrade() -> None:
    bind = op.get_bind()

    # Cria os tipos no banco com checkfirst=True (idempotente)
    status_furo.create(bind, checkfirst=True)
    categoria_atividade.create(bind, checkfirst=True)
    role_usuario.create(bind, checkfirst=True)

    op.create_table(
        "clientes",
        sa.Column("id",            sa.Integer(),   primary_key=True),
        sa.Column("nome",          sa.String(200), nullable=False),
        sa.Column("cnpj",          sa.String(18),  nullable=True, unique=True),
        sa.Column("criado_em",     sa.DateTime(),  server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(),  server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "sondas",
        sa.Column("id",            sa.Integer(),  primary_key=True),
        sa.Column("nome",          sa.String(100), nullable=False),
        sa.Column("ativa",         sa.Boolean(),   nullable=False, server_default="true"),
        sa.Column("criado_em",     sa.DateTime(),  server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(),  server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "projetos",
        sa.Column("id",            sa.Integer(),   primary_key=True),
        sa.Column("codigo",        sa.String(20),  nullable=False, unique=True),
        sa.Column("nome",          sa.String(300), nullable=False),
        sa.Column("cliente_id",    sa.Integer(),   sa.ForeignKey("clientes.id"), nullable=False),
        sa.Column("sonda_id",      sa.Integer(),   sa.ForeignKey("sondas.id"),   nullable=False),
        sa.Column("cidade",        sa.String(100), nullable=False),
        sa.Column("uf",            sa.String(2),   nullable=False),
        sa.Column("criado_em",     sa.DateTime(),  server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(),  server_default=sa.func.now(), nullable=False),
    )

    op.create_table(
        "furos",
        sa.Column("id",               sa.Integer(),       primary_key=True),
        sa.Column("projeto_id",       sa.Integer(),       sa.ForeignKey("projetos.id"), nullable=False),
        sa.Column("id_furo",          sa.String(50),      nullable=False),
        sa.Column("tipo_furo",        sa.String(20),      nullable=True),
        sa.Column("coordenada_e",     sa.Numeric(12, 3),  nullable=True),
        sa.Column("coordenada_n",     sa.Numeric(12, 3),  nullable=True),
        sa.Column("prof_prevista_m",  sa.Numeric(7, 2),   nullable=True),
        sa.Column("prof_realizada_m", sa.Numeric(7, 2),   nullable=True),
        sa.Column("data_inicio",      sa.Date(),          nullable=True),
        sa.Column("data_termino",     sa.Date(),          nullable=True),
        sa.Column("status",           status_furo,        nullable=False, server_default="Pendente"),
        sa.Column("ativo",            sa.Boolean(),       nullable=False, server_default="true"),
        sa.Column("criado_em",        sa.DateTime(),      server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em",    sa.DateTime(),      server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "data_termino IS NULL OR data_inicio IS NULL OR data_termino >= data_inicio",
            name="chk_furo_datas",
        ),
    )
    op.create_index("ix_furos_projeto_id", "furos", ["projeto_id"])

    op.create_table(
        "atividades_furo",
        sa.Column("id",            sa.Integer(),       primary_key=True),
        sa.Column("furo_id",       sa.Integer(),       sa.ForeignKey("furos.id"), nullable=False),
        sa.Column("categoria",     categoria_atividade, nullable=False),
        sa.Column("tipo",          sa.String(30),      nullable=True),
        sa.Column("prof_inicio_m", sa.Numeric(7, 2),   nullable=True),
        sa.Column("prof_fim_m",    sa.Numeric(7, 2),   nullable=True),
        sa.Column("criado_em",     sa.DateTime(),      server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(),      server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint(
            "prof_inicio_m IS NULL OR prof_fim_m IS NULL OR prof_fim_m > prof_inicio_m",
            name="chk_atividade_prof",
        ),
    )
    op.create_index("ix_atividades_furo_furo_id", "atividades_furo", ["furo_id"])

    op.create_table(
        "usuarios",
        sa.Column("id",            sa.Integer(),   primary_key=True),
        sa.Column("nome",          sa.String(150), nullable=False),
        sa.Column("email",         sa.String(150), nullable=False, unique=True),
        sa.Column("senha_hash",    sa.String(200), nullable=False),
        sa.Column("role",          role_usuario,   nullable=False, server_default="tecnico"),
        sa.Column("ativo",         sa.Boolean(),   nullable=False, server_default="true"),
        sa.Column("criado_em",     sa.DateTime(),  server_default=sa.func.now(), nullable=False),
        sa.Column("atualizado_em", sa.DateTime(),  server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    bind = op.get_bind()
    op.drop_table("usuarios")
    op.drop_table("atividades_furo")
    op.drop_table("furos")
    op.drop_table("projetos")
    op.drop_table("sondas")
    op.drop_table("clientes")
    status_furo.drop(bind, checkfirst=True)
    categoria_atividade.drop(bind, checkfirst=True)
    role_usuario.drop(bind, checkfirst=True)
