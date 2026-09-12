from fastapi_users.db import SQLAlchemyBaseUserTableUUID
from sqlalchemy import Column, String
from sqlalchemy.orm import relationship

from app.db.base import Base


class User(SQLAlchemyBaseUserTableUUID, Base):
    username = Column(String(20), unique=True, index=True, nullable=False)
    posts = relationship("Post", back_populates="user")
