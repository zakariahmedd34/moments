import os
import shutil
import tempfile
from dataclasses import dataclass

from fastapi import UploadFile
from imagekitio import ImageKit
from imagekitio.models.UploadFileRequestOptions import UploadFileRequestOptions

from app.core.config import settings

imagekit = ImageKit(
    private_key=settings.imagekit_private_key,
    public_key=settings.imagekit_public_key,
    url_endpoint=settings.imagekit_url,
)


class UploadError(Exception):
    pass


@dataclass(frozen=True)
class UploadedMedia:
    url: str
    file_name: str


def upload_media(file: UploadFile) -> UploadedMedia:
    temp_file_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename or "")[1]) as temp_file:
            temp_file_path = temp_file.name
            shutil.copyfileobj(file.file, temp_file)

        with open(temp_file_path, "rb") as upload_source:
            result = imagekit.upload_file(
                file=upload_source,
                file_name=file.filename,
                options=UploadFileRequestOptions(
                    use_unique_file_name=True,
                    tags=["backend-upload"],
                ),
            )
    except Exception as e:
        raise UploadError(str(e)) from e
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            os.unlink(temp_file_path)
        file.file.close()

    if result.response_metadata.http_status_code != 200:
        raise UploadError(f"ImageKit returned status {result.response_metadata.http_status_code}")

    return UploadedMedia(url=result.url, file_name=result.name)
