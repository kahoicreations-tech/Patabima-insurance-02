# PataBima Admin Panel Access Guide

## Admin URL

Access the Django admin panel at:

```
http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/admin/
```

## Creating a Superuser (First Time Setup)

If you don't have admin credentials yet, SSH into your EC2 instance and run:

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com

# Navigate to project directory
cd /path/to/insurance-app

# Activate virtual environment (if using one)
source venv/bin/activate

# Create superuser
python manage.py createsuperuser

# Follow the prompts:
# Username: (choose admin username)
# Email: (your admin email)
# Password: (choose secure password)
# Password (again): (confirm password)
```

## Creating Admin User from Existing User

If you already have a user account in the database but need admin access:

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com

# Navigate to project directory and activate environment
cd /path/to/insurance-app
source venv/bin/activate

# Open Django shell
python manage.py shell

# Then run:
from app.models import User
user = User.objects.get(phonenumber='YOUR_PHONE_NUMBER')  # or email='YOUR_EMAIL'
user.is_staff = True
user.is_superuser = True
user.save()
exit()
```

## Admin Panel Features

Once logged in, you can manage:

### 1. **Dashboard** (`/admin/dashboard/`)

- Sales overview
- Active campaigns statistics
- Recent quotations
- System health metrics

### 2. **Campaigns** (`/admin/app/campaign/`)

- Create/Edit campaigns
- Upload campaign banner images to `/media/campaign_banners/`
- Set target roles (ALL, AGENT, CUSTOMER)
- Track impressions, clicks, conversions
- Schedule campaign dates

### 3. **Motor Insurance Products** (`/admin/app/motorcategory/`)

- Motor categories (PRIVATE, COMMERCIAL, PSV, MOTORCYCLE, TUKTUK, SPECIAL)
- Motor subcategories with pricing models
- Pricing brackets and tonnage scales

### 4. **Insurance Providers** (`/admin/app/insuranceprovider/`)

- Manage underwriters
- Configure supported categories
- Set provider details and ratings

### 5. **Manual Quotes** (`/admin/app/manualquote/`)

- Review agent-submitted quotes (Medical, WIBA, Travel, etc.)
- Add manual pricing
- Approve or reject quotes

### 6. **Users & Agents** (`/admin/app/user/`)

- Manage user accounts
- View agent profiles and commissions
- Set user roles and permissions

### 7. **Policies** (`/admin/app/motorpolicy/`)

- View all motor policies
- Track policy lifecycle (Draft → Active → Expired)
- Manage renewals and extensions

### 8. **Commissions** (`/admin/app/agentcommission/`)

- Track agent earnings
- Process commission payments
- View commission reports

## Campaign Image Upload

To fix the 404 campaign images issue:

### Option 1: Upload via Django Admin

1. Go to `/admin/app/campaign/`
2. Click on a campaign
3. In the "Banner image" field, upload the image file
4. Save

The image will be automatically uploaded to `/media/campaign_banners/`

### Option 2: Direct File Upload to EC2

```bash
# SSH into EC2
ssh -i your-key.pem ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com

# Create media directory if it doesn't exist
sudo mkdir -p /var/www/patabima/media/campaign_banners/

# Upload images (from your local machine, in a separate terminal)
scp -i your-key.pem local_image.jpg ubuntu@ec2-34-203-241-81.compute-1.amazonaws.com:/tmp/

# Then on EC2, move to media directory
sudo mv /tmp/local_image.jpg /var/www/patabima/media/campaign_banners/
sudo chown -R www-data:www-data /var/www/patabima/media/
sudo chmod -R 755 /var/www/patabima/media/
```

### Option 3: Configure Nginx to Serve Media

Add this to your Nginx configuration (`/etc/nginx/sites-available/patabima`):

```nginx
server {
    listen 80;
    server_name ec2-34-203-241-81.compute-1.amazonaws.com;

    # Serve media files
    location /media/ {
        alias /var/www/patabima/media/;
        expires 1d;
        add_header Cache-Control "public, max-age=86400";
    }

    # Serve static files
    location /static/ {
        alias /var/www/patabima/static/;
        expires 1d;
        add_header Cache-Control "public, max-age=31536000";
    }

    # Proxy to Gunicorn
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Then reload Nginx:

```bash
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

## Django Settings for Media Files

Ensure these settings in `insurance-app/insurance/settings.py`:

```python
# Media files (uploads)
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, '../media')  # or absolute path like '/var/www/patabima/media'

# Make sure INSTALLED_APPS includes:
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.staticfiles',
    # ... other apps
]
```

## Troubleshooting

### Can't Access Admin Panel

1. **Check if Django is running:**

   ```bash
   sudo systemctl status gunicorn
   # or
   ps aux | grep gunicorn
   ```

2. **Check firewall allows port 8000:**

   ```bash
   sudo ufw status
   sudo ufw allow 8000
   ```

3. **Check Django logs:**
   ```bash
   sudo journalctl -u gunicorn -n 100
   # or
   tail -f /var/log/gunicorn/error.log
   ```

### Images Still 404 After Upload

1. **Verify file exists:**

   ```bash
   ls -la /var/www/patabima/media/campaign_banners/
   ```

2. **Check file permissions:**

   ```bash
   sudo chown -R www-data:www-data /var/www/patabima/media/
   sudo chmod -R 755 /var/www/patabima/media/
   ```

3. **Verify Nginx serves media:**
   ```bash
   curl -I http://ec2-34-203-241-81.compute-1.amazonaws.com:8000/media/campaign_banners/test.jpg
   ```

### Database Connection Issues

If admin shows database errors:

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test database connection
python manage.py dbshell
```

## Security Recommendations

1. **Change default admin URL** to prevent brute force attacks:

   ```python
   # In urls.py
   urlpatterns = [
       path('secure-admin-panel/', admin.site.urls),  # instead of 'admin/'
   ]
   ```

2. **Enable HTTPS** for production (use Let's Encrypt):

   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

3. **Set strong passwords** for all admin accounts

4. **Enable 2FA** (install django-otp):

   ```bash
   pip install django-otp qrcode
   ```

5. **Restrict admin access by IP** in Nginx:
   ```nginx
   location /admin/ {
       allow YOUR_IP_ADDRESS;
       deny all;
       proxy_pass http://127.0.0.1:8000;
   }
   ```

## Quick Reference

| Action         | URL                         |
| -------------- | --------------------------- |
| Main Admin     | `/admin/`                   |
| Dashboard      | `/admin/dashboard/`         |
| Campaigns      | `/admin/app/campaign/`      |
| Motor Products | `/admin/app/motorcategory/` |
| Manual Quotes  | `/admin/app/manualquote/`   |
| Users          | `/admin/app/user/`          |
| Policies       | `/admin/app/motorpolicy/`   |

## Support

For issues or questions, refer to:

- Django Admin Documentation: https://docs.djangoproject.com/en/4.2/ref/contrib/admin/
- Project Documentation: `/docs/ADMIN_USAGE.md`
