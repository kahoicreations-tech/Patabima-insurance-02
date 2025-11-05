# Phone Number Migration - Execution Guide

## Summary of Changes

**Goal**: Store Kenyan phone numbers in 10-digit format with leading 0 (0712345678) instead of 9-digit format without 0 (712345678).

**Key Principle**: Both "0712345678" and "712345678" are treated as the SAME USER after migration.

---

## Files Changed

### Backend Changes (5 files)

1. **`insurance-app/app/models.py`**

   - Changed `phonenumber` field from `max_length=9` to `max_length=10`
   - Updated `UserManager.create_user()` to add leading 0 if 9 digits provided
   - Updated docstrings to reflect 10-digit format

2. **`insurance-app/app/serializers.py`**

   - Updated `phone_digits_validator` regex to require leading 0
   - Changed `AuthLoginSerializer.validate_phonenumber()` to ADD 0 instead of stripping it
   - Changed `LoginSerializer.validate_phonenumber()` to ADD 0 instead of stripping it
   - Changed `RegisterPublicUserSerializer.validate_phonenumber()` to ADD 0 and normalize to 10 digits

3. **`insurance-app/app/services/notifications.py`**

   - Updated `format_kenya_phone()` to handle 10-digit format with leading 0
   - Now converts `0712345678` → `254712345678` for SMS

4. **`insurance-app/app/migrations/0001_change_phone_to_10_digits.py`** (NEW)
   - Migration to change field length from 9 to 10
   - Adds leading 0 to all existing phone numbers
   - Includes rollback function to reverse migration if needed

### Frontend Changes (3 files)

5. **`frontend/screens/auth/LoginScreen.js`**

   - Changed normalization logic to ADD 0 instead of stripping it
   - Updated validation to require 10 digits with leading 0

6. **`frontend/screens/auth/SignupScreen.js`**

   - Updated `normalizePhoneNumber()` to add leading 0 for 9-digit inputs
   - Changed validation regex from `/^\d{9}$/` to `/^0\d{9}$/`
   - Updated error messages to show 10-digit format

7. **`frontend/services/authService.js`**
   - Updated `formatPhoneNumber()` to return 10-digit format with 0
   - Updated `validatePhoneNumber()` to accept both 9 and 10 digits, normalize to 10

---

## Migration Execution Steps

### ⚠️ CRITICAL: Backup First!

```bash
# Backup your database BEFORE running migration
cd insurance-app

# PostgreSQL backup
pg_dump insurance_db > backup_before_phone_migration_$(date +%Y%m%d_%H%M%S).sql

# Or SQLite backup (if using SQLite)
cp db.sqlite3 db.sqlite3.backup_$(date +%Y%m%d_%H%M%S)
```

### Step 1: Find Last Migration Name

```bash
cd insurance-app
python manage.py showmigrations app
```

Look for the last migration in the output, for example:

```
[X] 0012_auto_20241101_1234
```

### Step 2: Update Migration File

Open `insurance-app/app/migrations/0001_change_phone_to_10_digits.py` and replace:

```python
dependencies = [
    ('app', 'XXXX_previous_migration'),  # Replace this
]
```

With the actual last migration:

```python
dependencies = [
    ('app', '0012_auto_20241101_1234'),  # Your actual last migration
]
```

### Step 3: Run Migration

```bash
# Dry run first (check for issues)
python manage.py makemigrations --dry-run

# Run the migration
python manage.py migrate app

# Expected output:
# Running migrations:
#   Applying app.0001_change_phone_to_10_digits...
#   Migrated user 1: 712345678 -> 0712345678
#   Migrated user 2: 712345679 -> 0712345679
#   ...
#   Migration complete: Updated X phone numbers
#   OK
```

### Step 4: Verify Migration

```bash
# Open Django shell
python manage.py shell
```

```python
from app.models import User

# Check a few users
users = User.objects.all()[:5]
for u in users:
    print(f"User {u.id}: {u.phonenumber} (length: {len(u.phonenumber)})")

# Expected output:
# User 1: 0712345678 (length: 10)
# User 2: 0723456789 (length: 10)
# ...

# Test login with both formats
from django.contrib.auth import authenticate

# These should authenticate the SAME user
user1 = authenticate(username='0712345678', password='testpass')
user2 = authenticate(username='712345678', password='testpass')

print(f"User1 ID: {user1.id if user1 else 'None'}")
print(f"User2 ID: {user2.id if user2 else 'None'}")
# Both should show same user ID (backend normalizes 712345678 → 0712345678)
```

### Step 5: Test Authentication Flows

#### Test Login (Backend)

```bash
# Using curl or Postman
curl -X POST http://localhost:8000/api/v1/public_app/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "phonenumber": "712345678",
    "password": "testpass"
  }'

# Should work - backend adds leading 0

curl -X POST http://localhost:8000/api/v1/public_app/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "phonenumber": "0712345678",
    "password": "testpass"
  }'

# Should also work - same user
```

#### Test Signup (Backend)

```bash
curl -X POST http://localhost:8000/api/v1/public_app/auth/signup/ \
  -H "Content-Type: application/json" \
  -d '{
    "phonenumber": "711111111",
    "password": "Test@123",
    "confirm_password": "Test@123",
    "user_role": "CUSTOMER",
    "full_names": "Test User",
    "email": "test@example.com"
  }'

# Check database - should store as 0711111111
python manage.py shell
>>> from app.models import User
>>> u = User.objects.get(email='test@example.com')
>>> print(u.phonenumber)  # Should print: 0711111111
```

