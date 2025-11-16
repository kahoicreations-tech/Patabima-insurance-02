"""
PDF Generation Service for Insurance Policies

Generates policy documents, certificates, and receipts using ReportLab.
Uploads generated PDFs to AWS S3 for permanent storage.
"""

import logging
from datetime import datetime
from io import BytesIO

logger = logging.getLogger(__name__)


def generate_motor_policy_pdf(policy):
    """
    Generate comprehensive PDF policy document for a motor insurance policy.
    
    Args:
        policy: MotorPolicy instance
    
    Returns:
        str: S3 URL of the generated PDF, or None if generation fails
    """
    try:
        # Import ReportLab components
        from reportlab.lib.pagesizes import A4
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
        from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
        
        logger.info(f"Generating PDF for policy {policy.policy_number}")
        
        # Create PDF buffer
        buffer = BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            title=f"Policy {policy.policy_number}",
            author="PataBima Insurance",
            subject="Motor Insurance Policy Document"
        )
        
        # Build content
        story = []
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#D5222B'),
            alignment=TA_CENTER,
            spaceAfter=30
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#D5222B'),
            spaceAfter=12
        )
        
        # Header: Company logo and title
        story.append(Paragraph("PataBima Insurance Agency", title_style))
        story.append(Paragraph("MOTOR INSURANCE POLICY CERTIFICATE", styles['Heading2']))
        story.append(Spacer(1, 0.3 * inch))
        
        # Policy Details Section
        story.append(Paragraph("Policy Information", heading_style))
        
        policy_data = [
            ['Policy Number:', policy.policy_number],
            ['Status:', policy.status],
            ['Issue Date:', policy.submitted_at.strftime('%d %B %Y')],
            ['Cover Start:', policy.cover_start_date.strftime('%d %B %Y') if policy.cover_start_date else 'N/A'],
            ['Cover End:', policy.cover_end_date.strftime('%d %B %Y') if policy.cover_end_date else 'N/A'],
        ]
        
        policy_table = Table(policy_data, colWidths=[2*inch, 4*inch])
        policy_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F0F0F0')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(policy_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # Client Details Section
        story.append(Paragraph("Policyholder Information", heading_style))
        
        client = policy.client_details or {}
        client_data = [
            ['Name:', client.get('fullName') or f"{client.get('firstName', '')} {client.get('lastName', '')}".strip()],
            ['Email:', client.get('email', 'N/A')],
            ['Phone:', client.get('phone') or client.get('phoneNumber', 'N/A')],
            ['ID Number:', client.get('idNumber', 'N/A')],
        ]
        
        if client.get('kraPin'):
            client_data.append(['KRA PIN:', client.get('kraPin')])
        
        client_table = Table(client_data, colWidths=[2*inch, 4*inch])
        client_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F0F0F0')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(client_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # Vehicle Details Section
        story.append(Paragraph("Vehicle Information", heading_style))
        
        vehicle = policy.vehicle_details or {}
        vehicle_data = [
            ['Registration:', vehicle.get('registration', 'N/A')],
            ['Make:', vehicle.get('make', 'N/A')],
            ['Model:', vehicle.get('model', 'N/A')],
            ['Year:', str(vehicle.get('year', 'N/A'))],
        ]
        
        if vehicle.get('chassisNumber'):
            vehicle_data.append(['Chassis Number:', vehicle.get('chassisNumber')])
        
        if vehicle.get('sumInsured'):
            vehicle_data.append(['Sum Insured:', f"KSh {vehicle.get('sumInsured'):,.2f}"])
        
        vehicle_table = Table(vehicle_data, colWidths=[2*inch, 4*inch])
        vehicle_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F0F0F0')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        
        story.append(vehicle_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # Premium Breakdown Section
        story.append(Paragraph("Premium Breakdown", heading_style))
        
        premium = policy.premium_breakdown or {}
        premium_data = [
            ['Base Premium:', f"KSh {premium.get('basePremium') or premium.get('base_premium', 0):,.2f}"],
            ['Training Levy (0.25%):', f"KSh {premium.get('trainingLevy') or premium.get('training_levy', 0):,.2f}"],
            ['PCF Levy (0.25%):', f"KSh {premium.get('pcfLevy') or premium.get('pcf_levy', 0):,.2f}"],
            ['Stamp Duty:', f"KSh {premium.get('stampDuty') or premium.get('stamp_duty', 40):,.2f}"],
            ['', ''],  # Separator row
            ['TOTAL PREMIUM:', f"KSh {premium.get('totalAmount') or premium.get('total_amount', 0):,.2f}"],
        ]
        
        premium_table = Table(premium_data, colWidths=[2*inch, 4*inch])
        premium_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -2), colors.HexColor('#F0F0F0')),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#D5222B')),
            ('TEXTCOLOR', (0, 0), (-1, -2), colors.black),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -2), 'Helvetica'),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -2), 10),
            ('FONTSIZE', (0, -1), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -2), 0.5, colors.grey),
            ('GRID', (0, -1), (-1, -1), 1, colors.HexColor('#D5222B')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LINEABOVE', (0, -1), (-1, -1), 2, colors.black),
        ]))
        
        story.append(premium_table)
        story.append(Spacer(1, 0.3 * inch))
        
        # Underwriter Information (if available)
        if policy.underwriter_details:
            story.append(Paragraph("Underwriter", heading_style))
            underwriter = policy.underwriter_details
            underwriter_data = [
                ['Underwriter:', underwriter.get('name', 'N/A')],
                ['Code:', underwriter.get('code', 'N/A')],
            ]
            
            underwriter_table = Table(underwriter_data, colWidths=[2*inch, 4*inch])
            underwriter_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F0F0F0')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('LEFTPADDING', (0, 0), (-1, -1), 8),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            
            story.append(underwriter_table)
            story.append(Spacer(1, 0.3 * inch))
        
        # Footer: Terms and conditions
        story.append(Spacer(1, 0.5 * inch))
        story.append(Paragraph("Terms and Conditions", heading_style))
        story.append(Paragraph(
            "This policy is subject to the terms, conditions, and exclusions as outlined in the full policy document. "
            "Please contact PataBima Insurance Agency for complete policy details.",
            styles['Normal']
        ))
        
        story.append(Spacer(1, 0.3 * inch))
        story.append(Paragraph(
            f"Generated on: {datetime.now().strftime('%d %B %Y at %H:%M')}",
            ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey)
        ))
        
        # Build PDF
        doc.build(story)
        
        # Get PDF content
        pdf_content = buffer.getvalue()
        buffer.close()
        
        logger.info(f"PDF generated successfully for {policy.policy_number} ({len(pdf_content)} bytes)")
        
        # Upload to S3
        s3_url = upload_pdf_to_s3(pdf_content, policy.policy_number)
        
        return s3_url
    
    except ImportError as e:
        logger.error(f"ReportLab not installed: {e}")
        logger.warning("Install with: pip install reportlab")
        return None
    
    except Exception as e:
        logger.error(f"Error generating PDF for {policy.policy_number}: {e}")
        import traceback
        traceback.print_exc()
        return None


