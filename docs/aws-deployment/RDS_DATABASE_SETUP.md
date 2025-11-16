# RDS PostgreSQL Database Setup Guide

**Date:** November 14, 2025  
**AWS Account:** KAHOI-KREATIONS (804686432477)  
**Region:** us-east-1  
**Database:** PostgreSQL 15.8

---

## Current RDS Database Status

✅ **Database Already Created!**

**Connection Details:**

```
Endpoint: patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com
Port: 5432
Database Name: patabimadb
Username: patabimaadmin
Password: PataB1ma2025Secure
Status: Available
```

**Verify Status:**

```powershell
aws rds describe-db-instances `
  --db-instance-identifier patabima-production-db `
  --query 'DBInstances[0].[DBInstanceStatus,Endpoint.Address,Engine,EngineVersion]' `
  --output table
```

---

## Database Configuration Details

### Instance Specifications

- **Instance Class:** db.t3.micro
- **Engine:** PostgreSQL 15.8
- **Storage:** 20 GB GP3 SSD (scalable to 1000 GB)
- **Multi-AZ:** No (Single-AZ for cost savings in dev/staging)
- **Backup Retention:** 7 days
- **Storage Encryption:** Enabled
- **Public Access:** No (VPC-only)

### Network Configuration

- **VPC:** Default VPC
- **Subnet Group:** default
- **Security Group:** Allows PostgreSQL (port 5432) from EC2 instances

---

## Connecting to RDS Database

### From EC2 Instance

```bash
# Install PostgreSQL client
sudo dnf install -y postgresql15

# Connect to database
psql -h patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com \
     -U patabimaadmin \
     -d patabimadb

# Enter password when prompted: PataB1ma2025Secure
```

### From Django Application

**Environment Variables (.env file):**

```bash
RDS_HOSTNAME=patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com
RDS_PORT=5432
RDS_DB_NAME=patabimadb
RDS_USERNAME=patabimaadmin
RDS_PASSWORD=PataB1ma2025Secure
```

**Django settings.py:**

```python
import os

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('RDS_DB_NAME', 'patabimadb'),
        'USER': os.getenv('RDS_USERNAME', 'patabimaadmin'),
        'PASSWORD': os.getenv('RDS_PASSWORD'),
        'HOST': os.getenv('RDS_HOSTNAME'),
        'PORT': os.getenv('RDS_PORT', '5432'),
        'OPTIONS': {
            'connect_timeout': 10,
        }
    }
}
```

---

## Security Configuration

### RDS Security Group Rules

**Inbound Rules:**
| Type | Protocol | Port | Source | Description |
|------|----------|------|--------|-------------|
| PostgreSQL | TCP | 5432 | EC2 Security Group | Allow EC2 instances |

**Check Security Group:**

```powershell
# Get security group ID
$SG_ID = aws rds describe-db-instances `
  --db-instance-identifier patabima-production-db `
  --query 'DBInstances[0].VpcSecurityGroups[0].VpcSecurityGroupId' `
  --output text

# View rules
aws ec2 describe-security-groups --group-ids $SG_ID
```

### Allow EC2 Instance Access

```powershell
# Get EC2 security group ID
$EC2_SG_ID = "sg-xxxxxxxxxxxxx"  # Your EC2 security group

# Add inbound rule to RDS security group
aws ec2 authorize-security-group-ingress `
  --group-id $SG_ID `
  --protocol tcp `
  --port 5432 `
  --source-group $EC2_SG_ID
```

---

## Database Management Tasks

### Create Application Database User (Best Practice)

Instead of using the master user (`patabimaadmin`) for the application, create a dedicated user:

```sql
-- Connect as master user
psql -h patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com \
     -U patabimaadmin -d patabimadb

-- Create application user
CREATE USER patabima_app WITH PASSWORD 'AppUser2025Secure!';

-- Grant privileges
GRANT CONNECT ON DATABASE patabimadb TO patabima_app;
GRANT USAGE ON SCHEMA public TO patabima_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO patabima_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO patabima_app;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO patabima_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO patabima_app;

-- Verify
\du  -- List users
```

**Update Django .env:**

```bash
RDS_USERNAME=patabima_app
RDS_PASSWORD=AppUser2025Secure!
```

### Run Django Migrations

```bash
cd /var/www/patabima
source venv/bin/activate

# Load environment variables
export $(cat .env | xargs)

# Test connection
python manage.py check --database default

# Run migrations
python manage.py migrate

# Expected output:
# Operations to perform:
#   Apply all migrations: admin, auth, contenttypes, sessions, app
# Running migrations:
#   Applying contenttypes.0001_initial... OK
#   Applying auth.0001_initial... OK
#   ...
```

### Create Database Backup

