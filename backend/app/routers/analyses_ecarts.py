from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.analyse_ecart import AnalyseEcartCreate, AnalyseEcartResponse, AnalyseEcartUpdate
from app.services import analyse_ecart_service

router = APIRouter(prefix="/analyses-ecarts", tags=["Analyses ecarts"])


def _not_found():
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Analyse d'ecart introuvable")


@router.post("/", response_model=AnalyseEcartResponse, status_code=status.HTTP_201_CREATED)
def create_analyse(analyse_in: AnalyseEcartCreate, db: Session = Depends(get_db)):
    try:
        return analyse_ecart_service.create_analyse(db, analyse_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/", response_model=list[AnalyseEcartResponse])
def get_analyses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return analyse_ecart_service.get_analyses(db, skip=skip, limit=limit)


@router.get("/by-ecart/{ecart_id}", response_model=AnalyseEcartResponse)
def get_analyse_by_ecart(ecart_id: int, db: Session = Depends(get_db)):
    analyse = analyse_ecart_service.get_analyse_by_ecart(db, ecart_id)
    if analyse is None:
        _not_found()
    return analyse


@router.get("/{analyse_id}", response_model=AnalyseEcartResponse)
def get_analyse(analyse_id: int, db: Session = Depends(get_db)):
    analyse = analyse_ecart_service.get_analyse_by_id(db, analyse_id)
    if analyse is None:
        _not_found()
    return analyse


@router.put("/{analyse_id}", response_model=AnalyseEcartResponse)
def update_analyse(analyse_id: int, analyse_in: AnalyseEcartUpdate, db: Session = Depends(get_db)):
    try:
        analyse = analyse_ecart_service.update_analyse(db, analyse_id, analyse_in)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    if analyse is None:
        _not_found()
    return analyse


@router.delete("/{analyse_id}")
def delete_analyse(analyse_id: int, db: Session = Depends(get_db)):
    analyse = analyse_ecart_service.delete_analyse(db, analyse_id)
    if analyse is None:
        _not_found()
    return {"message": "Analyse d'ecart supprimee avec succes"}
