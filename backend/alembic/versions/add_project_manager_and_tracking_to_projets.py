"""add project manager and tracking fields to projets

Revision ID: 9d8f1a2c4b5e
Revises: 36578ff6d948
Create Date: 2026-05-20 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '9d8f1a2c4b5e'
down_revision: Union[str, Sequence[str], None] = '36578ff6d948'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('projets', sa.Column('chef_projet_id', sa.Integer(), nullable=True))
    op.add_column('projets', sa.Column('date_modification', sa.DateTime(), nullable=True))
    op.add_column('projets', sa.Column('resultat_attendu', sa.Text(), nullable=True))
    op.add_column('projets', sa.Column('budget_realise_total', sa.Numeric(precision=15, scale=2), nullable=True))
    op.create_foreign_key(
        'fk_projets_chef_projet_id_users',
        'projets',
        'users',
        ['chef_projet_id'],
        ['id'],
    )


def downgrade() -> None:
    op.drop_constraint('fk_projets_chef_projet_id_users', 'projets', type_='foreignkey')
    op.drop_column('projets', 'budget_realise_total')
    op.drop_column('projets', 'resultat_attendu')
    op.drop_column('projets', 'date_modification')
    op.drop_column('projets', 'chef_projet_id')