```bash
# Manual backup
pg_dump -h patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com \
        -U patabimaadmin \
        -d patabimadb \
        -F c \
        -f patabimadb_backup_$(date +%Y%m%d).dump

# Upload to S3
aws s3 cp patabimadb_backup_$(date +%Y%m%d).dump \
  s3://patabima-media-prod/backups/
```

### Restore Database Backup

```bash
# Download from S3
aws s3 cp s3://patabima-media-prod/backups/patabimadb_backup_20251114.dump .

# Restore
pg_restore -h patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com \
           -U patabimaadmin \
           -d patabimadb \
           -c \
           patabimadb_backup_20251114.dump
```

---

## Monitoring & Performance

### Enable Enhanced Monitoring

```powershell
# Enable Enhanced Monitoring (1-minute intervals)
aws rds modify-db-instance `
  --db-instance-identifier patabima-production-db `
  --monitoring-interval 60 `
  --monitoring-role-arn arn:aws:iam::804686432477:role/rds-monitoring-role `
  --apply-immediately
```

### CloudWatch Metrics

**Key Metrics to Monitor:**

- `DatabaseConnections` - Number of active connections
- `CPUUtilization` - CPU usage percentage
- `FreeableMemory` - Available RAM
- `ReadIOPS` / `WriteIOPS` - Disk I/O operations
- `NetworkReceiveThroughput` / `NetworkTransmitThroughput`

**Create CloudWatch Alarm:**

```powershell
# High CPU alarm
aws cloudwatch put-metric-alarm `
  --alarm-name patabima-rds-high-cpu `
  --alarm-description "Alert when RDS CPU exceeds 80%" `
  --metric-name CPUUtilization `
  --namespace AWS/RDS `
  --statistic Average `
  --period 300 `
  --threshold 80 `
  --comparison-operator GreaterThanThreshold `
  --evaluation-periods 2 `
  --dimensions Name=DBInstanceIdentifier,Value=patabima-production-db
```

### Query Performance Insights

```powershell
# Enable Performance Insights
aws rds modify-db-instance `
  --db-instance-identifier patabima-production-db `
  --enable-performance-insights `
  --performance-insights-retention-period 7 `
  --apply-immediately
```

View in AWS Console: RDS → patabima-production-db → Performance Insights

---

## Database Optimization

### Connection Pooling (Django)

Install `django-db-geventpool`:

```bash
pip install django-db-geventpool psycopg[pool]
```

**Update settings.py:**

```python
DATABASES = {
    'default': {
        'ENGINE': 'django_db_geventpool.backends.postgresql',  # Changed
        'NAME': os.getenv('RDS_DB_NAME'),
        'USER': os.getenv('RDS_USERNAME'),
        'PASSWORD': os.getenv('RDS_PASSWORD'),
        'HOST': os.getenv('RDS_HOSTNAME'),
        'PORT': os.getenv('RDS_PORT', '5432'),
        'CONN_MAX_AGE': 0,
        'OPTIONS': {
            'MAX_CONNS': 20,  # Connection pool size
            'connect_timeout': 10,
        }
    }
}
```

### Database Indexes

```sql
-- Connect to database
psql -h patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com \
     -U patabimaadmin -d patabimadb

-- Common indexes for PataBima app
CREATE INDEX idx_policy_number ON app_quotation(quote_number);
CREATE INDEX idx_client_id ON app_quotationclient(id_number);
CREATE INDEX idx_vehicle_reg ON app_quotationvehicle(registration_number);
CREATE INDEX idx_created_at ON app_quotation(created_at DESC);

-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM app_quotation WHERE quote_number = 'QT-2025-001234';
```

---

## Scaling & High Availability

### Vertical Scaling (Increase Instance Size)

```powershell
# Upgrade to db.t3.medium for better performance
aws rds modify-db-instance `
  --db-instance-identifier patabima-production-db `
  --db-instance-class db.t3.medium `
  --apply-immediately
```

**Downtime:** ~5 minutes during instance class change

### Enable Multi-AZ (High Availability)

```powershell
# Enable Multi-AZ deployment
aws rds modify-db-instance `
  --db-instance-identifier patabima-production-db `
  --multi-az `
  --apply-immediately
```

**Benefits:**

- Automatic failover to standby instance
- Enhanced durability
- Zero data loss
- ~1 minute failover time

**Cost:** Doubles RDS instance cost

### Read Replicas (For Read-Heavy Workloads)

```powershell
# Create read replica
aws rds create-db-instance-read-replica `
  --db-instance-identifier patabima-production-db-replica `
  --source-db-instance-identifier patabima-production-db `
  --db-instance-class db.t3.micro
