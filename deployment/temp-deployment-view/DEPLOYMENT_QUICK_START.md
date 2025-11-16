# AWS Elastic Beanstalk Deployment - Quick Start

## ✅ Files Created

All necessary configuration files have been created in the `insurance-app/` directory:

```
insurance-app/
├── .ebextensions/
│   ├── 01_packages.config        ✅ System packages
│   ├── 02_python.config           ✅ Python environment
│   ├── 03_django.config           ✅ Django commands
│   ├── 04_https.config            ✅ HTTPS redirect
│   └── 05_logs.config             ✅ CloudWatch logs
├── .platform/
│   └── hooks/
│       └── postdeploy/
│           ├── 01_migrate.sh      ✅ Database migrations
│           └── 02_collectstatic.sh ✅ Static files
├── .ebignore                      ✅ Deployment exclusions
├── Procfile                       ✅ Gunicorn configuration
└── runtime.txt                    ✅ Python 3.11
```

---

## 🚀 Deployment Steps

### 1. Update requirements.txt

Add Gunicorn to your `requirements.txt`:

```bash
echo "gunicorn==21.2.0" >> requirements.txt
```

### 2. Install EB CLI

```bash
pip install awsebcli
eb --version
```

### 3. Initialize Elastic Beanstalk

```bash
cd insurance-app
eb init

# Select:
# - Region: us-east-1
# - Application name: patabima-insurance-backend
# - Platform: Python 3.11 running on 64bit Amazon Linux 2023
# - SSH: Yes
```

### 4. Create Environment

```bash
eb create patabima-production \
  --instance-type t3.medium \
  --elb-type application \
  --envvars \
    SECRET_KEY='CHANGE-ME-TO-50-CHAR-RANDOM-STRING' \
    DEBUG=False \
    ALLOWED_HOSTS='api.patabima.co.ke,.elasticbeanstalk.com' \
    USE_S3_MEDIA=1 \
    AWS_STORAGE_BUCKET_NAME=patabima-media \
    AWS_S3_REGION_NAME=us-east-1
```

### 5. Create RDS Database

**Option A: Via EB Console (Easier)**
1. Go to AWS Console → Elastic Beanstalk → patabima-production
2. Configuration → Database → Edit
3. Engine: `postgres`, Version: `15.5`, Instance: `db.t3.medium`
4. Apply

**Option B: Standalone RDS (Recommended)**
```bash
aws rds create-db-instance \
  --db-instance-identifier patabima-db-prod \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.5 \
  --master-username patabima_admin \
  --master-user-password 'YourSecurePassword123!' \
  --allocated-storage 100 \
  --storage-type gp3 \
  --backup-retention-period 7 \
  --multi-az

# Then set environment variables
eb setenv \
  RDS_HOSTNAME=patabima-db-prod.xxxxxx.us-east-1.rds.amazonaws.com \
  RDS_PORT=5432 \
  RDS_DB_NAME=patabima_insurance \
  RDS_USERNAME=patabima_admin \
  RDS_PASSWORD='YourSecurePassword123!'
```

### 6. Deploy Application

```bash
eb deploy patabima-production
```

### 7. Run Migrations

```bash
eb ssh patabima-production
source /var/app/venv/*/bin/activate
cd /var/app/current
python manage.py migrate
python manage.py createsuperuser
exit
```

### 8. Test Deployment

```bash
# Check health
eb health

# View logs
eb logs

# Open in browser
eb open
```

---

## 📋 Pre-Deployment Checklist

### Code Preparation
- [ ] Add `gunicorn==21.2.0` to `requirements.txt`
- [ ] Update `settings.py` for production (see full guide)
- [ ] Ensure all sensitive data uses environment variables
- [ ] Test locally with `DEBUG=False`

### AWS Setup
- [ ] AWS CLI configured with credentials
- [ ] EB CLI installed (`pip install awsebcli`)
- [ ] IAM user has necessary permissions
- [ ] S3 bucket created for media files
- [ ] SSL certificate requested in ACM (optional)

### Environment Variables
- [ ] SECRET_KEY (50+ character random string)
- [ ] DEBUG=False
- [ ] ALLOWED_HOSTS set correctly
- [ ] Database credentials (RDS_*)
- [ ] AWS S3 settings
- [ ] DMVIC credentials
- [ ] CORS_ALLOWED_ORIGINS

---

## 🔐 Essential Environment Variables

