from sqlalchemy.orm import Session

from app.models.action_corrective import ActionCorrective
from app.schemas.action_corrective import ActionCorrectiveCreate, ActionCorrectiveUpdate
from app.services._utils import schema_to_dict, update_model

VALID_STATUTS = {"planifiee", "en_cours", "terminee", "annulee"}


def _validate_dates(date_debut, date_fin) -> None:
    if date_debut is not None and date_fin is not None and date_fin < date_debut:
        raise ValueError("date_fin doit etre superieure ou egale a date_debut")


def get_action_by_id(db: Session, action_id: int):
    return db.query(ActionCorrective).filter(ActionCorrective.id == action_id).first()


def get_by_id(db: Session, id: int):
    return get_action_by_id(db, id)


def get_actions(db: Session, skip: int = 0, limit: int = 100):
    return db.query(ActionCorrective).offset(skip).limit(limit).all()


def get_all(db: Session, skip: int = 0, limit: int = 100):
    return get_actions(db, skip, limit)


def get_actions_by_analyse(db: Session, analyse_id: int):
    return db.query(ActionCorrective).filter(ActionCorrective.analyse_id == analyse_id).all()


def get_actions_by_statut(db: Session, statut: str):
    return db.query(ActionCorrective).filter(ActionCorrective.statut == statut).all()


def create_action(db: Session, action_in: ActionCorrectiveCreate):
    data = schema_to_dict(action_in, exclude_unset=False)
    _validate_dates(data.get("date_debut"), data.get("date_fin"))
    if data.get("statut") not in VALID_STATUTS:
        raise ValueError("Statut d'action corrective invalide")
    action = ActionCorrective(**data)
    db.add(action)
    db.commit()
    db.refresh(action)
    return action


def create(db: Session, obj_in: ActionCorrectiveCreate):
    return create_action(db, obj_in)


def update_action(db: Session, action_id: int, action_in: ActionCorrectiveUpdate):
    action = get_action_by_id(db, action_id)
    if action is None:
        return None
    data = schema_to_dict(action_in)
    _validate_dates(data.get("date_debut", action.date_debut), data.get("date_fin", action.date_fin))
    if "statut" in data and data["statut"] not in VALID_STATUTS:
        raise ValueError("Statut d'action corrective invalide")
    update_model(action, action_in)
    db.commit()
    db.refresh(action)
    return action


def update(db: Session, db_obj, obj_in: ActionCorrectiveUpdate):
    update_model(db_obj, obj_in)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_action(db: Session, action_id: int):
    action = get_action_by_id(db, action_id)
    if action is None:
        return None
    db.delete(action)
    db.commit()
    return action


def delete(db: Session, id: int):
    return delete_action(db, id)


def _set_action_statut(db: Session, action_id: int, statut: str):
    action = get_action_by_id(db, action_id)
    if action is None:
        return None
    action.statut = statut
    db.commit()
    db.refresh(action)
    return action


def start_action(db: Session, action_id: int):
    return _set_action_statut(db, action_id, "en_cours")


def complete_action(db: Session, action_id: int):
    return _set_action_statut(db, action_id, "terminee")


def cancel_action(db: Session, action_id: int):
    return _set_action_statut(db, action_id, "annulee")
