from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.ligne_budgetaire import LigneBudgetaire
from app.models.realisation import Realisation
from app.schemas.ligne_budgetaire import LigneBudgetaireCreate, LigneBudgetaireUpdate
from app.services._utils import decimal_sum, schema_to_dict, update_model, validate_non_negative


def get_ligne_by_id(db: Session, ligne_id: int):
    return db.query(LigneBudgetaire).filter(LigneBudgetaire.id == ligne_id).first()


def get_by_id(db: Session, id: int):
    return get_ligne_by_id(db, id)


def get_lignes(db: Session, skip: int = 0, limit: int = 100):
    return db.query(LigneBudgetaire).offset(skip).limit(limit).all()


def get_all(db: Session, skip: int = 0, limit: int = 100):
    return get_lignes(db, skip, limit)


def get_lignes_by_budget(db: Session, budget_id: int):
    return db.query(LigneBudgetaire).filter(LigneBudgetaire.budget_id == budget_id).all()


def get_lignes_by_categorie(db: Session, categorie_id: int):
    return db.query(LigneBudgetaire).filter(LigneBudgetaire.categorie_id == categorie_id).all()


def create_ligne(db: Session, ligne_in: LigneBudgetaireCreate):
    data = schema_to_dict(ligne_in, exclude_unset=False)
    validate_non_negative(data.get("montant_prevu"), "montant_prevu")
    data["montant_realise"] = Decimal("0")
    data["ecart_montant"] = Decimal("0") - Decimal(data.get("montant_prevu") or 0)
    data["ecart_pourcentage"] = Decimal("-100") if Decimal(data.get("montant_prevu") or 0) > 0 else Decimal("0")
    ligne = LigneBudgetaire(**data)
    db.add(ligne)
    db.commit()
    db.refresh(ligne)
    from app.services.budget_service import recalculate_budget_totals

    recalculate_budget_totals(db, ligne.budget_id)
    return ligne


def create(db: Session, obj_in: LigneBudgetaireCreate):
    return create_ligne(db, obj_in)


def update_ligne(db: Session, ligne_id: int, ligne_in: LigneBudgetaireUpdate):
    ligne = get_ligne_by_id(db, ligne_id)
    if ligne is None:
        return None
    old_budget_id = ligne.budget_id
    data = schema_to_dict(ligne_in)
    validate_non_negative(data.get("montant_prevu"), "montant_prevu")
    update_model(ligne, ligne_in)
    db.commit()
    db.refresh(ligne)
    recalculate_ligne(db, ligne.id)
    if old_budget_id != ligne.budget_id:
        from app.services.budget_service import recalculate_budget_totals

        recalculate_budget_totals(db, old_budget_id)
    return get_ligne_by_id(db, ligne.id)


def update(db: Session, db_obj, obj_in: LigneBudgetaireUpdate):
    update_model(db_obj, obj_in)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_ligne(db: Session, ligne_id: int):
    ligne = get_ligne_by_id(db, ligne_id)
    if ligne is None:
        return None
    budget_id = ligne.budget_id
    db.delete(ligne)
    db.commit()
    from app.services.budget_service import recalculate_budget_totals

    recalculate_budget_totals(db, budget_id)
    return ligne


def delete(db: Session, id: int):
    return delete_ligne(db, id)


def recalculate_ligne(db: Session, ligne_id: int):
    ligne = get_ligne_by_id(db, ligne_id)
    if ligne is None:
        return None
    # Seules les realisations validees alimentent le realise de la ligne.
    validated = db.query(Realisation).filter(
        Realisation.ligne_budgetaire_id == ligne_id,
        Realisation.statut == "validee",
    ).all()
    ligne.montant_realise = decimal_sum(realisation.montant_realise for realisation in validated)
    ligne.ecart_montant = Decimal(ligne.montant_realise or 0) - Decimal(ligne.montant_prevu or 0)
    if Decimal(ligne.montant_prevu or 0) > 0:
        ligne.ecart_pourcentage = (ligne.ecart_montant / Decimal(ligne.montant_prevu)) * Decimal("100")
    else:
        ligne.ecart_pourcentage = Decimal("0")
    db.commit()
    db.refresh(ligne)
    from app.services.budget_service import recalculate_budget_totals
    from app.services.ecart_budgetaire_service import calculate_ecart_for_ligne

    calculate_ecart_for_ligne(db, ligne.id)
    recalculate_budget_totals(db, ligne.budget_id)
    return ligne
