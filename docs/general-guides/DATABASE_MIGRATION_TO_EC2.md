# Database Migration from Local to EC2

## Problem

Your PostgreSQL database on EC2 is empty even though everything works locally. This is because:

1. **Local Database**: Has all your data (motor products, underwriters, pricing, users, etc.)
2. **EC2 Database**: Only has the table structure (from migrations), but no actual data

## Solution: Transfer Local Data to EC2

### Step 1: Backup Your Local Database

On your local machine (Windows PowerShell):

```powershell
# Navigate to your project
cd "C:\Users\USER\Desktop\PATABIMA\PATABIMA FRONT\PATA BIMA AGENCY - Copy\insurance-app"

# Create a complete database dump
python manage.py dumpdata --natural-foreign --natural-primary -e contenttypes -e auth.Permission --indent 2 -o local_db_backup.json
```

This creates `local_db_backup.json` with ALL your data.

### Step 2: Transfer the Backup File to EC2

```powershell
# Replace with your EC2 IP and key file path
scp -i "path/to/your-key.pem" local_db_backup.json ubuntu@YOUR_EC2_IP:/home/ubuntu/insurance-app/
```

### Step 3: Load Data into EC2 Database

SSH into your EC2 instance:

```bash
ssh -i "path/to/your-key.pem" ubuntu@YOUR_EC2_IP
```

Then on EC2:

```bash
cd /home/ubuntu/insurance-app

# Activate virtual environment
source venv/bin/activate

# Load the data
python manage.py loaddata local_db_backup.json
```

## Alternative: Direct PostgreSQL Dump (Recommended for Large Databases)

### Step 1: Create PostgreSQL Dump (Local Machine)

```powershell
# Using pg_dump (requires PostgreSQL client installed)
pg_dump -h 127.0.0.1 -p 5432 -U patabima_user -d patabima_insurance -F c -f patabima_backup.dump
```

### Step 2: Transfer Dump to EC2

```powershell
scp -i "path/to/your-key.pem" patabima_backup.dump ubuntu@YOUR_EC2_IP:/home/ubuntu/
```

### Step 3: Restore on EC2

```bash
ssh -i "path/to/your-key.pem" ubuntu@YOUR_EC2_IP

# On EC2, restore the database
pg_restore -h localhost -p 5432 -U your_ec2_db_user -d your_ec2_db_name -c -F c /home/ubuntu/patabima_backup.dump
```

## Verify Data Migration

After loading data, verify on EC2:

```bash
cd /home/ubuntu/insurance-app
source venv/bin/activate
python manage.py shell
```

In the Django shell:

```python
from app.models import MotorCategory, MotorSubcategory, InsuranceProvider, MotorPricing

# Check data counts
print(f"Motor Categories: {MotorCategory.objects.count()}")
print(f"Motor Subcategories: {MotorSubcategory.objects.count()}")
print(f"Insurance Providers: {InsuranceProvider.objects.count()}")
print(f"Motor Pricing Records: {MotorPricing.objects.count()}")

# List some data
print("\nCategories:")
for cat in MotorCategory.objects.all():
    print(f"  - {cat.name} ({cat.category_code})")

print("\nUnderwriters:")
for provider in InsuranceProvider.objects.all():
    print(f"  - {provider.name}")
```

## Common Issues & Solutions

### Issue 1: Permission Denied

**Problem**: Can't connect to EC2 database
**Solution**: Check your EC2 `.env` file has correct database credentials:

```bash
# On EC2
cd /home/ubuntu/insurance-app
nano .env

# Make sure DATABASE_URL is correct:
DATABASE_URL=postgresql://ec2_db_user:ec2_db_password@localhost:5432/ec2_db_name
```

### Issue 2: Foreign Key Conflicts

**Problem**: `loaddata` fails with foreign key errors
**Solution**: Load data in order:

```bash
# Load in specific order
python manage.py loaddata --exclude contenttypes --exclude auth.Permission local_db_backup.json
```

### Issue 3: Duplicate Key Errors

**Problem**: Data already exists in EC2
**Solution**: Clear EC2 database first:

```bash
# CAREFUL: This deletes all data
python manage.py flush --no-input

# Then load backup
python manage.py loaddata local_db_backup.json
```

## Quick Verification Checklist

After migration, test these on EC2:

1. **Admin Panel**: http://YOUR_EC2_IP:8000/admin

   - Login with your superuser account
   - Check: Motor Categories, Subcategories, Providers visible

2. **API Endpoints**:

   ```bash
   # Test motor categories API
   curl http://YOUR_EC2_IP:8000/api/v1/motor/categories/

   # Test underwriters API
   curl http://YOUR_EC2_IP:8000/api/v1/public_app/insurance/get_underwriters/
   ```

3. **Frontend Connection**:
   - Update frontend `.env` to point to EC2:
   ```
   EXPO_PUBLIC_API_URL=http://YOUR_EC2_IP:8000
   ```
   - Restart Expo: `npm start`
   - Test Motor 2 flow in the app

## Environment Configuration

### Local `.env` (Keep as is):

```properties
DATABASE_URL=postgresql://patabima_user:StrongPass123!@127.0.0.1:5432/patabima_insurance
```

### EC2 `.env` (Should match your EC2 PostgreSQL):

```properties
DATABASE_URL=postgresql://your_ec2_user:your_ec2_password@localhost:5432/your_ec2_db_name
DJANGO_SETTINGS_MODULE=insurance.settings
DEBUG=False
ALLOWED_HOSTS=YOUR_EC2_IP,yourdomain.com
```

## Automated Sync Script (Optional)

Create a script to regularly sync local → EC2:

```bash
#!/bin/bash
# sync_db_to_ec2.sh

# Backup local DB
python manage.py dumpdata -o latest_backup.json

# Transfer to EC2
scp -i ~/.ssh/your-key.pem latest_backup.json ubuntu@YOUR_EC2_IP:/home/ubuntu/

# Load on EC2
ssh -i ~/.ssh/your-key.pem ubuntu@YOUR_EC2_IP << 'EOF'
cd /home/ubuntu/insurance-app
source venv/bin/activate
python manage.py loaddata /home/ubuntu/latest_backup.json
EOF

echo "Database synced to EC2!"
```

## Important Notes

1. **Passwords**: User passwords in the backup are already hashed - they'll work on EC2
2. **Media Files**: This only migrates database data. For uploaded files (S3), they're already on AWS
3. **Environment Variables**: Make sure EC2 `.env` matches your AWS resources (S3 buckets, SQS, etc.)
4. **Migrations**: EC2 already has migrations run - you're just adding data
5. **Superuser**: Your local admin account will work on EC2 after migration

## Next Steps

After successful migration:

1. ✅ Verify all data is visible in EC2 admin panel
2. ✅ Test Motor 2 flow end-to-end from mobile app
3. ✅ Check premium calculations work
4. ✅ Test document uploads (AWS Textract integration)
5. ✅ Verify underwriter comparisons load correctly

## Troubleshooting

If you still see empty tables:

```bash
# Check if migrations ran
python manage.py showmigrations

# Check database connection
python manage.py dbshell
\dt  # List all tables
\q   # Exit

# Check logs
tail -f /var/log/gunicorn/error.log
```

Need help? Share the error message you're seeing and I'll help debug!
