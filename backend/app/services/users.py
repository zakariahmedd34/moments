import uuid
from typing import Optional

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_users import BaseUserManager, UUIDIDMixin
from fastapi_users.db import SQLAlchemyUserDatabase
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import get_async_session
from app.models import User
from app.schemas.user import UserCreate, UserUpdate


class UserManager(UUIDIDMixin, BaseUserManager[User, uuid.UUID]):
    reset_password_token_secret = settings.jwt_secret
    verification_token_secret = settings.jwt_secret

    async def _ensure_username_available(self, username: str, current_user_id: Optional[uuid.UUID] = None):
        result = await self.user_db.session.execute(select(User).where(User.username == username))
        existing = result.scalar_one_or_none()
        if existing and existing.id != current_user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="USERNAME_ALREADY_EXISTS")

    async def create(self, user_create: UserCreate, safe: bool = False, request: Optional[Request] = None) -> User:
        await self._ensure_username_available(user_create.username)
        return await super().create(user_create, safe, request)

    async def update(self, user_update: UserUpdate, user: User, safe: bool = False, request: Optional[Request] = None) -> User:
        if user_update.username is not None:
            await self._ensure_username_available(user_update.username, user.id)
        return await super().update(user_update, user, safe, request)

    # login accepts "email", "username" or "@username"
    async def authenticate(self, credentials: OAuth2PasswordRequestForm) -> Optional[User]:
        identifier = credentials.username.strip()
        if identifier.startswith("@"):
            identifier = identifier[1:]
        if "@" in identifier:
            credentials.username = identifier
            return await super().authenticate(credentials)

        result = await self.user_db.session.execute(select(User).where(User.username == identifier.lower()))
        user = result.scalar_one_or_none()
        if user is None:
            # hash anyway so unknown usernames take as long as wrong passwords
            self.password_helper.hash(credentials.password)
            return None

        verified, updated_password_hash = self.password_helper.verify_and_update(
            credentials.password, user.hashed_password
        )
        if not verified:
            return None
        if updated_password_hash is not None:
            await self.user_db.update(user, {"hashed_password": updated_password_hash})
        return user

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        print(f"User {user.id} has registered.")

    async def on_after_forgot_password(self, user: User, token: str, request: Optional[Request] = None):
        print(f"User {user.id} has forgot their password. Reset token: {token}")

    async def on_after_request_verify(self, user: User, token: str, request: Optional[Request] = None):
        print(f"Verification requested for user {user.id}. Verification token: {token}")


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)


async def get_user_manager(user_db: SQLAlchemyUserDatabase = Depends(get_user_db)):
    yield UserManager(user_db)
