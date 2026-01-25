# Generated migration to change phone number from 9 to 10 digits
from django.db import migrations, models


def add_leading_zero_to_phones(apps, schema_editor):
    """
    Add leading 0 to all existing 9-digit phone numbers.
    Example: 712345678 -> 0712345678
    """
    User = apps.get_model('app', 'User')
    
    updated_count = 0
    for user in User.objects.all():
        if user.phonenumber and len(user.phonenumber) == 9 and not user.phonenumber.startswith('0'):
            old_phone = user.phonenumber
            user.phonenumber = '0' + user.phonenumber
            user.save(update_fields=['phonenumber'])
            print(f"Migrated user {user.id}: {old_phone} -> {user.phonenumber}")
            updated_count += 1
    
    print(f"\n✅ Migration complete: Updated {updated_count} phone numbers")


def remove_leading_zero_from_phones(apps, schema_editor):
    """
    Reverse migration: Remove leading 0 to restore 9-digit format.
    Example: 0712345678 -> 712345678
    """
    User = apps.get_model('app', 'User')
    
    reverted_count = 0
    for user in User.objects.all():
        if user.phonenumber and len(user.phonenumber) == 10 and user.phonenumber.startswith('0'):
            old_phone = user.phonenumber
            user.phonenumber = user.phonenumber[1:]
            user.save(update_fields=['phonenumber'])
            print(f"Reverted user {user.id}: {old_phone} -> {user.phonenumber}")
            reverted_count += 1
    
    print(f"\n✅ Rollback complete: Reverted {reverted_count} phone numbers")


class Migration(migrations.Migration):
    
    dependencies = [
        ('app', '0050_remove_extension_models'),
    ]

    operations = [
        # Step 1: Increase field length to accommodate 10 digits
        migrations.AlterField(
            model_name='user',
            name='phonenumber',
            field=models.CharField(max_length=10, unique=True),
        ),
        
        # Step 2: Add leading 0 to all existing phone numbers
        migrations.RunPython(
            add_leading_zero_to_phones,
            reverse_code=remove_leading_zero_from_phones
        ),
    ]
