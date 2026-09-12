from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import settings
from app.db.session import create_db_and_tables


@asynccontextmanager
async def lifespan(_app: FastAPI):
    await create_db_and_tables()
    yield


def mount_frontend(app: FastAPI, dist: Path) -> None:
    """Serve the built React app, so one server runs everything.

    In development the dist folder usually doesn't exist and Vite serves the frontend instead.
    """
    index_file = dist / "index.html"
    if not index_file.is_file():
        return

    if (dist / "assets").is_dir():
        app.mount("/assets", StaticFiles(directory=dist / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    async def serve_frontend(path: str):
        if path == "api" or path.startswith("api/"):
            raise HTTPException(status_code=404, detail="Not Found")
        requested = (dist / path).resolve()
        if path and requested.is_file() and requested.is_relative_to(dist):
            return FileResponse(requested)
        # any other path is a React Router page
        return FileResponse(index_file)


def create_app() -> FastAPI:
    app = FastAPI(
        title="Moments API",
        lifespan=lifespan,
        docs_url="/api/docs",
        oauth2_redirect_url="/api/docs/oauth2-redirect",
        redoc_url=None,
        openapi_url="/api/openapi.json",
    )
    app.include_router(api_router)
    mount_frontend(app, settings.frontend_dist)
    return app


app = create_app()
