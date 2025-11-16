$env:Path += ";C:\Users\USER\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts"

# Create EB environment with all configurations
eb create patabima-production `
  --instance-type t3.medium `
  --elb-type application `
  --envvars `
    SECRET_KEY='y4TfsQDZdrmdqMmRXv7Gr5mrEvHfop3nfhb40UjjIufjzNrw-6eiPCga4AF6eVlN6tPdGW2OcUqmwKN_v5Lyb1knWN3vYhCGT_8j',`
    DEBUG=False,`
    ALLOWED_HOSTS='api.patabima.co.ke,.elasticbeanstalk.com',`
    DJANGO_SETTINGS_MODULE='insurance.settings',`
    PYTHONUNBUFFERED=1,`
    RDS_HOSTNAME='patabima-production-db.ca5qmyoi41xu.us-east-1.rds.amazonaws.com',`
    RDS_PORT=5432,`
    RDS_DB_NAME='patabimadb',`
    RDS_USERNAME='patabimaadmin',`
    RDS_PASSWORD='PataB1ma2025Secure',`
    USE_S3_MEDIA=1,`
    AWS_STORAGE_BUCKET_NAME='patabima-media-prod',`
    AWS_S3_REGION_NAME='us-east-1',`
    DMVIC_BASE_URL='https://uat-api.dmvic.com',`
    DMVIC_MEMBER_CODE='PATABIMA',`
    CORS_ALLOWED_ORIGINS='https://app.patabima.co.ke,https://www.patabima.co.ke',`
    LOG_LEVEL='INFO'

Write-Host "Environment creation initiated. This may take 5-10 minutes..."
