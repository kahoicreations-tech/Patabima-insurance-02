from __future__ import annotations

from typing import Optional

from PIL import Image


def validate_banner_image_file(
    file_obj,
    *,
    min_width: int = 1200,
    min_height: int = 675,
    aspect_w: int = 16,
    aspect_h: int = 9,
    aspect_tolerance: float = 0.05,  # 5%
    max_bytes: int = 2 * 1024 * 1024,  # 2 MB
    allowed_formats: Optional[set[str]] = None,
) -> None:
    """
    Validate an uploaded banner image for mobile HomeScreen.

    Rules:
    - Min dimensions: 1200x675 (16:9)
    - Aspect ratio ~16:9 within tolerance (default 5%)
    - Max file size: 2MB
    - Formats: JPEG/PNG/WebP by default

    Raises ValueError with a user-friendly message if invalid.
    """
    if file_obj is None:
        return

    # File size check (if provided by storage)
    size = getattr(file_obj, "size", None)
    if size is not None and size > max_bytes:
        raise ValueError(
            f"Banner image is too large ({size // 1024} KB). Max allowed is {max_bytes // (1024*1024)} MB."
        )

    # Read the image to inspect dimensions/format
    pos = None
    try:
        if hasattr(file_obj, "tell"):
            pos = file_obj.tell()
        image = Image.open(file_obj)
        width, height = image.size
        fmt = (image.format or "").upper()
    finally:
        # Reset stream pointer so Django can re-read the file for saving
        try:
            if hasattr(file_obj, "seek") and pos is not None:
                file_obj.seek(pos)
        except Exception:
            pass

    # Format check
    if allowed_formats is None:
        allowed_formats = {"JPEG", "JPG", "PNG", "WEBP"}
    if fmt and fmt.upper() not in allowed_formats:
        allowed_readable = ", ".join(sorted(allowed_formats))
        raise ValueError(f"Unsupported image format '{fmt}'. Allowed: {allowed_readable}.")

    # Minimum size check
    if width < min_width or height < min_height:
        raise ValueError(
            f"Banner image is too small ({width}x{height}). Minimum is {min_width}x{min_height}."
        )

    # Aspect ratio within tolerance
    target = aspect_w / aspect_h
    actual = width / height if height else 0
    lower = target * (1 - aspect_tolerance)
    upper = target * (1 + aspect_tolerance)
    if not (lower <= actual <= upper):
        raise ValueError(
            f"Banner image must be approximately {aspect_w}:{aspect_h}. Got {width}x{height}."
        )

    # All good
    return
