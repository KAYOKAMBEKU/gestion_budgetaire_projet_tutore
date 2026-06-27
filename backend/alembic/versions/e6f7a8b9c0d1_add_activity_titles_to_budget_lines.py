"""add activity titles to budget lines

Revision ID: e6f7a8b9c0d1
Revises: d4e5f6a7b8c9
Create Date: 2026-06-26 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e6f7a8b9c0d1"
down_revision: Union[str, Sequence[str], None] = "d4e5f6a7b8c9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("lignes_budgetaires", sa.Column("activite", sa.String(length=150), nullable=True))
    op.add_column("lignes_budgetaires", sa.Column("grand_titre", sa.String(length=150), nullable=True))
    op.add_column("lignes_budgetaires", sa.Column("sous_titre", sa.String(length=150), nullable=True))


def downgrade() -> None:
    op.drop_column("lignes_budgetaires", "sous_titre")
    op.drop_column("lignes_budgetaires", "grand_titre")
    op.drop_column("lignes_budgetaires", "activite")
