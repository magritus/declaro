"""add kv_orani to mukellef

Revision ID: a1b2c3d4e5f6
Revises: add_unique_constraint_kalem_verisi
Create Date: 2026-04-06

"""
from alembic import op
import sqlalchemy as sa

revision = 'f7e8d9c0b1a2'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('mukellef', sa.Column('kv_orani', sa.Float(), nullable=False, server_default='0.25'))


def downgrade() -> None:
    op.drop_column('mukellef', 'kv_orani')
