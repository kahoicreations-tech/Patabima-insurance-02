"""
Fix S3 permissions for campaign banner images.
Makes all campaign banners publicly readable.

Usage: python fix_campaign_s3_permissions.py
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

import boto3
from django.conf import settings
from app.models import Campaign

def fix_s3_permissions():
    """Set public-read ACL on all campaign banner images in S3."""
    
    if not settings.USE_S3_MEDIA:
        print("❌ S3 media storage is not enabled. Skipping.")
        return
    
    bucket_name = settings.AWS_STORAGE_BUCKET_NAME
    if not bucket_name:
        print("❌ AWS_STORAGE_BUCKET_NAME not configured. Skipping.")
        return
    
    print(f"🔧 Fixing S3 permissions for campaign banners in bucket: {bucket_name}")
    print("-" * 80)
    
    # Initialize S3 client
    s3_client = boto3.client('s3', region_name=settings.AWS_S3_REGION_NAME)
    
    # Get all campaigns with uploaded banner images
    campaigns = Campaign.objects.exclude(banner_image='').exclude(banner_image__isnull=True)
    
    fixed_count = 0
    error_count = 0
    
    for campaign in campaigns:
        if campaign.banner_image:
            # Extract S3 key from the banner_image field
            s3_key = campaign.banner_image.name
            
            try:
                # Set public-read ACL
                s3_client.put_object_acl(
                    Bucket=bucket_name,
                    Key=s3_key,
                    ACL='public-read'
                )
                
                # Get the public URL
                url = f"https://{bucket_name}.s3.{settings.AWS_S3_REGION_NAME}.amazonaws.com/{s3_key}"
                print(f"✅ Fixed: {campaign.name}")
                print(f"   URL: {url}")
                fixed_count += 1
                
            except Exception as e:
                print(f"❌ Error fixing {campaign.name}: {e}")
                error_count += 1
    
    print("-" * 80)
    print(f"\n📊 Summary:")
    print(f"   Fixed: {fixed_count}")
    print(f"   Errors: {error_count}")
    
    if fixed_count > 0:
        print("\n✅ Campaign banners should now be publicly accessible!")
        print("   Refresh your mobile app to see the images.")

if __name__ == '__main__':
    try:
        fix_s3_permissions()
    except Exception as e:
        print(f"❌ Fatal error: {e}")
        import traceback
        traceback.print_exc()
