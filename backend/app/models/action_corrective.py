from sqlalchemy import Column, Date, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class ActionCorrective(Base):
    __tablename__ = "actions_correctives"

    id = Column(Integer, primary_key=True)
    libelle = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    date_debut = Column(Date, nullable=True)
    date_fin = Column(Date, nullable=True)
    statut = Column(String(50), default="planifiee")
    responsable = Column(String(150), nullable=True)
    analyse_id = Column(Integer, ForeignKey("analyses_ecarts.id"), nullable=False)

    analyse = relationship("AnalyseEcart", back_populates="actions_correctives")