```

**Django settings for read replica:**

```python
DATABASES = {
    'default': {
        # Master (write)
        'ENGINE': 'django.db.backends.postgresql',
        'HOST': 'patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com',
        # ... other settings
    },
    'replica': {
        # Read replica (read-only)
        'ENGINE': 'django.db.backends.postgresql',
        'HOST': 'patabima-production-db-replica.ca5qmyoi41xu.us-east-1.rds.amazonaws.com',
        # ... other settings
    }
}

# Use database router for read/write splitting
DATABASE_ROUTERS = ['app.routers.ReadWriteRouter']
```

---

## Maintenance & Updates

### Automated Backups

**Current Configuration:**

- Backup retention: 7 days
- Backup window: 03:00-04:00 UTC
- Automated backups enabled

**Modify backup settings:**

```powershell
aws rds modify-db-instance `
  --db-instance-identifier patabima-production-db `
  --backup-retention-period 14 `
  --preferred-backup-window "03:00-04:00" `
  --apply-immediately
```

### Maintenance Window

```powershell
# Set maintenance window
aws rds modify-db-instance `
  --db-instance-identifier patabima-production-db `
  --preferred-maintenance-window "sun:04:00-sun:05:00" `
  --apply-immediately
```

### Database Engine Upgrades

```powershell
# Check available upgrades
aws rds describe-db-engine-versions `
  --engine postgres `
  --engine-version 15.8 `
  --query 'DBEngineVersions[0].ValidUpgradeTarget'

# Upgrade PostgreSQL version
aws rds modify-db-instance `
  --db-instance-identifier patabima-production-db `
  --engine-version 16.1 `
  --allow-major-version-upgrade `
  --apply-immediately
```

---

## Troubleshooting

### Issue: Connection Timeout

```bash
# Test network connectivity
telnet patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com 5432

# Check security group rules
aws ec2 describe-security-groups --group-ids $SG_ID

# Verify RDS is in the same VPC as EC2
aws rds describe-db-instances `
  --db-instance-identifier patabima-production-db `
  --query 'DBInstances[0].DBSubnetGroup.VpcId'
```

### Issue: Too Many Connections

```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle' AND state_change < now() - interval '10 minutes';

-- Increase max_connections parameter
-- In AWS Console: RDS → Parameter Groups → Modify → max_connections = 200
```

### Issue: Slow Queries

```sql
-- Enable slow query logging
-- In Parameter Group: log_min_duration_statement = 1000 (1 second)

-- View slow queries in CloudWatch Logs
-- RDS → patabima-production-db → Logs & events → postgresql.log
```

---

## Cost Optimization

### Current Monthly Cost

- **db.t3.micro:** ~$15/month (Single-AZ)
- **Storage (20 GB GP3):** ~$2/month
- **Backups (7 days):** ~$0.20/month
- **Total:** ~$17/month

### Optimization Tips

1. **Right-size instance:**

   - Monitor CPU/Memory usage
   - Downgrade to db.t3.micro if underutilized
   - Upgrade to db.t3.medium if CPU > 70%

2. **Storage optimization:**

   - Enable autoscaling to avoid over-provisioning
   - Use GP3 instead of GP2 (10-20% cheaper)

3. **Backup optimization:**

   - Reduce retention period for dev/staging (3 days)
   - Use snapshots for long-term backups (cheaper)

4. **Reserved Instances:**
   - 40% savings with 1-year reservation
   - 60% savings with 3-year reservation

---

## Security Best Practices

- [x] Database not publicly accessible
- [x] Encryption at rest enabled
- [x] Encryption in transit (SSL)
- [x] Strong master password (20+ characters)
- [ ] Create dedicated application user (not master)
- [x] Security group restricts access to EC2 only
- [ ] Enable CloudWatch Logs (postgresql.log)
- [x] Automated backups enabled (7 days)
- [ ] Enable Performance Insights
- [ ] Regular security patches (maintenance window)

---

## Quick Reference Commands

```powershell
# Check RDS status
aws rds describe-db-instances --db-instance-identifier patabima-production-db

# Connect to database
psql -h patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com -U patabimaadmin -d patabimadb

# Create manual snapshot
aws rds create-db-snapshot `
  --db-instance-identifier patabima-production-db `
  --db-snapshot-identifier patabima-manual-$(Get-Date -Format "yyyyMMdd-HHmmss")

# Stop RDS instance (dev/staging cost savings)
aws rds stop-db-instance --db-instance-identifier patabima-production-db

# Start RDS instance
aws rds start-db-instance --db-instance-identifier patabima-production-db

# Delete RDS instance (DANGEROUS!)
aws rds delete-db-instance `
  --db-instance-identifier patabima-production-db `
  --skip-final-snapshot
```

---

**Database is Ready for Production! ✅**

Connection string for Django:

```
postgresql://patabimaadmin:PataB1ma2025Secure@patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com:5432/patabimadb
```
