from sqlalchemy.orm import Session
from uuid import uuid4

from app.models.departement import Departement
from app.models.exercice_budgetaire import ExerciceBudgetaire
from app.models.projet import Projet
from app.models.user import User
from app.schemas.projet import ProjetCreate, ProjetUpdate
from app.services._utils import schema_to_dict, update_model

VALID_STATUTS = {"brouillon", "soumis", "approuve", "rejete", "en_execution", "cloture"}
ROLE_CHEF_PROJET = "chef de projet"
ROLE_GESTIONNAIRE = "gestionnaire"
PROJECT_CODE_PREFIX = "AFGLPR00"


def generate_project_code(project_id: int) -> str:
    return f"{PROJECT_CODE_PREFIX}{project_id}"


def _has_role(user: User, role_keyword: str) -> bool:
    if user is None:
        return False
    for role in user.roles:
        if (role.nom_role or "").strip().lower() == role_keyword:
            return True
    return False


def _is_chef_de_projet(user: User) -> bool:
    return _has_role(user, ROLE_CHEF_PROJET)


def _is_gestionnaire(user: User) -> bool:
    if user is None:
        return False
    return any(ROLE_GESTIONNAIRE in (role.nom_role or "").strip().lower() for role in user.roles)


def get_projet_by_id(db: Session, projet_id: int):
    return db.query(Projet).filter(Projet.id == projet_id).first()


def get_projet_by_code(db: Session, code: str):
    return db.query(Projet).filter(Projet.code == code).first()


def get_projets(db: Session, skip: int = 0, limit: int = 100, departement_id: int | None = None, chef_projet_id: int | None = None, statut: str | None = None):
    query = db.query(Projet)
    if departement_id is not None:
        query = query.filter(Projet.departement_id == departement_id)
    if chef_projet_id is not None:
        query = query.filter(Projet.chef_projet_id == chef_projet_id)
    if statut is not None:
        query = query.filter(Projet.statut == statut)
    return query.offset(skip).limit(limit).all()


def get_projets_by_departement(db: Session, departement_id: int):
    return db.query(Projet).filter(Projet.departement_id == departement_id).all()


def get_projets_by_exercice(db: Session, exercice_id: int):
    return db.query(Projet).filter(Projet.exercice_id == exercice_id).all()


def get_projets_by_gestionnaire(db: Session, gestionnaire_id: int):
    return db.query(Projet).filter(Projet.chef_projet_id == gestionnaire_id).all()


def get_projets_by_statut(db: Session, statut: str):
    return db.query(Projet).filter(Projet.statut == statut).all()


def create_projet(db: Session, projet_in: ProjetCreate, current_user: User):
    if not _is_chef_de_projet(current_user):
        if _is_gestionnaire(current_user):
            raise PermissionError("Le Gestionnaire ne peut pas creer de projet. Il supervise uniquement les projets des Chefs de projet de son departement.")
        raise PermissionError("Seul un utilisateur ayant le role 'Chef de projet' peut creer un projet.")
    data = schema_to_dict(projet_in, exclude_unset=False)
    data.pop("code", None)

    departement = db.query(Departement).filter(Departement.id == data["departement_id"]).first()
    if departement is None:
        raise ValueError("Departement introuvable")

    exercice = db.query(ExerciceBudgetaire).filter(ExerciceBudgetaire.id == data["exercice_id"]).first()
    if exercice is None:
        raise ValueError("Exercice budgetaire introuvable")

    projet = Projet(
        **data,
        code=f"TMP-{uuid4().hex}",
        created_by_id=current_user.id,
        chef_projet_id=current_user.id,
    )
    db.add(projet)
    db.flush()
    projet.code = generate_project_code(projet.id)
    db.commit()
    db.refresh(projet)
    return projet


def update_projet(db: Session, projet_id: int, projet_in: ProjetUpdate):
    projet = get_projet_by_id(db, projet_id)
    if projet is None:
        return None

    data = schema_to_dict(projet_in)
    if "code" in data:
        raise ValueError("Le code du projet est genere automatiquement et ne peut pas etre modifie.")

    candidate_departement_id = data.get("departement_id", projet.departement_id)
    candidate_chef_projet_id = data.get("chef_projet_id", projet.chef_projet_id)

    if "departement_id" in data:
        departement = db.query(Departement).filter(Departement.id == data["departement_id"]).first()
        if departement is None:
            raise ValueError("Departement introuvable")

    if "exercice_id" in data:
        exercice = db.query(ExerciceBudgetaire).filter(ExerciceBudgetaire.id == data["exercice_id"]).first()
        if exercice is None:
            raise ValueError("Exercice budgetaire introuvable")

    if "chef_projet_id" in data:
        chef_projet = db.query(User).filter(User.id == data["chef_projet_id"]).first()
        if chef_projet is None:
            raise ValueError("Chef de projet introuvable")
        if not _is_chef_de_projet(chef_projet):
            raise ValueError("Le chef de projet doit avoir le bon rôle")
        if chef_projet.departement_id is None:
            raise ValueError("Le chef de projet doit appartenir a un departement")

    if candidate_chef_projet_id is not None:
        chef_projet = db.query(User).filter(User.id == candidate_chef_projet_id).first()
        if chef_projet is None:
            raise ValueError("Chef de projet introuvable")
        if chef_projet.departement_id is None or chef_projet.departement_id != candidate_departement_id:
            raise ValueError("Le chef de projet doit appartenir au meme departement que le projet")

    if "created_by_id" in data:
        created_by = db.query(User).filter(User.id == data["created_by_id"]).first()
        if created_by is None:
            raise ValueError("Utilisateur createur introuvable")

    if "statut" in data and data["statut"] not in VALID_STATUTS:
        raise ValueError("Statut de projet invalide")

    update_model(projet, projet_in)
    db.commit()
    db.refresh(projet)
    return projet


def delete_projet(db: Session, projet_id: int):
    projet = get_projet_by_id(db, projet_id)
    if projet is None:
        return None
    db.delete(projet)
    db.commit()
    return projet


def _transition_projet(db: Session, projet_id: int, allowed: set[str], target: str):
    projet = get_projet_by_id(db, projet_id)
    if projet is None:
        return None
    if projet.statut not in allowed:
        raise ValueError(f"Transition de statut invalide: {projet.statut} vers {target}")
    projet.statut = target
    db.commit()
    db.refresh(projet)
    return projet


def submit_projet(db: Session, projet_id: int):
    projet = get_projet_by_id(db, projet_id)
    if projet is None:
        return None
    if projet.budget is None:
        raise ValueError("Cannot submit a project without a budget.")
    return _transition_projet(db, projet_id, {"brouillon"}, "soumis")


def approve_projet(db: Session, projet_id: int):
    return _transition_projet(db, projet_id, {"soumis"}, "approuve")


def reject_projet(db: Session, projet_id: int):
    return _transition_projet(db, projet_id, {"soumis"}, "rejete")


def close_projet(db: Session, projet_id: int):
    return _transition_projet(db, projet_id, {"approuve", "en_execution"}, "cloture")
