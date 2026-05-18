from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base
from .association_tables import role_permissions, user_roles


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    nom_role = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)

    users = relationship(
        "User",
        secondary=user_roles,
        back_populates="roles",
    )
    permissions = relationship(
        "Permission",
        secondary=role_permissions,
        back_populates="roles",
    )
