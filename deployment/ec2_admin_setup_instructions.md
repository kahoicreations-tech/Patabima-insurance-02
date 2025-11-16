# EC2 Admin User Setup Instructions

## Quick Setup (3 minutes)

### Step 1: Connect to EC2

**Option A: AWS Console (Easiest - No SSH Key Needed)**

1. Open AWS Console: https://console.aws.amazon.com/ec2/
2. Region: **us-east-1** (N. Virginia)
3. Find instance: `i-0d0f116005d812275` or search "44.200.182.180"
4. Click **"Connect"** button → **"EC2 Instance Connect"** tab
5. Username: `ec2-user`
6. Click **"Connect"** (opens browser terminal)

**Option B: SSH (If you have the key)**

```bash
ssh -i ~/.ssh/aws-eb ec2-user@44.200.182.180
```

### Step 2: Upload Admin Creation Script

**In the EC2 browser terminal:**

```bash
# Create the script file
cat > /tmp/create_admin.py << 'EOF'
#!/usr/bin/env python3
import os, sys, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
sys.path.insert(0, '/var/www/patabima')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

PHONE = '0741590055'
PASSWORD = 'Best254#'
EMAIL = 'admin@patabima.com'

user = User.objects.filter(phonenumber=PHONE).first()
if user:
    user.set_password(PASSWORD)
    user.is_staff = True
    user.is_admin = True
    user.email = EMAIL
    user.save()
    print("✅ Admin user updated!")
else:
    user = User.objects.create_superuser(
        phonenumber=PHONE, password=PASSWORD, email=EMAIL
    )
    print("✅ Admin user created!")

print(f"Phone: {user.phonenumber}")
print(f"Email: {user.email}")
print(f"is_staff: {user.is_staff}")
print(f"is_admin: {user.is_admin}")
print("\nLogin: http://44.200.182.180/admin/login/")
EOF
```

### Step 3: Run the Script

```bash
# Navigate to project directory
cd /var/www/patabima

# Activate virtual environment
source venv/bin/activate

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Run the admin creation script
python3 /tmp/create_admin.py
```

**Expected Output:**

```
✅ Admin user created!
Phone: 0741590055
Email: admin@patabima.com
is_staff: True
is_admin: True

Login: http://44.200.182.180/admin/login/
```

### Step 4: Test Login

1. Open browser: http://44.200.182.180/admin/login/
2. Login with:
   - **Phone:** `0741590055`
   - **Password:** `Best254#`
3. You should see the PataBima Insurance Admin dashboard

---

## Alternative: One-Line Command

If the script upload fails, use this one-liner:

```bash
cd /var/www/patabima && source venv/bin/activate && export $(grep -v '^#' .env | xargs) && python3 manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); user, created = User.objects.get_or_create(phonenumber='0741590055'); user.set_password('Best254#'); user.is_staff = True; user.is_admin = True; user.email = 'admin@patabima.com'; user.save(); print(f'✅ Admin: {user.phonenumber}, Staff: {user.is_staff}, Admin: {user.is_admin}')"
```

---

## Verification Commands

### Check if admin user exists:

```bash
cd /var/www/patabima
source venv/bin/activate
export $(grep -v '^#' .env | xargs)

python3 manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); user = User.objects.filter(phonenumber='0741590055').first(); print(f'User exists: {user is not None}') if user else print('User not found')"
```

### List all admin users:

```bash
python3 manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); admins = User.objects.filter(is_admin=True); print(f'Total admins: {admins.count()}'); [print(f'- {u.phonenumber} ({u.email})') for u in admins]"
```

### Test database connection:

```bash
python3 manage.py dbshell
# Type: \dt app_user
# Then: \q to quit
```

---

## Troubleshooting

### Issue: "ModuleNotFoundError: No module named 'django'"

**Solution:**

```bash
cd /var/www/patabima
source venv/bin/activate  # Make sure venv is activated
python3 -c "import django; print(django.VERSION)"
```

### Issue: "ImproperlyConfigured: Set the DJANGO_SETTINGS_MODULE"

**Solution:**

```bash
export DJANGO_SETTINGS_MODULE=insurance.settings
export $(grep -v '^#' .env | xargs)  # Load all env vars
```

### Issue: "psycopg.OperationalError: connection to server failed"

**Solution:**

```bash
# Check database credentials
cat .env | grep RDS

# Test connection
python3 manage.py check --database default
```

### Issue: "django.db.utils.IntegrityError: duplicate key"

**Solution:**

```bash
# User already exists, just update password
python3 manage.py shell -c "from django.contrib.auth import get_user_model; User = get_user_model(); user = User.objects.get(phonenumber='0741590055'); user.set_password('Best254#'); user.save(); print('Password updated')"
```

---

## Admin Credentials Reference

| Field    | Value              |
| -------- | ------------------ |
| Phone    | 0741590055         |
| Password | Best254#           |
| Email    | admin@patabima.com |

**Admin URL:** http://44.200.182.180/admin/login/

---

## Next Steps After Login

1. **Verify Data:**

   - Motor Categories: Should show 6 categories
   - Motor Subcategories: Should show 62 subcategories
   - Insurance Providers: Should show underwriters

2. **Create Additional Users:**

   - Navigate to: Users → Add user
   - Use phone number as username

3. **Set Up SSL (Future):**
   - Point DNS: api.patabima.co.ke → 44.200.182.180
   - Install Let's Encrypt certificate
   - Update BASE_URL to HTTPS

---

**Instance ID:** i-0d0f116005d812275  
**Public IP:** 44.200.182.180  
**Region:** us-east-1
