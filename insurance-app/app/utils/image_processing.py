from io import BytesIO
from django.core.files.uploadedfile import InMemoryUploadedFile

try:
    from PIL import Image, ImageOps
except Exception:  # Pillow should be installed per requirements
    Image = None
    ImageOps = None


def autocrop_resize_banner(uploaded_file, target_width=1200, target_height=675, format_preference='JPEG', quality=85, crop_focus='center'):
    """
    Auto-crop to 16:9 centered and resize to target dimensions for campaign banners.
    Returns a new InMemoryUploadedFile suitable for assigning to ImageField.
    """
    if Image is None:
        raise RuntimeError('Pillow is required for image processing')

    # Open and normalize orientation
    im = Image.open(uploaded_file)
    im = ImageOps.exif_transpose(im)

    tw, th = int(target_width), int(target_height)
    target_ratio = tw / th
    w, h = im.size
    current_ratio = w / h if h else target_ratio

    # Crop to target aspect ratio using focus
    if abs(current_ratio - target_ratio) > 0.01:
        if current_ratio > target_ratio:
            # too wide, crop width
            new_w = int(h * target_ratio)
            if crop_focus == 'left':
                left = 0
            elif crop_focus == 'right':
                left = max(w - new_w, 0)
            else:  # center
                left = max((w - new_w) // 2, 0)
            im = im.crop((left, 0, left + new_w, h))
        else:
            # too tall, crop height
            new_h = int(w / target_ratio)
            if crop_focus == 'top':
                top = 0
            elif crop_focus == 'bottom':
                top = max(h - new_h, 0)
            else:  # center
                top = max((h - new_h) // 2, 0)
            im = im.crop((0, top, w, top + new_h))

    # Resize using high-quality filter
    if im.size != (tw, th):
        im = im.resize((tw, th), Image.Resampling.LANCZOS if hasattr(Image, 'Resampling') else Image.LANCZOS)

    # Convert for JPEG if needed
    save_format = format_preference.upper() if format_preference else 'JPEG'
    if save_format == 'JPEG' and im.mode in ('RGBA', 'LA'):
        im = im.convert('RGB')

    buf = BytesIO()
    save_kwargs = {}
    if save_format == 'JPEG':
        save_kwargs.update(dict(quality=85 if quality is None else quality, optimize=True, progressive=True))
    im.save(buf, format=save_format, **save_kwargs)
    buf.seek(0)

    # Build a new uploaded file object
    import os
    base_name = getattr(uploaded_file, 'name', 'banner')
    name_wo_ext = os.path.splitext(base_name)[0]
    ext = '.jpg' if save_format == 'JPEG' else ('.png' if save_format == 'PNG' else f'.{save_format.lower()}')
    new_name = f"{name_wo_ext}_banner{ext}"

    content_type = 'image/jpeg' if save_format == 'JPEG' else (f'image/{save_format.lower()}')
    memfile = InMemoryUploadedFile(
        file=buf,
        field_name='banner_image',
        name=new_name,
        content_type=content_type,
        size=buf.getbuffer().nbytes,
        charset=None
    )
    return memfile
