from decimal import Decimal

from sqlalchemy.orm import Session

from app.models.ecart_budgetaire import EcartBudgetaire
from app.models.ligne_budgetaire import LigneBudgetaire
from app.schemas.ecart_budgetaire import EcartBudgetaireCreate, EcartBudgetaireUpdate
from app.services._utils import schema_to_dict, update_model


def get_ecart_by_id(db: Session, ecart_id: int):
    return db.query(EcartBudgetaire).filter(EcartBudgetaire.id == ecart_id).first()


def get_by_id(db: Session, id: int):
    return get_ecart_by_id(db, id)


def get_ecart_by_ligne(db: Session, ligne_budgetaire_id: int):
    return db.query(EcartBudgetaire).filter(EcartBudgetaire.ligne_budgetaire_id == ligne_budgetaire_id).first()


def get_ecarts(db: Session, skip: int = 0, limit: int = 100):
    return db.query(EcartBudgetaire).offset(skip).limit(limit).all()


def get_all(db: Session, skip: int = 0, limit: int = 100):
    return get_ecarts(db, skip, limit)


def get_ecarts_by_nature(db: Session, nature_ecart: str):
    return db.query(EcartBudgetaire).filter(EcartBudgetaire.nature_ecart == nature_ecart).all()


def get_ecarts_by_niveau_alerte(db: Session, niveau_alerte: str):
    return db.query(EcartBudgetaire).filter(EcartBudgetaire.niveau_alerte == niveau_alerte).all()


def create_ecart(db: Session, ecart_in: EcartBudgetaireCreate):
    data = schema_to_dict(ecart_in, exclude_unset=False)
    existing = get_ecart_by_ligne(db, data["ligne_budgetaire_id"])
    if existing is not None:
        return existing
    ecart = EcartBudgetaire(**data)
    db.add(ecart)
    db.commit()
    db.refresh(ecart)
    return calculate_ecart_for_ligne(db, ecart.ligne_budgetaire_id)


def create(db: Session, obj_in: EcartBudgetaireCreate):
    return create_ecart(db, obj_in)


def update_ecart(db: Session, ecart_id: int, ecart_in: EcartBudgetaireUpdate):
    ecart = get_ecart_by_id(db, ecart_id)
    if ecart is None:
        return None
    update_model(ecart, ecart_in)
    db.commit()
    db.refresh(ecart)
    return ecart


def update(db: Session, db_obj, obj_in: EcartBudgetaireUpdate):
    update_model(db_obj, obj_in)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_ecart(db: Session, ecart_id: int):
    ecart = get_ecart_by_id(db, ecart_id)
    if ecart is None:
        return None
    db.delete(ecart)
    db.commit()
    return ecart


def delete(db: Session, id: int):
    return delete_ecart(db, id)


def _nature_ecart(type_ligne: str, ecart_montant: Decimal) -> str:
    if ecart_montant == 0:
        return "neutre"
    if type_ligne == "depense":
        return "defavorable" if ecart_montant > 0 else "favorable"
    if type_ligne == "recette":
        return "favorable" if ecart_montant > 0 else "defavorable"
    return "neutre"


def _niveau_alerte(ecart_pourcentage: Decimal) -> str:
    value = abs(ecart_pourcentage)
    if value > 30:
        return "critique"
    if value > 15:
        return "eleve"
    if value > 5:
        return "moyen"
    return "faible"


def calculate_ecart_for_ligne(db: Session, ligne_budgetaire_id: int):
    ligne = db.query(LigneBudgetaire).filter(LigneBudgetaire.id == ligne_budgetaire_id).first()
    if ligne is None:
        return None
    montant_prevu = Decimal(ligne.montant_prevu or 0)
    montant_realise = Decimal(ligne.montant_realise or 0)
    ecart_montant = montant_realise - montant_prevu
    ecart_pourcentage = (ecart_montant / montant_prevu) * Decimal("100") if montant_prevu > 0 else Decimal("0")
    # Calcul de la nature et du niveau d'alerte selon les regles metier.
    ecart = get_ecart_by_ligne(db, ligne_budgetaire_id) or EcartBudgetaire(ligne_budgetaire_id=ligne_budgetaire_id)
    ecart.montant_prevu = montant_prevu
    ecart.montant_realise = montant_realise
    ecart.ecart_montant = ecart_montant
    ecart.ecart_pourcentage = ecart_pourcentage
    ecart.nature_ecart = _nature_ecart(ligne.type_ligne, ecart_montant)
    ecart.niveau_alerte = _niveau_alerte(ecart_pourcentage)
    db.add(ecart)
    db.commit()
    db.refresh(ecart)
    return ecart
