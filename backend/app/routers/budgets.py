from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetUpdate
from app.schemas.mouvement_financier import ExecutionBudgetaireResponse
from app.services import budget_service, mouvement_financier_service, rapport_budgetaire_service

router = APIRouter(prefix="/budgets", tags=["Budgets"])


def _not_found():
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget introuvable")


def _has_any_role(user: User, roles: set[str]) -> bool:
    return any((role.nom_role or "").strip().lower() in roles for role in user.roles)


def _require_budget_execution_read_access(user: User) -> None:
    allowed_roles = {
        "administrateur",
        "comptable",
        "gestionnaire",
        "gestionnaire budgetaire",
        "chef de projet",
    }
    if not _has_any_role(user, allowed_roles):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Votre role ne permet pas de consulter l'execution budgetaire.",
        )


@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_in: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return budget_service.create_budget(db, budget_in, current_user)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/", response_model=list[BudgetResponse])
def get_budgets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return budget_service.get_budgets(db, skip=skip, limit=limit)


@router.get("/by-reference/{reference}", response_model=BudgetResponse)
def get_budget_by_reference(reference: str, db: Session = Depends(get_db)):
    budget = budget_service.get_budget_by_reference(db, reference)
    if budget is None:
        _not_found()
    return budget


@router.get("/by-departement/{departement_id}", response_model=list[BudgetResponse])
def get_budgets_by_departement(departement_id: int, db: Session = Depends(get_db)):
    return budget_service.get_budgets_by_departement(db, departement_id)


@router.get("/by-exercice/{exercice_id}", response_model=list[BudgetResponse])
def get_budgets_by_exercice(exercice_id: int, db: Session = Depends(get_db)):
    return budget_service.get_budgets_by_exercice(db, exercice_id)


@router.get("/by-projet/{projet_id}", response_model=list[BudgetResponse])
def get_budgets_by_projet(projet_id: int, db: Session = Depends(get_db)):
    return budget_service.get_budgets_by_projet(db, projet_id)


@router.get("/by-statut/{statut}", response_model=list[BudgetResponse])
def get_budgets_by_statut(statut: str, db: Session = Depends(get_db)):
    return budget_service.get_budgets_by_statut(db, statut)


@router.get("/{budget_id}/summary")
def get_budget_summary(budget_id: int, db: Session = Depends(get_db)):
    summary = rapport_budgetaire_service.generate_budget_summary(db, budget_id)
    if summary is None:
        _not_found()
    return summary


@router.get("/{budget_id}", response_model=BudgetResponse)
def get_budget(budget_id: int, db: Session = Depends(get_db)):
    budget = budget_service.get_budget_by_id(db, budget_id)
    if budget is None:
        _not_found()
    return budget


@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(budget_id: int, budget_in: BudgetUpdate, db: Session = Depends(get_db)):
    try:
        budget = budget_service.update_budget(db, budget_id, budget_in)
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if budget is None:
        _not_found()
    return budget


@router.delete("/{budget_id}")
def delete_budget(budget_id: int, db: Session = Depends(get_db)):
    try:
        budget = budget_service.delete_budget(db, budget_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if budget is None:
        _not_found()
    return {"message": "Budget supprime avec succes"}


def _transition(result):
    if result is None:
        _not_found()
    return result


@router.patch("/{budget_id}/submit", response_model=BudgetResponse)
def submit_budget(budget_id: int, db: Session = Depends(get_db)):
    try:
        return _transition(budget_service.submit_budget(db, budget_id))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{budget_id}/validate-gestionnaire", response_model=BudgetResponse)
def validate_budget_by_gestionnaire(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return _transition(budget_service.validate_by_gestionnaire(db, budget_id, current_user))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{budget_id}/reject-gestionnaire", response_model=BudgetResponse)
def reject_budget_by_gestionnaire(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return _transition(budget_service.reject_by_gestionnaire(db, budget_id, current_user))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{budget_id}/submit-admin", response_model=BudgetResponse)
def submit_budget_to_admin(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return _transition(budget_service.submit_to_admin(db, budget_id, current_user))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{budget_id}/approve", response_model=BudgetResponse)
def approve_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return _transition(budget_service.approve_budget(db, budget_id, current_user))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{budget_id}/reject", response_model=BudgetResponse)
def reject_budget(budget_id: int, db: Session = Depends(get_db)):
    try:
        return _transition(budget_service.reject_budget(db, budget_id))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{budget_id}/close", response_model=BudgetResponse)
def close_budget(budget_id: int, db: Session = Depends(get_db)):
    try:
        return _transition(budget_service.close_budget(db, budget_id))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{budget_id}/recalculate", response_model=BudgetResponse)
def recalculate_budget(budget_id: int, db: Session = Depends(get_db)):
    return _transition(budget_service.recalculate_budget_totals(db, budget_id))


@router.patch("/{budget_id}/start-execution", response_model=BudgetResponse)
def start_budget_execution(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return _transition(budget_service.start_execution(db, budget_id, current_user))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{budget_id}/close-execution", response_model=BudgetResponse)
def close_budget_execution(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return _transition(budget_service.close_execution(db, budget_id, current_user))
    except PermissionError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/{budget_id}/execution", response_model=ExecutionBudgetaireResponse)
def get_budget_execution(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_budget_execution_read_access(current_user)
    execution = mouvement_financier_service.get_execution_budgetaire(db, budget_id)
    if execution is None:
        _not_found()
    return execution
