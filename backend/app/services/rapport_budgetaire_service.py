from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.ecart_budgetaire import EcartBudgetaire
from app.models.rapport_budgetaire import RapportBudgetaire
from app.schemas.rapport_budgetaire import RapportBudgetaireCreate, RapportBudgetaireUpdate
from app.services._utils import schema_to_dict, update_model


def get_rapport_by_id(db: Session, rapport_id: int):
    return db.query(RapportBudgetaire).filter(RapportBudgetaire.id == rapport_id).first()


def get_by_id(db: Session, id: int):
    return get_rapport_by_id(db, id)


def get_rapports(db: Session, skip: int = 0, limit: int = 100):
    return db.query(RapportBudgetaire).offset(skip).limit(limit).all()


def get_all(db: Session, skip: int = 0, limit: int = 100):
    return get_rapports(db, skip, limit)


def get_rapports_by_budget(db: Session, budget_id: int):
    return db.query(RapportBudgetaire).filter(RapportBudgetaire.budget_id == budget_id).all()


def get_rapports_by_user(db: Session, utilisateur_id: int):
    return db.query(RapportBudgetaire).filter(RapportBudgetaire.utilisateur_id == utilisateur_id).all()


def create_rapport(db: Session, rapport_in: RapportBudgetaireCreate):
    rapport = RapportBudgetaire(**schema_to_dict(rapport_in, exclude_unset=False))
    db.add(rapport)
    db.commit()
    db.refresh(rapport)
    return rapport


def create(db: Session, obj_in: RapportBudgetaireCreate):
    return create_rapport(db, obj_in)


def update_rapport(db: Session, rapport_id: int, rapport_in: RapportBudgetaireUpdate):
    rapport = get_rapport_by_id(db, rapport_id)
    if rapport is None:
        return None
    update_model(rapport, rapport_in)
    db.commit()
    db.refresh(rapport)
    return rapport


def update(db: Session, db_obj, obj_in: RapportBudgetaireUpdate):
    update_model(db_obj, obj_in)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_rapport(db: Session, rapport_id: int):
    rapport = get_rapport_by_id(db, rapport_id)
    if rapport is None:
        return None
    db.delete(rapport)
    db.commit()
    return rapport


def delete(db: Session, id: int):
    return delete_rapport(db, id)


def generate_budget_summary(db: Session, budget_id: int):
    budget = db.query(Budget).filter(Budget.id == budget_id).first()
    if budget is None:
        return None
    lignes = budget.lignes_budgetaires
    total_prevu = Decimal(budget.montant_total_prevu or 0)
    total_realise = Decimal(budget.montant_total_realise or 0)
    taux_execution = (total_realise / total_prevu) * Decimal("100") if total_prevu > 0 else Decimal("0")
    ligne_ids = [ligne.id for ligne in lignes]
    lignes_en_ecart = sum(1 for ligne in lignes if Decimal(ligne.ecart_montant or 0) != 0)
    ecarts_critiques = 0
    if ligne_ids:
        ecarts_critiques = db.query(EcartBudgetaire).filter(
            EcartBudgetaire.ligne_budgetaire_id.in_(ligne_ids),
            EcartBudgetaire.niveau_alerte == "critique",
        ).count()
    # Donnees pretes pour un futur export PDF/Excel.
    return {
        "budget": budget,
        "total_prevu": total_prevu,
        "total_realise": total_realise,
        "ecart_total": Decimal(budget.ecart_total or 0),
        "nombre_lignes": len(lignes),
        "lignes_en_ecart": lignes_en_ecart,
        "ecarts_critiques": ecarts_critiques,
        "taux_execution": taux_execution,
    }
