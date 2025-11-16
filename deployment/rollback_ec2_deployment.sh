#!/bin/bash
#########################################################
# PataBima EC2 Deployment Rollback Script
# This script undoes the deployment but keeps EC2 running
#########################################################

set -e  # Exit on error

echo "=========================================="
echo "  PataBima EC2 Deployment Rollback"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Stop Gunicorn service
echo -e "${YELLOW}[1/7] Stopping Gunicorn service...${NC}"
sudo systemctl stop patabima || echo "Service not running"
sudo systemctl disable patabima || echo "Service not enabled"
echo -e "${GREEN}✓ Service stopped${NC}"
echo ""

# Step 2: Stop Nginx
echo -e "${YELLOW}[2/7] Stopping Nginx...${NC}"
sudo systemctl stop nginx || echo "Nginx not running"
echo -e "${GREEN}✓ Nginx stopped${NC}"
echo ""

# Step 3: Remove systemd service file
echo -e "${YELLOW}[3/7] Removing systemd service...${NC}"
if [ -f /etc/systemd/system/patabima.service ]; then
    sudo rm /etc/systemd/system/patabima.service
    sudo systemctl daemon-reload
    echo -e "${GREEN}✓ Service file removed${NC}"
else
    echo "Service file not found (already removed)"
fi
echo ""

# Step 4: Remove Nginx configuration
echo -e "${YELLOW}[4/7] Removing Nginx configuration...${NC}"
if [ -f /etc/nginx/conf.d/patabima.conf ]; then
    sudo rm /etc/nginx/conf.d/patabima.conf
    echo -e "${GREEN}✓ Nginx config removed${NC}"
else
    echo "Nginx config not found (already removed)"
fi
echo ""

# Step 5: Remove application directory
echo -e "${YELLOW}[5/7] Removing application files...${NC}"
if [ -d /var/www/patabima ]; then
    echo "Backing up to /tmp/patabima-backup-$(date +%Y%m%d-%H%M%S)..."
    sudo cp -r /var/www/patabima "/tmp/patabima-backup-$(date +%Y%m%d-%H%M%S)" || echo "Backup failed"
    
    echo "Removing /var/www/patabima..."
    sudo rm -rf /var/www/patabima
    echo -e "${GREEN}✓ Application directory removed${NC}"
else
    echo "Application directory not found (already removed)"
fi
echo ""

# Step 6: Remove logs
echo -e "${YELLOW}[6/7] Cleaning up logs...${NC}"
sudo rm -f /var/log/gunicorn-error.log
sudo rm -f /var/log/gunicorn-access.log
sudo rm -f /var/log/django.log
sudo rm -f /var/log/nginx/patabima-*.log
echo -e "${GREEN}✓ Logs cleaned${NC}"
echo ""

# Step 7: Show current status
echo -e "${YELLOW}[7/7] Checking services status...${NC}"
echo ""
echo "Gunicorn service:"
sudo systemctl status patabima --no-pager || echo "Not found (expected)"
echo ""
echo "Nginx service:"
sudo systemctl status nginx --no-pager || echo "Stopped"
echo ""

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✓ Rollback Complete!${NC}"
echo "=========================================="
echo ""
echo "What was removed:"
echo "  ✓ Gunicorn service (patabima)"
echo "  ✓ Nginx configuration"
echo "  ✓ Application files (/var/www/patabima)"
echo "  ✓ Application logs"
echo ""
echo "What remains (unchanged):"
echo "  ✓ EC2 instance (still running)"
echo "  ✓ Python 3.11 installation"
echo "  ✓ PostgreSQL client"
echo "  ✓ Nginx (installed but not configured)"
echo "  ✓ System packages"
echo ""
echo "Your EC2 instance is now in a clean state."
echo "You can redeploy anytime with the deployment scripts."
echo ""
