from fastapi import APIRouter

from app.api.routes import auth, posts, users

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(posts.router)


@api_router.get("/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