```bash
eb setenv \
  SECRET_KEY='your-super-secret-key-50-chars-minimum-random' \
  DEBUG=False \
  ALLOWED_HOSTS='api.patabima.co.ke,.elasticbeanstalk.com' \
  RDS_HOSTNAME='patabima-db.xxxxx.us-east-1.rds.amazonaws.com' \
  RDS_PORT=5432 \
  RDS_DB_NAME='patabima_insurance' \
  RDS_USERNAME='patabima_admin' \
  RDS_PASSWORD='YourSecurePassword' \
  AWS_STORAGE_BUCKET_NAME='patabima-media-prod' \
  AWS_S3_REGION_NAME='us-east-1' \
  USE_S3_MEDIA=1 \
  EMAIL_BACKEND='django_ses.SESBackend' \
  DEFAULT_FROM_EMAIL='noreply@patabima.co.ke' \
  DMVIC_ENABLED=True \
  DMVIC_BASE_URL='https://uat-api.dmvic.com' \
  DMVIC_MEMBER_CODE='PATABIMA' \
  CORS_ALLOWED_ORIGINS='https://app.patabima.co.ke'
```

---

## 🛠️ Common Commands

```bash
# Deploy changes
eb deploy

# View logs in real-time
eb logs --stream

# SSH into instance
eb ssh

# Check environment health
eb health

# Open application in browser
eb open

# List environments
eb list

# Set environment variable
eb setenv KEY=value

# View environment variables
eb printenv

# Restart application
eb restart

# Terminate environment
eb terminate patabima-production
```

---

## 📊 Monitoring

### CloudWatch Logs
```bash
# Stream logs
eb logs --stream

# Download all logs
eb logs --all > app-logs.txt
```

### Health Monitoring
```bash
# Check health status
eb health

# Detailed status
eb status --verbose
```

### Alarms (Set up in AWS Console)
- CPU Utilization > 80%
- Database connections > 50
- HTTP 5xx errors > 10/minute
- Response time > 2 seconds

---

## 💰 Estimated Costs

| Service | Configuration | Monthly Cost |
|---------|---------------|--------------|
| EC2 Instances | t3.medium × 2 | $60 |
| Load Balancer | ALB | $22 |
| RDS PostgreSQL | db.t3.medium Multi-AZ | $130 |
| S3 Storage | 100 GB | $3 |
| Total | | ~$215/month |

**Cost Saving Tips:**
- Use Single-AZ RDS for dev/staging (~50% savings)
- Enable auto-scaling to reduce instances during low traffic
- Use Reserved Instances for production (40-60% savings)

---

## 🆘 Troubleshooting

### Deployment Fails
```bash
# View detailed logs
eb logs

# Common fixes:
# 1. Check requirements.txt syntax
# 2. Verify Python version (python-3.11)
# 3. Ensure migrations run successfully
```

### Database Connection Issues
```bash
# Check security groups
aws ec2 describe-security-groups --group-ids sg-xxxxx

# Test connection from EC2
eb ssh
psql -h RDS_HOSTNAME -U RDS_USERNAME -d RDS_DB_NAME
```

### Static Files Not Loading
```bash
# SSH and manually collect
eb ssh
source /var/app/venv/*/bin/activate
cd /var/app/current
python manage.py collectstatic --noinput
```

### 502 Bad Gateway
```bash
# Check Gunicorn logs
eb ssh
sudo tail -f /var/log/web.stdout.log
sudo tail -f /var/log/eb-engine.log
```

---

## 📚 Additional Resources

- **Full Guide**: See `docs/aws-deployment/ELASTIC_BEANSTALK_DEPLOYMENT_GUIDE.md`
- **AWS EB Docs**: https://docs.aws.amazon.com/elasticbeanstalk/
- **Django Deployment**: https://docs.djangoproject.com/en/4.2/howto/deployment/

---

## ✅ Next Steps After Deployment

1. **SSL Certificate**
   - Request certificate in ACM for your domain
   - Attach to Load Balancer (Configuration → Load Balancer → Listeners → Add HTTPS:443)

2. **Custom Domain**
   - Point your domain to EB environment URL
   - Or use Route 53 for managed DNS

3. **CI/CD Pipeline**
   - Set up GitHub Actions for automated deployments
   - See full guide for workflow example

4. **Monitoring**
   - Create CloudWatch Dashboard
   - Set up SNS alerts for critical events

5. **Security Hardening**
   - Enable Web Application Firewall (WAF)
   - Implement rate limiting
   - Regular security updates

---

**Questions?**  
Refer to the full deployment guide in `docs/aws-deployment/ELASTIC_BEANSTALK_DEPLOYMENT_GUIDE.md`
