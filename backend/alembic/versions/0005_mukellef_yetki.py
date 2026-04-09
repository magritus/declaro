"""Add mukellef_yetki table for user-company access control

Revision ID: 0005
Revises: 0004
Create Date: 2026-04-09
"""
from alembic import op
import sqlalchemy as sa

revision = "0005"
down_revision = "0004_katalog_yonetimi"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "mukellef_yetki",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("mukellef_id", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=True,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["mukellef_id"], ["mukellef.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "mukellef_id", name="uq_mukellef_yetki"),
    )
    op.create_index(op.f("ix_mukellef_yetki_user_id"), "mukellef_yetki", ["user_id"])
    op.create_index(op.f("ix_mukellef_yetki_mukellef_id"), "mukellef_yetki", ["mukellef_id"])

    # Mevcut owner_id kayıtlarını mukellef_yetki tablosuna aktar
    op.execute(
        "INSERT INTO mukellef_yetki (user_id, mukellef_id) "
        "SELECT owner_id, id FROM mukellef WHERE owner_id IS NOT NULL"
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_mukellef_yetki_mukellef_id"), table_name="mukellef_yetki")
    op.drop_index(op.f("ix_mukellef_yetki_user_id"), table_name="mukellef_yetki")
    op.drop_table("mukellef_yetki")
