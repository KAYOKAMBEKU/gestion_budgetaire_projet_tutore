from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.action_corrective import ActionCorrectiveCreate, ActionCorrectiveResponse, ActionCorrectiveUpdate
from app.services import action_corrective_service

router = APIRouter(prefix="/actions-correctives", tags=["Actions correctives"])


def _not_found():
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Action corrective introuvable")


@router.post("/", response_model=ActionCorrectiveResponse, status_code=status.HTTP_201_CREATED)
def create_action(action_in: ActionCorrectiveCreate, db: Session = Depends(get_db)):
    try:
        return action_corrective_service.create_action(db, action_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/", response_model=list[ActionCorrectiveResponse])
def get_actions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return action_corrective_service.get_actions(db, skip=skip, limit=limit)


@router.get("/by-analyse/{analyse_id}", response_model=list[ActionCorrectiveResponse])
def get_actions_by_analyse(analyse_id: int, db: Session = Depends(get_db)):
    return action_corrective_service.get_actions_by_analyse(db, analyse_id)


@router.get("/by-statut/{statut}", response_model=list[ActionCorrectiveResponse])
def get_actions_by_statut(statut: str, db: Session = Depends(get_db)):
    return action_corrective_service.get_actions_by_statut(db, statut)


@router.get("/{action_id}", response_model=ActionCorrectiveResponse)
def get_action(action_id: int, db: Session = Depends(get_db)):
    action = action_corrective_service.get_action_by_id(db, action_id)
    if action is None:
        _not_found()
    return action


@router.put("/{action_id}", response_model=ActionCorrectiveResponse)
def update_action(action_id: int, action_in: ActionCorrectiveUpdate, db: Session = Depends(get_db)):
    try:
        action = action_corrective_service.update_action(db, action_id, action_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if action is None:
        _not_found()
    return action


@router.delete("/{action_id}")
def delete_action(action_id: int, db: Session = Depends(get_db)):
    action = action_corrective_service.delete_action(db, action_id)
    if action is None:
        _not_found()
    return {"message": "Action corrective supprimee avec succes"}


@router.patch("/{action_id}/start", response_model=ActionCorrectiveResponse)
def start_action(action_id: int, db: Session = Depends(get_db)):
    action = action_corrective_service.start_action(db, action_id)
    if action is None:
        _not_found()
    return action


@router.patch("/{action_id}/complete", response_model=ActionCorrectiveResponse)
def complete_action(action_id: int, db: Session = Depends(get_db)):
    action = action_corrective_service.complete_action(db, action_id)
    if action is None:
        _not_found()
    return action


@router.patch("/{action_id}/cancel", response_model=ActionCorrectiveResponse)
def cancel_action(action_id: int, db: Session = Depends(get_db)):
    action = action_corrective_service.cancel_action(db, action_id)
    if action is None:
        _not_found()
    return action
