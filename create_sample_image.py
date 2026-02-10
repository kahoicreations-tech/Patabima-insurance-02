#!/usr/bin/env python3
"""
Script to demonstrate image creation capability.
Creates a simple sample image with text and shapes.
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_sample_image(output_path, width=800, height=600):
    """
    Create a sample image with gradient background, shapes, and text.
    
    Args:
        output_path: Path where the image will be saved
        width: Width of the image in pixels
        height: Height of the image in pixels
    """
    # Create a new image with gradient background
    image = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(image)
    
    # Create a gradient background
    for y in range(height):
        # Calculate color for gradient (from light blue to dark blue)
        r = int(135 + (70 - 135) * (y / height))
        g = int(206 + (130 - 206) * (y / height))
        b = int(235 + (180 - 235) * (y / height))
        draw.rectangle([(0, y), (width, y + 1)], fill=(r, g, b))
    
    # Draw some geometric shapes
    # Draw a circle
    circle_center = (width // 4, height // 2)
    circle_radius = 80
    draw.ellipse(
        [circle_center[0] - circle_radius, circle_center[1] - circle_radius,
         circle_center[0] + circle_radius, circle_center[1] + circle_radius],
        fill='white',
        outline='navy',
        width=3
    )
    
    # Draw a rectangle
    rect_x = width * 3 // 4 - 80
    rect_y = height // 2 - 60
    draw.rectangle(
        [rect_x, rect_y, rect_x + 160, rect_y + 120],
        fill='white',
        outline='navy',
        width=3
    )
    
    # Draw a triangle
    triangle_points = [
        (width // 2, height // 4),
        (width // 2 - 70, height // 2 - 40),
        (width // 2 + 70, height // 2 - 40)
    ]
    draw.polygon(triangle_points, fill='white', outline='navy')
    
    # Add text
    try:
        # Try to use a nice font, fall back to default if not available
        font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 48)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
    except (IOError, OSError):
        # Use default font if custom fonts aren't available
        font_large = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Main title
    title_text = "Sample Image Created"
    # Get text bounding box for centering
    title_bbox = draw.textbbox((0, 0), title_text, font=font_large)
    title_width = title_bbox[2] - title_bbox[0]
    title_x = (width - title_width) // 2
    draw.text((title_x, 50), title_text, fill='white', font=font_large)
    
    # Subtitle
    subtitle_text = "Generated Programmatically with Python & Pillow"
    subtitle_bbox = draw.textbbox((0, 0), subtitle_text, font=font_small)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_x = (width - subtitle_width) // 2
    draw.text((subtitle_x, 110), subtitle_text, fill='white', font=font_small)
    
    # Add a border
    border_width = 5
    draw.rectangle(
        [border_width, border_width, width - border_width, height - border_width],
        outline='navy',
        width=border_width
    )
    
    # Save the image
    image.save(output_path, 'PNG', optimize=True)
    print(f"✓ Image created successfully: {output_path}")
    print(f"  Size: {width}x{height} pixels")
    print(f"  Format: PNG")
    
    # Get file size
    file_size = os.path.getsize(output_path)
    print(f"  File size: {file_size:,} bytes ({file_size / 1024:.2f} KB)")
    
    return image

if __name__ == "__main__":
    # Create output directory relative to script location
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_dir = os.path.join(script_dir, "frontend", "assets", "images")
    output_path = os.path.join(output_dir, "generated-sample.png")
    
    # Ensure output directory exists
    os.makedirs(output_dir, exist_ok=True)
    
    print("Creating sample image...")
    create_sample_image(output_path)
    print("\nImage generation complete!")
