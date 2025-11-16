# Create Sample Campaigns for PataBima
# Run: python manage.py shell < create_sample_campaigns.py

from app.models import Campaign, User
from django.utils import timezone
from datetime import timedelta

print("=" * 60)
print("Creating Sample Campaigns for PataBima")
print("=" * 60)

# Get admin user
admin = User.objects.filter(is_admin=True).first()
if not admin:
    print("❌ ERROR: No admin user found!")
    print("Please create an admin user first:")
    print("  python manage.py createsuperuser")
    exit()

print(f"✓ Using admin user: {admin.email or admin.phonenumber}")

# Create sample campaigns
campaigns_data = [
    {
        'name': 'Motor Insurance Promo - Q4 2025',
        'title': "Get 20% Off Motor Insurance!",
        'message': 'Protect your vehicle with comprehensive coverage. Limited time offer.',
        'campaign_type': 'PROMOTIONAL',
        'image_url': 'https://patabima.com/assets/images/motor-promo.jpg',
        'action_url': 'https://patabima.com/motor-insurance',
        'call_to_action': 'Get Quote Now',
        'target_roles': 'ALL',
    },
    {
        'name': 'Medical Insurance - New Year',
        'title': 'Secure Your Health in 2026',
        'message': 'Comprehensive medical coverage for you and your family.',
        'campaign_type': 'SEASONAL',
        'image_url': 'https://patabima.com/assets/images/medical.jpg',
        'action_url': 'https://patabima.com/medical-insurance',
        'call_to_action': 'Learn More',
        'target_roles': 'CUSTOMER',
    },
    {
        'name': 'Agent Recruitment Drive',
        'title': 'Join Our Agent Network',
        'message': 'Earn competitive commissions selling insurance.',
        'campaign_type': 'ACQUISITION',
        'image_url': 'https://patabima.com/assets/images/agent-recruitment.jpg',
        'action_url': 'https://patabima.com/become-agent',
        'call_to_action': 'Apply Now',
        'target_roles': 'NEW_USERS',
    },
    {
        'name': 'WIBA Insurance Awareness',
        'title': 'Protect Your Workers',
        'message': 'Mandatory WIBA coverage for all employers.',
        'campaign_type': 'EDUCATIONAL',
        'image_url': 'https://patabima.com/assets/images/wiba.jpg',
        'action_url': 'https://patabima.com/wiba-insurance',
        'call_to_action': 'Get WIBA Quote',
        'target_roles': 'ALL',
    },
    {
        'name': 'Travel Insurance Summer',
        'title': 'Travel with Confidence',
        'message': 'Comprehensive travel insurance for your next adventure.',
        'campaign_type': 'SEASONAL',
        'image_url': 'https://patabima.com/assets/images/travel.jpg',
        'action_url': 'https://patabima.com/travel-insurance',
        'call_to_action': 'Get Covered',
        'target_roles': 'CUSTOMER',
    },
]

print(f"\nCreating {len(campaigns_data)} sample campaigns...")
print("-" * 60)

created_count = 0
existing_count = 0

for data in campaigns_data:
    campaign, created = Campaign.objects.get_or_create(
        name=data['name'],
        defaults={
            **data,
            'description': f"Campaign: {data['title']}",
            'status': 'ACTIVE',
            'start_date': timezone.now(),
            'end_date': timezone.now() + timedelta(days=30),
            'target_impressions': 10000,
            'target_clicks': 500,
            'target_conversions': 50,
            'budget': 50000.00,
            'created_by': admin
        }
    )
    
    if created:
        print(f"✓ Created: {campaign.name}")
        created_count += 1
    else:
        print(f"⚠ Already exists: {campaign.name}")
        existing_count += 1

print("-" * 60)
print(f"\n✅ Campaign creation complete!")
print(f"   Created: {created_count}")
print(f"   Already existed: {existing_count}")
print(f"   Total active campaigns: {Campaign.objects.filter(status='ACTIVE').count()}")
print("\n" + "=" * 60)
print("Next steps:")
print("1. Test the API: python test_campaigns_api.py")
print("2. View in Django admin: http://127.0.0.1:8000/admin/app/campaign/")
print("3. Test mobile app: Campaigns should appear in HomeScreen")
print("=" * 60)