### Step 6: Test Frontend

```bash
cd ../frontend
npm start
```

**Test Cases**:

1. Login with `0712345678` → Should work ✅
2. Login with `712345678` → Should work (backend adds 0) ✅
3. Signup with `0711111111` → Should create user with 0711111111 ✅
4. Signup with `711111111` → Should create user with 0711111111 ✅
5. Try to signup with same number twice (one with 0, one without) → Should show "User already exists" ✅

---

## Rollback Plan (If Something Goes Wrong)

### Option 1: Django Migration Rollback

```bash
cd insurance-app

# List migrations
python manage.py showmigrations app

# Rollback to previous migration (before phone change)
python manage.py migrate app 0012_auto_20241101_1234  # Replace with your previous migration

# This will:
# 1. Remove leading 0 from all phone numbers
# 2. Change field back to max_length=9
```

### Option 2: Database Restore

```bash
# PostgreSQL restore
psql insurance_db < backup_before_phone_migration_20241102_123456.sql

# SQLite restore
cp db.sqlite3.backup_20241102_123456 db.sqlite3
```

### Option 3: Manual Revert Code Changes

```bash
# Revert all changes
git diff HEAD  # Review changes
git checkout HEAD -- insurance-app/app/models.py
git checkout HEAD -- insurance-app/app/serializers.py
git checkout HEAD -- insurance-app/app/services/notifications.py
git checkout HEAD -- frontend/screens/auth/LoginScreen.js
git checkout HEAD -- frontend/screens/auth/SignupScreen.js
git checkout HEAD -- frontend/services/authService.js

# Delete migration file
rm insurance-app/app/migrations/0001_change_phone_to_10_digits.py
```

---

## Common Issues & Solutions

### Issue 1: Migration Fails with "field has non-unique values"

**Cause**: Multiple users have phone numbers that become identical after adding 0

**Solution**:

```python
# Find duplicates BEFORE migration
from app.models import User
from collections import Counter

phones = ['0' + u.phonenumber for u in User.objects.all()]
duplicates = [phone for phone, count in Counter(phones).items() if count > 1]
print(f"Duplicate phones: {duplicates}")

# Manually resolve duplicates by deleting or merging users
```

### Issue 2: Existing users can't login after migration

**Cause**: Frontend sending wrong format or backend not normalizing

**Debug**:

```python
# Check what's stored in database
from app.models import User
u = User.objects.get(email='user@example.com')
print(f"Stored: {u.phonenumber} (length: {len(u.phonenumber)})")

# Check what backend receives
# Add print statement in serializers.py validate_phonenumber:
print(f"Received: {value}, Normalized: {clean_phone}")
```

**Fix**: Ensure backend serializer adds leading 0 for 9-digit inputs

### Issue 3: SMS not sending after migration

**Cause**: `format_kenya_phone()` not handling new format

**Debug**:

```python
from app.services.notifications import format_kenya_phone

# Test with different formats
print(format_kenya_phone('0712345678'))  # Should: 254712345678
print(format_kenya_phone('712345678'))   # Should: 254712345678
print(format_kenya_phone('254712345678')) # Should: 254712345678
```

**Fix**: Already updated in `notifications.py` - check line 276

### Issue 4: Frontend validation failing

**Cause**: Frontend still using old regex `/^\d{9}$/`

**Solution**: Update to `/^0\d{9}$/` (already done in SignupScreen.js line 82)

---

## Testing Checklist

Before deploying to production:

- [ ] Backup database created
- [ ] Migration file updated with correct dependency
- [ ] Migration runs successfully
- [ ] All users have 10-digit phone numbers with leading 0
- [ ] Login works with 0712345678 format
- [ ] Login works with 712345678 format (backend adds 0)
- [ ] Signup creates users with 10-digit format
- [ ] Duplicate phone check works (0712345678 and 712345678 seen as same)
- [ ] SMS formatting works (converts to 254712345678)
- [ ] M-PESA payment integration works (if applicable)
- [ ] Admin panel phone search works
- [ ] Frontend validation shows correct format (0712345678)
- [ ] No existing users locked out of accounts
- [ ] Rollback plan tested on dev database

---

## Post-Migration Cleanup

After migration is stable (1-2 weeks):

1. **Remove backward compatibility code** from serializers:

   ```python
   # In serializers.py, remove 9-digit handling
   # Keep only 10-digit validation
   def validate_phonenumber(self, value):
       clean_phone = ''.join(filter(str.isdigit, value))

       if len(clean_phone) != 10 or not clean_phone.startswith('0'):
           raise serializers.ValidationError(
               'Phone number must be 10 digits: 0712345678'
           )

       return clean_phone
   ```

2. **Update UI placeholders**:

   ```javascript
   placeholder = "0712345678"; // Remove "or 712345678" mention
   ```

3. **Update documentation**:
   - API docs
   - User guides
   - Developer onboarding

---

## Summary

**What Changed**:

- Database stores 10-digit format with leading 0 (0712345678)
- Backend accepts both 9 and 10 digits, normalizes to 10
- Frontend sends 10-digit format
- SMS formatting handles new format
- Both "0712345678" and "712345678" treated as SAME user

**User Impact**:

- Existing users: No action needed, can login with or without 0
- New users: Must enter with leading 0 (or system adds it)
- UX: Clearer that Kenyan format (0712...) is expected

**Technical Debt Removed**:

- No more confusion about 9 vs 10 digits
- Consistent format across system
- Better alignment with Kenyan phone number conventions
