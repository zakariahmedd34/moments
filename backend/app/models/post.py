import uuid
from datetime import UTC, datetime

# same UUID type as the user table, so ids compare equal on SQLite and PostgreSQL
from fastapi_users_db_sqlalchemy.generics import GUID
from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base


class Post(Base):
    __tablename__ = "posts"

    id = Column(GUID, primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID, ForeignKey("user.id"), nullable=False)
    caption = Column(Text)
    url = Column(String, nullable=False)
    file_type = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(UTC))

    user = relationship("User", back_populates="posts")
