import uuid
from typing import Annotated, Optional

from fastapi_users import schemas
from pydantic import BeforeValidator, StringConstraints

# 3-20 characters: lowercase letters, numbers, underscore
Username = Annotated[
    str,
    StringConstraints(pattern=r"^[a-z0-9_]{3,20}$"),
    BeforeValidator(lambda value: value.strip().lower() if isinstance(value, str) else value),
]


class UserRead(schemas.BaseUser[uuid.UUID]):
    username: str


class UserCreate(schemas.BaseUserCreate):
    username: Username


class UserUpdate(schemas.BaseUserUpdate):
    username: Optional[Username] = None
