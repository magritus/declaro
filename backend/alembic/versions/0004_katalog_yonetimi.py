"""katalog yonetimi

Revision ID: 0004_katalog_yonetimi
Revises: 0003_add_role_to_user
Create Date: 2026-04-08

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004_katalog_yonetimi"
down_revision: Union[str, None] = "0003_add_role_to_user"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "admin_config",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("config_key", sa.String(100), nullable=False),
        sa.Column("config_value", sa.JSON(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("updated_by", sa.Integer(), sa.ForeignKey("user.id"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("config_key"),
    )
    op.create_index("ix_admin_config_config_key", "admin_config", ["config_key"])

    op.create_table(
        "ana_kategori",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("kod", sa.String(100), nullable=False),
        sa.Column("soru", sa.Text(), nullable=False),
        sa.Column("etiket", sa.String(200), nullable=False, server_default=""),
        sa.Column("bilgi", sa.Text(), nullable=True),
        sa.Column("grup", sa.String(50), nullable=False),
        sa.Column("beyanname_kodlari", sa.JSON(), nullable=True),
        sa.Column("sira", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("aktif", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("kod"),
    )
    op.create_index("ix_ana_kategori_kod", "ana_kategori", ["kod"])

    op.create_table(
        "kalem_override",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("ic_kod", sa.String(100), nullable=False),
        sa.Column("aktif", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("sira", sa.Integer(), nullable=True),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column("updated_by", sa.Integer(), sa.ForeignKey("user.id"), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("ic_kod"),
    )
    op.create_index("ix_kalem_override_ic_kod", "kalem_override", ["ic_kod"])


def downgrade() -> None:
    op.drop_index("ix_kalem_override_ic_kod", table_name="kalem_override")
    op.drop_table("kalem_override")

    op.drop_index("ix_ana_kategori_kod", table_name="ana_kategori")
    op.drop_table("ana_kategori")

    op.drop_index("ix_admin_config_config_key", table_name="admin_config")
    op.drop_table("admin_config")
