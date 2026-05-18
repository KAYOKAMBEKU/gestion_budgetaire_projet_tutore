from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.notification import NotificationCreate, NotificationResponse, NotificationUpdate
from app.services import notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def _not_found():
    raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification introuvable")


@router.post("/", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(notification_in: NotificationCreate, db: Session = Depends(get_db)):
    return notification_service.create_notification(db, notification_in)


@router.get("/", response_model=list[NotificationResponse])
def get_notifications(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return notification_service.get_notifications(db, skip=skip, limit=limit)


@router.get("/by-user/{utilisateur_id}", response_model=list[NotificationResponse])
def get_notifications_by_user(utilisateur_id: int, db: Session = Depends(get_db)):
    return notification_service.get_notifications_by_user(db, utilisateur_id)


@router.get("/by-user/{utilisateur_id}/unread", response_model=list[NotificationResponse])
def get_unread_notifications_by_user(utilisateur_id: int, db: Session = Depends(get_db)):
    return notification_service.get_unread_notifications_by_user(db, utilisateur_id)


@router.patch("/user/{utilisateur_id}/mark-all-as-read", response_model=list[NotificationResponse])
def mark_all_as_read_for_user(utilisateur_id: int, db: Session = Depends(get_db)):
    return notification_service.mark_all_as_read_for_user(db, utilisateur_id)


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(notification_id: int, db: Session = Depends(get_db)):
    notification = notification_service.get_notification_by_id(db, notification_id)
    if notification is None:
        _not_found()
    return notification


@router.put("/{notification_id}", response_model=NotificationResponse)
def update_notification(notification_id: int, notification_in: NotificationUpdate, db: Session = Depends(get_db)):
    notification = notification_service.update_notification(db, notification_id, notification_in)
    if notification is None:
        _not_found()
    return notification


@router.delete("/{notification_id}")
def delete_notification(notification_id: int, db: Session = Depends(get_db)):
    notification = notification_service.delete_notification(db, notification_id)
    if notification is None:
        _not_found()
    return {"message": "Notification supprimee avec succes"}


@router.patch("/{notification_id}/mark-as-read", response_model=NotificationResponse)
def mark_as_read(notification_id: int, db: Session = Depends(get_db)):
    notification = notification_service.mark_as_read(db, notification_id)
    if notification is None:
        _not_found()
    return notification
