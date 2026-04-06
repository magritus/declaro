"""add role to user

Revision ID: 0003_add_role_to_user
Revises: 0002_security_and_integrity
Create Date: 2026-04-06

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0003_add_role_to_user"
down_revision: Union[str, None] = "0002_security_integrity"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute(
        "DO $$ BEGIN CREATE TYPE userrole AS ENUM ('user', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;"
    )
    op.add_column(
        "user",
        sa.Column(
            "role",
            sa.Enum("user", "admin", name="userrole"),
            nullable=False,
            server_default="user",
        ),
    )
    op.execute(
        "UPDATE \"user\" SET role = 'admin' WHERE id = (SELECT id FROM \"user\" ORDER BY created_at ASC LIMIT 1)"
    )


def downgrade() -> None:
    op.drop_column("user", "role")
    op.execute("DROP TYPE IF EXISTS userrole")
