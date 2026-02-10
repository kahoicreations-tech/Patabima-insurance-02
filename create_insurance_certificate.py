#!/usr/bin/env python3
"""
Advanced image creation script for PataBima Insurance Application.
Creates a sample insurance certificate placeholder.
"""

from PIL import Image, ImageDraw, ImageFont
import os
from datetime import datetime

def create_insurance_certificate(output_path, width=1200, height=850):
    """
    Create a sample insurance certificate template.
    
    Args:
        output_path: Path where the image will be saved
        width: Width of the certificate in pixels
        height: Height of the certificate in pixels
    """
    # Create white background
    image = Image.new('RGB', (width, height), color='white')
    draw = ImageDraw.Draw(image)
    
    # Define color palette (using professional insurance colors)
    navy_blue = (0, 51, 102)
    light_blue = (135, 206, 235)
    gold = (255, 215, 0)
    dark_gray = (51, 51, 51)
    light_gray = (230, 230, 230)
    
    # Draw border
    border_width = 15
    draw.rectangle(
        [border_width, border_width, width - border_width, height - border_width],
        outline=navy_blue,
        width=border_width
    )
    
    # Draw inner border
    inner_border = border_width + 10
    draw.rectangle(
        [inner_border, inner_border, width - inner_border, height - inner_border],
        outline=gold,
        width=3
    )
    
    # Draw header background
    header_height = 150
    draw.rectangle(
        [inner_border + 3, inner_border + 3, width - inner_border - 3, inner_border + header_height],
        fill=navy_blue
    )
    
    # Load fonts
    try:
        font_title = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 56)
        font_subtitle = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
        font_body = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 24)
        font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 18)
    except:
        font_title = ImageFont.load_default()
        font_subtitle = ImageFont.load_default()
        font_body = ImageFont.load_default()
        font_small = ImageFont.load_default()
    
    # Draw title
    title = "CERTIFICATE OF INSURANCE"
    title_bbox = draw.textbbox((0, 0), title, font=font_title)
    title_width = title_bbox[2] - title_bbox[0]
    title_x = (width - title_width) // 2
    draw.text((title_x, inner_border + 40), title, fill='white', font=font_title)
    
    # Draw subtitle
    subtitle = "Motor Vehicle Insurance"
    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=font_subtitle)
    subtitle_width = subtitle_bbox[2] - subtitle_bbox[0]
    subtitle_x = (width - subtitle_width) // 2
    draw.text((subtitle_x, inner_border + 105), subtitle, fill=light_blue, font=font_subtitle)
    
    # Content area
    content_y = inner_border + header_height + 50
    left_margin = inner_border + 60
    line_height = 60
    
    # Sample certificate fields
    fields = [
        ("Policy Holder:", "John Doe"),
        ("Policy Number:", "PB-2026-001234"),
        ("Vehicle Registration:", "KXX 123Y"),
        ("Coverage Type:", "Comprehensive"),
        ("Issue Date:", datetime.now().strftime("%B %d, %Y")),
        ("Valid Until:", "February 10, 2027"),
    ]
    
    y_pos = content_y
    for label, value in fields:
        # Draw label
        draw.text((left_margin, y_pos), label, fill=dark_gray, font=font_body)
        # Draw value
        draw.text((left_margin + 300, y_pos), value, fill=navy_blue, font=font_body)
        y_pos += line_height
    
    # Draw decorative line
    line_y = y_pos + 30
    draw.line(
        [(left_margin, line_y), (width - left_margin, line_y)],
        fill=gold,
        width=2
    )
    
    # Add notice text
    notice_y = line_y + 40
    notice_text = "This is a sample certificate generated for demonstration purposes only."
    notice_bbox = draw.textbbox((0, 0), notice_text, font=font_small)
    notice_width = notice_bbox[2] - notice_bbox[0]
    notice_x = (width - notice_width) // 2
    draw.text((notice_x, notice_y), notice_text, fill=dark_gray, font=font_small)
    
    # Add footer
    footer_y = height - inner_border - 80
    footer_line_y = footer_y - 20
    draw.line(
        [(left_margin, footer_line_y), (width - left_margin, footer_line_y)],
        fill=light_gray,
        width=1
    )
    
    footer_text = "PataBima Insurance Services • www.patabima.co.ke"
    footer_bbox = draw.textbbox((0, 0), footer_text, font=font_small)
    footer_width = footer_bbox[2] - footer_bbox[0]
    footer_x = (width - footer_width) // 2
    draw.text((footer_x, footer_y), footer_text, fill=dark_gray, font=font_small)
    
    # Add watermark-style text
    watermark = "SAMPLE"
    watermark_font = font_title
    watermark_bbox = draw.textbbox((0, 0), watermark, font=watermark_font)
    watermark_width = watermark_bbox[2] - watermark_bbox[0]
    watermark_height = watermark_bbox[3] - watermark_bbox[1]
    
    # Create semi-transparent watermark (by drawing it light)
    watermark_x = (width - watermark_width) // 2
    watermark_y = (height - watermark_height) // 2
    draw.text((watermark_x, watermark_y), watermark, fill=(220, 220, 220), font=watermark_font)
    
    # Save the image
    image.save(output_path, 'PNG', optimize=True)
    print(f"✓ Insurance certificate created: {output_path}")
    print(f"  Size: {width}x{height} pixels")
    print(f"  Format: PNG")
    
    file_size = os.path.getsize(output_path)
    print(f"  File size: {file_size:,} bytes ({file_size / 1024:.2f} KB)")
    
    return image

if __name__ == "__main__":
    output_dir = "/home/runner/work/Patabima-insurance-02/Patabima-insurance-02/frontend/assets/images"
    output_path = os.path.join(output_dir, "sample-insurance-certificate.png")
    
    print("Creating sample insurance certificate...")
    create_insurance_certificate(output_path)
    print("\nCertificate generation complete!")
