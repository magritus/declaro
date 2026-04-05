"""add unique constraint kalem_verisi

Revision ID: a1b2c3d4e5f6
Revises: deb44c2b850c
Create Date: 2026-04-05

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'deb44c2b850c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_unique_constraint(
        'uq_calisma_kalem',
        'kalem_verisi',
        ['calisma_id', 'ic_kod']
    )


def downgrade() -> None:
    op.drop_constraint('uq_calisma_kalem', 'kalem_verisi', type_='unique')
