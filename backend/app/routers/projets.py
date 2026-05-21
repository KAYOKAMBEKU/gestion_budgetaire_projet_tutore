from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.projet import ProjetCreate, ProjetResponse, ProjetUpdate
from app.services import projet_service

router = APIRouter(prefix="/projets", tags=["Projets"])


def _not_found():
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Projet introuvable")


@router.post("/", response_model=ProjetResponse, status_code=status.HTTP_201_CREATED)
def create_projet(
    projet_in: ProjetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return projet_service.create_projet(db, projet_in, current_user)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/", response_model=list[ProjetResponse])
def get_projets(
    skip: int = 0,
    limit: int = 100,
    departement_id: int | None = None,
    chef_projet_id: int | None = None,
    statut: str | None = None,
    db: Session = Depends(get_db),
):
    return projet_service.get_projets(db, skip=skip, limit=limit, departement_id=departement_id, chef_projet_id=chef_projet_id, statut=statut)


@router.get("/by-code/{code}", response_model=ProjetResponse)
def get_projet_by_code(code: str, db: Session = Depends(get_db)):
    projet = projet_service.get_projet_by_code(db, code)
    if projet is None:
        _not_found()
    return projet


@router.get("/by-departement/{departement_id}", response_model=list[ProjetResponse])
def get_projets_by_departement(departement_id: int, db: Session = Depends(get_db)):
    return projet_service.get_projets_by_departement(db, departement_id)


@router.get("/by-exercice/{exercice_id}", response_model=list[ProjetResponse])
def get_projets_by_exercice(exercice_id: int, db: Session = Depends(get_db)):
    return projet_service.get_projets_by_exercice(db, exercice_id)


@router.get("/by-gestionnaire/{gestionnaire_id}", response_model=list[ProjetResponse])
def get_projets_by_gestionnaire(gestionnaire_id: int, db: Session = Depends(get_db)):
    return projet_service.get_projets_by_gestionnaire(db, gestionnaire_id)


@router.get("/by-statut/{statut}", response_model=list[ProjetResponse])
def get_projets_by_statut(statut: str, db: Session = Depends(get_db)):
    return projet_service.get_projets_by_statut(db, statut)


@router.get("/{projet_id}", response_model=ProjetResponse)
def get_projet(projet_id: int, db: Session = Depends(get_db)):
    projet = projet_service.get_projet_by_id(db, projet_id)
    if projet is None:
        _not_found()
    return projet


@router.put("/{projet_id}", response_model=ProjetResponse)
def update_projet(projet_id: int, projet_in: ProjetUpdate, db: Session = Depends(get_db)):
    try:
        projet = projet_service.update_projet(db, projet_id, projet_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if projet is None:
        _not_found()
    return projet


@router.delete("/{projet_id}")
def delete_projet(projet_id: int, db: Session = Depends(get_db)):
    projet = projet_service.delete_projet(db, projet_id)
    if projet is None:
        _not_found()
    return {"message": "Projet supprime avec succes"}


def _transition(result):
    if result is None:
        _not_found()
    return result


@router.patch("/{projet_id}/submit", response_model=ProjetResponse)
def submit_projet(projet_id: int, db: Session = Depends(get_db)):
    try:
        return _transition(projet_service.submit_projet(db, projet_id))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{projet_id}/approve", response_model=ProjetResponse)
def approve_projet(projet_id: int, db: Session = Depends(get_db)):
    try:
        return _transition(projet_service.approve_projet(db, projet_id))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{projet_id}/reject", response_model=ProjetResponse)
def reject_projet(projet_id: int, db: Session = Depends(get_db)):
    try:
        return _transition(projet_service.reject_projet(db, projet_id))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.patch("/{projet_id}/close", response_model=ProjetResponse)
def close_projet(projet_id: int, db: Session = Depends(get_db)):
    try:
        return _transition(projet_service.close_projet(db, projet_id))
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
