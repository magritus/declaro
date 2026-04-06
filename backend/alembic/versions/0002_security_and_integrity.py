"""security and integrity improvements

Revision ID: 0002_security_integrity
Revises: f7e8d9c0b1a2
Create Date: 2026-04-06

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002_security_integrity"
down_revision: Union[str, None] = "f7e8d9c0b1a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()

    # 1. Create user table
    op.create_table(
        "user",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email", name="uq_user_email"),
    )
    op.create_index("ix_user_email", "user", ["email"], unique=True)

    # 2. Add owner_id to mukellef (nullable first)
    op.add_column(
        "mukellef",
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("user.id"), nullable=True),
    )
    op.create_index("ix_mukellef_owner_id", "mukellef", ["owner_id"])

    # 3. If mukellef rows exist, create default admin user and assign ownership
    result = bind.execute(sa.text("SELECT COUNT(*) FROM mukellef"))
    count = result.scalar()
    if count > 0:
        # Use pgcrypto to hash a random password — no Python deps needed in migration
        bind.execute(sa.text("CREATE EXTENSION IF NOT EXISTS pgcrypto"))
        bind.execute(
            sa.text(
                "INSERT INTO \"user\" (email, hashed_password, is_active, created_at, updated_at) "
                "VALUES ('admin@declaro.local', crypt(gen_random_uuid()::text, gen_salt('bf')), true, NOW(), NOW())"
            )
        )
        user_id = bind.execute(
            sa.text("SELECT id FROM \"user\" WHERE email='admin@declaro.local'")
        ).scalar()
        bind.execute(sa.text(f"UPDATE mukellef SET owner_id = {user_id}"))

    # 4. Alter owner_id to NOT NULL
    op.alter_column("mukellef", "owner_id", nullable=False)

    # 5. Drop and recreate FK constraints with ON DELETE CASCADE
    # donem -> mukellef
    op.drop_constraint("donem_mukellef_id_fkey", "donem", type_="foreignkey")
    op.create_foreign_key(
        "donem_mukellef_id_fkey",
        "donem",
        "mukellef",
        ["mukellef_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # calisma -> donem
    op.drop_constraint("calisma_donem_id_fkey", "calisma", type_="foreignkey")
    op.create_foreign_key(
        "calisma_donem_id_fkey",
        "calisma",
        "donem",
        ["donem_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # kalem_verisi -> calisma
    op.drop_constraint("kalem_verisi_calisma_id_fkey", "kalem_verisi", type_="foreignkey")
    op.create_foreign_key(
        "kalem_verisi_calisma_id_fkey",
        "kalem_verisi",
        "calisma",
        ["calisma_id"],
        ["id"],
        ondelete="CASCADE",
    )

    # 6. Add unique constraint on donem(mukellef_id, yil, ceyrek)
    op.create_unique_constraint(
        "uq_donem_mukellef_yil_ceyrek", "donem", ["mukellef_id", "yil", "ceyrek"]
    )

    # 7. Add CHECK constraint on calisma.kar_mi_zarar_mi
    op.create_check_constraint(
        "ck_calisma_kar_zarar",
        "calisma",
        "kar_mi_zarar_mi IN ('kar', 'zarar')",
    )

    # 8. Alter DateTime columns to TIMESTAMPTZ across all tables
    for table, col in [
        ("mukellef", "created_at"),
        ("mukellef", "updated_at"),
        ("donem", "created_at"),
        ("calisma", "created_at"),
        ("calisma", "updated_at"),
        ("kalem_verisi", "created_at"),
        ("kalem_verisi", "updated_at"),
    ]:
        op.alter_column(
            table,
            col,
            type_=sa.DateTime(timezone=True),
            existing_type=sa.DateTime(),
            existing_nullable=False,
        )

    # 9. Alter mukellef.kv_orani from Float to NUMERIC(5,4)
    op.alter_column(
        "mukellef",
        "kv_orani",
        type_=sa.Numeric(5, 4),
        existing_type=sa.Float(),
        existing_nullable=False,
        existing_server_default="0.25",
    )


def downgrade() -> None:
    # Reverse kv_orani type
    op.alter_column(
        "mukellef",
        "kv_orani",
        type_=sa.Float(),
        existing_type=sa.Numeric(5, 4),
        existing_nullable=False,
        existing_server_default="0.25",
    )

    # Reverse DateTime columns
    for table, col in [
        ("mukellef", "created_at"),
        ("mukellef", "updated_at"),
        ("donem", "created_at"),
        ("calisma", "created_at"),
        ("calisma", "updated_at"),
        ("kalem_verisi", "created_at"),
        ("kalem_verisi", "updated_at"),
    ]:
        op.alter_column(
            table,
            col,
            type_=sa.DateTime(),
            existing_type=sa.DateTime(timezone=True),
            existing_nullable=False,
        )

    # Drop CHECK constraint
    op.drop_constraint("ck_calisma_kar_zarar", "calisma", type_="check")

    # Drop unique constraint on donem
    op.drop_constraint("uq_donem_mukellef_yil_ceyrek", "donem", type_="unique")

    # Restore FK constraints without CASCADE
    op.drop_constraint("kalem_verisi_calisma_id_fkey", "kalem_verisi", type_="foreignkey")
    op.create_foreign_key(
        "kalem_verisi_calisma_id_fkey",
        "kalem_verisi",
        "calisma",
        ["calisma_id"],
        ["id"],
    )

    op.drop_constraint("calisma_donem_id_fkey", "calisma", type_="foreignkey")
    op.create_foreign_key(
        "calisma_donem_id_fkey",
        "calisma",
        "donem",
        ["donem_id"],
        ["id"],
    )

    op.drop_constraint("donem_mukellef_id_fkey", "donem", type_="foreignkey")
    op.create_foreign_key(
        "donem_mukellef_id_fkey",
        "donem",
        "mukellef",
        ["mukellef_id"],
        ["id"],
    )

    # Drop owner_id from mukellef
    op.drop_index("ix_mukellef_owner_id", table_name="mukellef")
    op.drop_column("mukellef", "owner_id")

    # Drop user table
    op.drop_index("ix_user_email", table_name="user")
    op.drop_table("user")
