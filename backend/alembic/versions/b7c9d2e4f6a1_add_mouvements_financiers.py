"""add mouvements financiers

Revision ID: b7c9d2e4f6a1
Revises: 9d8f1a2c4b5e
Create Date: 2026-05-27 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "b7c9d2e4f6a1"
down_revision: Union[str, Sequence[str], None] = "9d8f1a2c4b5e"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "budgets",
        sa.Column("total_recettes_realisees", sa.Numeric(precision=15, scale=2), nullable=True, server_default="0"),
    )
    op.add_column(
        "budgets",
        sa.Column("total_depenses_realisees", sa.Numeric(precision=15, scale=2), nullable=True, server_default="0"),
    )
    op.add_column(
        "budgets",
        sa.Column("taux_execution_budgetaire", sa.Numeric(precision=10, scale=2), nullable=True, server_default="0"),
    )

    op.create_table(
        "mouvements_financiers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("projet_id", sa.Integer(), nullable=False),
        sa.Column("budget_id", sa.Integer(), nullable=False),
        sa.Column("ligne_budgetaire_id", sa.Integer(), nullable=True),
        sa.Column("type_mouvement", sa.String(length=20), nullable=False),
        sa.Column("categorie", sa.String(length=100), nullable=True),
        sa.Column("libelle", sa.String(length=150), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("montant", sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column("date_mouvement", sa.Date(), nullable=False),
        sa.Column("mode_paiement", sa.String(length=100), nullable=True),
        sa.Column("reference_paiement", sa.String(length=150), nullable=True),
        sa.Column("piece_justificative", sa.String(length=255), nullable=True),
        sa.Column("comptable_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.CheckConstraint("type_mouvement in ('entree', 'sortie')", name="ck_mouvements_financiers_type"),
        sa.ForeignKeyConstraint(["budget_id"], ["budgets.id"], name="fk_mouvements_financiers_budget_id_budgets"),
        sa.ForeignKeyConstraint(
            ["ligne_budgetaire_id"],
            ["lignes_budgetaires.id"],
            name="fk_mouvements_financiers_ligne_budgetaire_id_lignes_budgetaires",
        ),
        sa.ForeignKeyConstraint(["comptable_id"], ["users.id"], name="fk_mouvements_financiers_comptable_id_users"),
        sa.ForeignKeyConstraint(["projet_id"], ["projets.id"], name="fk_mouvements_financiers_projet_id_projets"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_mouvements_financiers_id"), "mouvements_financiers", ["id"], unique=False)
    op.create_index(op.f("ix_mouvements_financiers_projet_id"), "mouvements_financiers", ["projet_id"], unique=False)
    op.create_index(op.f("ix_mouvements_financiers_budget_id"), "mouvements_financiers", ["budget_id"], unique=False)
    op.create_index(
        op.f("ix_mouvements_financiers_ligne_budgetaire_id"),
        "mouvements_financiers",
        ["ligne_budgetaire_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_mouvements_financiers_comptable_id"),
        "mouvements_financiers",
        ["comptable_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_mouvements_financiers_comptable_id"), table_name="mouvements_financiers")
    op.drop_index(op.f("ix_mouvements_financiers_ligne_budgetaire_id"), table_name="mouvements_financiers")
    op.drop_index(op.f("ix_mouvements_financiers_budget_id"), table_name="mouvements_financiers")
    op.drop_index(op.f("ix_mouvements_financiers_projet_id"), table_name="mouvements_financiers")
    op.drop_index(op.f("ix_mouvements_financiers_id"), table_name="mouvements_financiers")
    op.drop_table("mouvements_financiers")
    op.drop_column("budgets", "taux_execution_budgetaire")
    op.drop_column("budgets", "total_depenses_realisees")
    op.drop_column("budgets", "total_recettes_realisees")
