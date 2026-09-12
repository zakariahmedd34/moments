import uuid
from datetime import UTC, datetime

from pydantic import BaseModel, field_validator


class PostRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    username: str
    caption: str | None
    url: str
    file_type: str
    file_name: str
    created_at: datetime
    is_owner: bool

    # SQLite drops the timezone, so naive datetimes are stored UTC
    @field_validator("created_at")
    @classmethod
    def assume_utc(cls, value: datetime) -> datetime:
        return value.replace(tzinfo=UTC) if value.tzinfo is None else value


class FeedResponse(BaseModel):
    posts: list[PostRead]


class DeleteResponse(BaseModel):
    success: bool
    message: str
