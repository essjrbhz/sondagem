"""expande_tipo_equipamento

Revision ID: 28435fe4945a
Revises: b49a0c359247
Create Date: 2026-05-05 23:20:04.943868

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '28435fe4945a'
down_revision: Union[str, None] = 'b49a0c359247'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # PostgreSQL: ADD VALUE é transacional a partir do Postgres 12 (IF NOT EXISTS)
    op.execute("ALTER TYPE tipo_equipamento ADD VALUE IF NOT EXISTS 'tripe'")
    op.execute("ALTER TYPE tipo_equipamento ADD VALUE IF NOT EXISTS 'trado'")
    op.execute("ALTER TYPE tipo_equipamento ADD VALUE IF NOT EXISTS 'radar_penetracao'")
    op.execute("ALTER TYPE tipo_equipamento ADD VALUE IF NOT EXISTS 'resistividade'")


def downgrade() -> None:
    # Remover valores de enum no PostgreSQL exige recriar o tipo — não implementado.
    # Para reverter: aplicar downgrade manual ou recriar o enum sem os valores novos.
    pass