def upload_pdf_to_s3(pdf_content, policy_number):
    """
    Upload generated PDF to AWS S3.
    
    Args:
        pdf_content (bytes): PDF file content
        policy_number (str): Policy number for filename
    
    Returns:
        str: S3 URL of uploaded file, or None if upload fails
    """
    try:
        import boto3
        from django.conf import settings
        
        # Check if S3 is configured
        if not hasattr(settings, 'AWS_STORAGE_BUCKET_NAME'):
            logger.warning("AWS S3 not configured - skipping upload")
            return None
        
        s3_client = boto3.client(
            's3',
            aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
            aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
            region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'us-east-1')
        )
        
        bucket_name = settings.AWS_STORAGE_BUCKET_NAME
        file_key = f"policies/{policy_number}/{policy_number}_certificate.pdf"
        
        # Upload to S3
        s3_client.put_object(
            Bucket=bucket_name,
            Key=file_key,
            Body=pdf_content,
            ContentType='application/pdf',
            ACL='private'  # Keep private, use pre-signed URLs for access
        )
        
        # Generate S3 URL
        s3_url = f"https://{bucket_name}.s3.amazonaws.com/{file_key}"
        
        logger.info(f"PDF uploaded to S3: {s3_url}")
        
        return s3_url
    
    except ImportError:
        logger.warning("boto3 not installed - skipping S3 upload")
        return None
    
    except Exception as e:
        logger.error(f"Error uploading PDF to S3: {e}")
        return None


def generate_presigned_url(s3_url, expiration=3600):
    """
    Generate a pre-signed URL for downloading a policy PDF.
    
    Args:
        s3_url (str): S3 URL of the file
        expiration (int): URL expiration time in seconds (default 1 hour)
    
    Returns:
        str: Pre-signed URL, or original URL if generation fails
    """
    try:
        import boto3
        from django.conf import settings
        from urllib.parse import urlparse
        
        # Parse S3 URL
        parsed = urlparse(s3_url)
        bucket_name = parsed.netloc.split('.')[0]
        file_key = parsed.path.lstrip('/')
        
        s3_client = boto3.client(
            's3',
            aws_access_key_id=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
            aws_secret_access_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
            region_name=getattr(settings, 'AWS_S3_REGION_NAME', 'us-east-1')
        )
        
        # Generate pre-signed URL
        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': bucket_name, 'Key': file_key},
            ExpiresIn=expiration
        )
        
        return presigned_url
    
    except Exception as e:
        logger.error(f"Error generating pre-signed URL: {e}")
        return s3_url  # Return original URL as fallback
