from sqlalchemy.orm import Session

from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationUpdate
from app.services._utils import schema_to_dict, update_model


def get_notification_by_id(db: Session, notification_id: int):
    return db.query(Notification).filter(Notification.id == notification_id).first()


def get_by_id(db: Session, id: int):
    return get_notification_by_id(db, id)


def get_notifications(db: Session, skip: int = 0, limit: int = 100):
    return db.query(Notification).offset(skip).limit(limit).all()


def get_all(db: Session, skip: int = 0, limit: int = 100):
    return get_notifications(db, skip, limit)


def get_notifications_by_user(db: Session, utilisateur_id: int):
    return db.query(Notification).filter(Notification.utilisateur_id == utilisateur_id).all()


def get_unread_notifications_by_user(db: Session, utilisateur_id: int):
    return db.query(Notification).filter(
        Notification.utilisateur_id == utilisateur_id,
        Notification.est_lue.is_(False),
    ).all()


def create_notification(db: Session, notification_in: NotificationCreate):
    notification = Notification(**schema_to_dict(notification_in, exclude_unset=False))
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def create(db: Session, obj_in: NotificationCreate):
    return create_notification(db, obj_in)


def update_notification(db: Session, notification_id: int, notification_in: NotificationUpdate):
    notification = get_notification_by_id(db, notification_id)
    if notification is None:
        return None
    update_model(notification, notification_in)
    db.commit()
    db.refresh(notification)
    return notification


def update(db: Session, db_obj, obj_in: NotificationUpdate):
    update_model(db_obj, obj_in)
    db.commit()
    db.refresh(db_obj)
    return db_obj


def delete_notification(db: Session, notification_id: int):
    notification = get_notification_by_id(db, notification_id)
    if notification is None:
        return None
    db.delete(notification)
    db.commit()
    return notification


def delete(db: Session, id: int):
    return delete_notification(db, id)


def mark_as_read(db: Session, notification_id: int):
    notification = get_notification_by_id(db, notification_id)
    if notification is None:
        return None
    notification.est_lue = True
    db.commit()
    db.refresh(notification)
    return notification


def mark_all_as_read_for_user(db: Session, utilisateur_id: int):
    notifications = get_unread_notifications_by_user(db, utilisateur_id)
    for notification in notifications:
        notification.est_lue = True
    db.commit()
    return notifications
