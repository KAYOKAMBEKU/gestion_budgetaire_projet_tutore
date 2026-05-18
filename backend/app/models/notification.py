from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True)
    titre = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type_notification = Column(String(50), nullable=True)
    est_lue = Column(Boolean, default=False)
    date_envoi = Column(DateTime, default=datetime.utcnow)
    utilisateur_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    utilisateur = relationship("User", back_populates="notifications")
