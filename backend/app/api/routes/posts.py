import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from starlette.concurrency import run_in_threadpool

from app.core.config import settings
from app.core.security import current_active_user
from app.db.session import get_async_session
from app.models import Post, User
from app.schemas.post import DeleteResponse, FeedResponse, PostRead
from app.services.imagekit import UploadError, upload_media

router = APIRouter(tags=["posts"])


def to_post_read(post: Post, username: str, current_user_id: uuid.UUID) -> PostRead:
    return PostRead(
        id=post.id,
        user_id=post.user_id,
        username=username,
        caption=post.caption,
        url=post.url,
        file_type=post.file_type,
        file_name=post.file_name,
        created_at=post.created_at,
        is_owner=post.user_id == current_user_id,
    )


@router.post("/upload", response_model=PostRead)
async def upload_post(
    file: UploadFile = File(...),
    caption: str = Form(""),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session),
):
    caption = caption.strip()
    if len(caption) > settings.max_caption_length:
        raise HTTPException(
            status_code=400,
            detail=f"Caption must be {settings.max_caption_length} characters or fewer",
        )

    content_type = file.content_type or ""
    if not content_type.startswith(("image/", "video/")):
        raise HTTPException(status_code=400, detail="Only image or video files can be uploaded")

    try:
        # the ImageKit SDK is blocking, so keep it off the event loop
        media = await run_in_threadpool(upload_media, file)
    except UploadError as e:
        raise HTTPException(status_code=502, detail=f"Image upload failed: {e}")

    post = Post(
        user_id=user.id,
        caption=caption,
        url=media.url,
        file_type="video" if content_type.startswith("video/") else "image",
        file_name=media.file_name,
    )
    session.add(post)
    await session.commit()
    await session.refresh(post)
    return to_post_read(post, user.username, user.id)


@router.get("/feed", response_model=FeedResponse)
async def get_feed(
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    result = await session.execute(
        select(Post, User.username)
        .join(User, Post.user_id == User.id)
        .order_by(Post.created_at.desc())
    )
    return FeedResponse(posts=[to_post_read(post, username, user.id) for post, username in result.all()])


@router.delete("/posts/{post_id}", response_model=DeleteResponse)
async def delete_post(
    post_id: str,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user),
):
    try:
        post_uuid = uuid.UUID(post_id)
    except ValueError:
        raise HTTPException(status_code=404, detail="Post not found")

    result = await session.execute(select(Post).where(Post.id == post_uuid))
    post = result.scalar_one_or_none()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")

    if post.user_id != user.id:
        raise HTTPException(status_code=403, detail="You are not authorized to delete this post")

    await session.delete(post)
    await session.commit()
    return DeleteResponse(success=True, message="Post deleted successfully")
