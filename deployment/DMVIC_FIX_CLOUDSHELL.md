# DMVIC Configuration Fix - CloudShell Commands

## Quick Fix Steps

### 1. Open AWS CloudShell
Go to: https://console.aws.amazon.com/cloudshell

### 2. Upload PFX Certificate to CloudShell
```bash
# In CloudShell, click Actions > Upload file
# Select: insurance-app/dmvic_credentials/PatabimaAgencyUAT.pfx from your local computer
# The file will be uploaded to /home/cloudshell-user/
```

**Verify the upload:**
```bash
ls -lh ~/PatabimaAgencyUAT.pfx
# Should show the file with size ~2KB
```

### 3. Upload PFX to S3 (for backup)
```bash
aws s3 cp ~/PatabimaAgencyUAT.pfx s3://patabima-media-prod/dmvic/PatabimaAgencyUAT.pfx
```

### 4. Create Directory on EC2
```bash
# Use AWS SSM to connect (no SSH key needed)
aws ssm start-session --target i-0d0f116005d812275 --region us-east-1

# Once connected, run:
cd /var/www/patabima/insurance-app
sudo mkdir -p dmvic_credentials
sudo chown ec2-user:ec2-user dmvic_credentials
chmod 755 dmvic_credentials
exit
```

**Alternative (if SSM doesn't work):**
```bash
# Run command remotely via SSM
aws ssm send-command \
  --instance-ids i-0d0f116005d812275 \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /var/www/patabima/insurance-app","sudo mkdir -p dmvic_credentials","sudo chown ec2-user:ec2-user dmvic_credentials","chmod 755 dmvic_credentials"]' \
  --region us-east-1

# Wait 5 seconds, then check output:
# Get command-id from above output, then:
aws ssm get-command-invocation \
  --command-id <COMMAND-ID-FROM-ABOVE> \
  --instance-id i-0d0f116005d812275 \
  --region us-east-1
```

### 5. Upload Certificate to EC2
```bash
# Copy from S3 to EC2 (within AWS network - faster!)
aws ssm send-command \
  --instance-ids i-0d0f116005d812275 \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["aws s3 cp s3://patabima-media-prod/dmvic/PatabimaAgencyUAT.pfx /var/www/patabima/insurance-app/dmvic_credentials/PatabimaAgencyUAT.pfx","chmod 600 /var/www/patabima/insurance-app/dmvic_credentials/PatabimaAgencyUAT.pfx","ls -la /var/www/patabima/insurance-app/dmvic_credentials/"]' \
  --region us-east-1
### 5. Upload Certificate to EC2
```bash
# Copy from S3 to EC2 (within AWS network - faster!)
aws ssm send-command \
  --instance-ids i-0d0f116005d812275 \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["aws s3 cp s3://patabima-media-prod/dmvic/PatabimaAgencyUAT.pfx /var/www/patabima/insurance-app/dmvic_credentials/PatabimaAgencyUAT.pfx","chmod 600 /var/www/patabima/insurance-app/dmvic_credentials/PatabimaAgencyUAT.pfx","ls -la /var/www/patabima/insurance-app/dmvic_credentials/"]' \
  --region us-east-1
```

### 6. Add DMVIC Environment Variables to Systemd
```bash
aws ssm send-command \
  --instance-ids i-0d0f116005d812275 \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["sudo tee -a /etc/systemd/system/patabima.service > /dev/null << '\''SERVICEEOF'\''

# DMVIC Integration
Environment=\"DMVIC_ENABLED=true\"
Environment=\"DMVIC_BASE_URL=https://uat-api.dmvic.com\"
Environment=\"DMVIC_USERNAME=patabimaagencyapi@dmvic.info\"
Environment=\"DMVIC_PASSWORD=6te224oIUP3l\"
Environment=\"DMVIC_CLIENT_ID=097C69C262EF4350B89E6163E1CEB397\"
Environment=\"DMVIC_MEMBER_CODE=PATABIMA\"
Environment=\"DMVIC_PFX_PATH=dmvic_credentials/PatabimaAgencyUAT.pfx\"
Environment=\"DMVIC_PASSPHRASE=UPfUvocVVOANLqPn\"
SERVICEEOF"]' \
  --region us-east-1
```

### 7. Restart Service
```bash
aws ssm send-command \
  --instance-ids i-0d0f116005d812275 \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["sudo systemctl daemon-reload","sudo systemctl restart patabima","sleep 3","sudo systemctl status patabima --no-pager"]' \
  --region us-east-1
```

### 8. Test DMVIC Endpoint
```bash
curl -X POST http://44.200.182.180/api/insurance/dmvic/search-vehicle/ \
  -H "Content-Type: application/json" \
  -d '{"registration_number": "KDA123A"}'
```

---

## Expected Result
The DMVIC API should now return vehicle data instead of 500 error.

## Troubleshooting

### If SSM commands fail:
```bash
# Check if SSM agent is running on EC2
aws ssm describe-instance-information --region us-east-1

# If instance not listed, install SSM agent manually via EC2 Instance Connect
```

### Check service logs:
```bash
aws ssm send-command \
  --instance-ids i-0d0f116005d812275 \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["sudo journalctl -u patabima -n 50 --no-pager"]' \
  --region us-east-1
```

### Verify DMVIC environment variables:
```bash
aws ssm send-command \
  --instance-ids i-0d0f116005d812275 \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["sudo systemctl cat patabima | grep DMVIC"]' \
  --region us-east-1
```
