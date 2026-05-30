from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.mouvement_financier import (
    AnalyseEcartsBudget,
    ExecutionBudgetaireResponse,
    MouvementFinancierCreate,
    MouvementFinancierResponse,
    MouvementFinancierUpdate,
    SyntheseFinanciereProjet,
)
from app.services import mouvement_financier_service

router = APIRouter(tags=["Mouvements financiers"])


def _not_found(message: str = "Mouvement financier introuvable"):
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=message)


def _handle_business_error(exc: Exception):
    if isinstance(exc, PermissionError):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(exc)) from exc
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


def _has_any_role(user: User, roles: set[str]) -> bool:
    return any((role.nom_role or "").strip().lower() in roles for role in user.roles)


def _require_financial_report_read_access(user: User) -> None:
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
            detail="Votre role ne permet pas de consulter les rapports financiers.",
        )


@router.post("/mouvements-financiers/", response_model=MouvementFinancierResponse, status_code=status.HTTP_201_CREATED)
def create_mouvement(
    mouvement_in: MouvementFinancierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return mouvement_financier_service.create_mouvement(db, mouvement_in, current_user)
    except (PermissionError, ValueError) as exc:
        _handle_business_error(exc)


@router.get("/mouvements-financiers/", response_model=list[MouvementFinancierResponse])
def get_mouvements(
    skip: int = 0,
    limit: int = 100,
    projet_id: int | None = None,
    budget_id: int | None = None,
    type_mouvement: str | None = None,
    date_debut: date | None = None,
    date_fin: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return mouvement_financier_service.get_mouvements(
            db,
            skip=skip,
            limit=limit,
            projet_id=projet_id,
            budget_id=budget_id,
            type_mouvement=type_mouvement,
            date_debut=date_debut,
            date_fin=date_fin,
        )
    except ValueError as exc:
        _handle_business_error(exc)


@router.get("/mouvements-financiers/{mouvement_id}", response_model=MouvementFinancierResponse)
def get_mouvement(
    mouvement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    mouvement = mouvement_financier_service.get_mouvement_by_id(db, mouvement_id)
    if mouvement is None:
        _not_found()
    return mouvement


@router.get("/projects/{project_id}/mouvements-financiers", response_model=list[MouvementFinancierResponse])
def get_project_mouvements(
    project_id: int,
    skip: int = 0,
    limit: int = 100,
    type_mouvement: str | None = None,
    date_debut: date | None = None,
    date_fin: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return mouvement_financier_service.get_mouvements_by_project(
            db,
            project_id,
            skip=skip,
            limit=limit,
            type_mouvement=type_mouvement,
            date_debut=date_debut,
            date_fin=date_fin,
        )
    except ValueError as exc:
        _handle_business_error(exc)


@router.get("/budgets/{budget_id}/mouvements-financiers", response_model=list[MouvementFinancierResponse])
def get_budget_mouvements(
    budget_id: int,
    skip: int = 0,
    limit: int = 100,
    type_mouvement: str | None = None,
    date_debut: date | None = None,
    date_fin: date | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return mouvement_financier_service.get_mouvements_by_budget(
            db,
            budget_id,
            skip=skip,
            limit=limit,
            type_mouvement=type_mouvement,
            date_debut=date_debut,
            date_fin=date_fin,
        )
    except ValueError as exc:
        _handle_business_error(exc)


@router.patch("/mouvements-financiers/{mouvement_id}", response_model=MouvementFinancierResponse)
def update_mouvement(
    mouvement_id: int,
    mouvement_in: MouvementFinancierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        mouvement = mouvement_financier_service.update_mouvement(db, mouvement_id, mouvement_in, current_user)
    except (PermissionError, ValueError) as exc:
        _handle_business_error(exc)
    if mouvement is None:
        _not_found()
    return mouvement


@router.delete("/mouvements-financiers/{mouvement_id}")
def delete_mouvement(
    mouvement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        mouvement = mouvement_financier_service.delete_mouvement(db, mouvement_id, current_user)
    except (PermissionError, ValueError) as exc:
        _handle_business_error(exc)
    if mouvement is None:
        _not_found()
    return {"message": "Mouvement financier supprime avec succes"}


@router.get("/projects/{project_id}/synthese-financiere", response_model=SyntheseFinanciereProjet)
def get_project_synthese(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_financial_report_read_access(current_user)
    synthese = mouvement_financier_service.get_synthese_financiere_projet(db, project_id)
    if synthese is None:
        _not_found("Projet introuvable")
    return synthese


@router.get("/projects/{project_id}/execution-budgetaire", response_model=ExecutionBudgetaireResponse)
def get_project_execution_budgetaire(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_financial_report_read_access(current_user)
    execution = mouvement_financier_service.get_execution_budgetaire_projet(db, project_id)
    if execution is None:
        _not_found("Projet introuvable")
    return execution


@router.get("/budgets/{budget_id}/analyse-ecarts", response_model=AnalyseEcartsBudget)
def get_budget_analyse_ecarts(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _require_financial_report_read_access(current_user)
    analyse = mouvement_financier_service.get_analyse_ecarts_budget(db, budget_id)
    if analyse is None:
        _not_found("Budget introuvable")
    return analyse
