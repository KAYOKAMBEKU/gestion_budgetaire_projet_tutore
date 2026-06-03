"""ensure budget devise column

Revision ID: d4e5f6a7b8c9
Revises: c8d9e0f1a2b3
Create Date: 2026-06-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "c8d9e0f1a2b3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _has_column(table_name: str, column_name: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    if not _has_column("budgets", "devise"):
        op.add_column("budgets", sa.Column("devise", sa.String(length=3), nullable=True, server_default="FC"))

    op.execute("UPDATE budgets SET devise = 'FC' WHERE devise IS NULL")
    op.alter_column("budgets", "devise", existing_type=sa.String(length=3), nullable=False, server_default="FC")


def downgrade() -> None:
    if _has_column("budgets", "devise"):
        op.drop_column("budgets", "devise")
