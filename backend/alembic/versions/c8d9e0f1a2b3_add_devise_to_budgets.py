"""add devise to budgets

Revision ID: c8d9e0f1a2b3
Revises: b7c9d2e4f6a1
Create Date: 2026-06-03 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c8d9e0f1a2b3"
down_revision: Union[str, Sequence[str], None] = "b7c9d2e4f6a1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("budgets", sa.Column("devise", sa.String(length=3), nullable=False, server_default="FC"))


def downgrade() -> None:
    op.drop_column("budgets", "devise")
