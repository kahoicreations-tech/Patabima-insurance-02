# Quick CORS Fix - Update only settings.py
$EC2_IP = "44.200.182.180"
$KEY_PATH = "$HOME\.ssh\aws-eb"

# Copy the updated settings.py to EC2
scp -i "$KEY_PATH" "C:\Users\USER\Desktop\PATABIMA01\insurance-app\insurance\settings.py" "ec2-user@$EC2_IP:/tmp/settings.py"

# SSH and apply the fix
ssh -i "$KEY_PATH" "ec2-user@$EC2_IP" @'
# Backup current settings
sudo cp /var/www/patabima/insurance-app/insurance/settings.py /var/www/patabima/insurance-app/insurance/settings.py.backup

# Replace with new settings
sudo cp /tmp/settings.py /var/www/patabima/insurance-app/insurance/settings.py
sudo chown ec2-user:ec2-user /var/www/patabima/insurance-app/insurance/settings.py

# Restart Django service
sudo systemctl restart patabima

# Wait a moment
sleep 3

# Test
curl -I http://localhost/api/v1/health/
'@
