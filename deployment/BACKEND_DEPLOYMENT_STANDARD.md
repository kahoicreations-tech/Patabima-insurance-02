# PataBima Backend Deployment Standard

Last Updated: 2025-11-23
Primary Instance (Prod): i-0d0f116005d812275 (44.200.182.180)
Legacy/Deprecated Instance IDs: i-07a424fd876416ad0 (DO NOT USE)
Region: us-east-1

---
## 1. Purpose
Provide a single, authoritative, low-friction, and repeatable method to build, deploy, verify, and rollback the Django backend to the production EC2 instance. Consolidates prior guides (Complete Deployment, Redeployment, EC2 Cheatsheet, Rollback Options, Latest Deployment Info) and removes ambiguity.

---
## 2. Decision Matrix (Choose Path Quickly)
| Scenario | Use This Path | Why |
|----------|---------------|-----|
| Small code change (views, serializers) | Quick SSM Redeploy | Fast, minimal manual steps |
| Model change (new migration) | SSM Redeploy + Migration Verify | Ensures DB schema updated |
| Large dependency updates | Full Package Redeploy (ZIP + S3 + SSM) | Clean environment alignment |
| Broken deployment (services failing) | Clean Rollback then Full Redeploy | Reset corrupted state |
| Need forensic debugging pre-change | Browser / SSH Connect Only | Preserve state |
| Full environment rebuild | Terminate + Fresh Provision | Nuclear reset |

---
## 3. Golden Flow Overview (Recommended Standard)
1. Build artifact locally (ZIP only `insurance-app/` subtree; exclude venv, __pycache__, staticfiles).
2. Upload ZIP to S3 deployment prefix.
3. Trigger SSM one-liner to pull latest ZIP, stop services, extract, install deps, migrate, collectstatic, restart.
4. Run verification checklist.
5. If failure: apply targeted fix or rollback.

---
## 4. Artifact Build (Local - PowerShell)
```powershell
# From repo root
cd C:\Users\USER\Desktop\PATABIMA01
$ts = Get-Date -Format 'yyyyMMdd-HHmmss'
$zip = "patabima-backend-$ts.zip"
# Ensure previous temp content cleared
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path insurance-app\* -DestinationPath $zip -Force
Write-Host "Created artifact: $zip" -ForegroundColor Green
```
Validation:
- Size typically 70MB–300MB depending on assets.
- Open ZIP and confirm root contains manage.py, app/, insurance/, requirements.txt (not nested inside extra folder).

---
## 5. Upload Artifact to S3
```powershell
$bucket = 'patabima-media-prod'
$prefix = 'deployment'
aws s3 cp $zip "s3://$bucket/$prefix/$zip" --region us-east-1
```
Optional prune old packages (>30 days):
```powershell
aws s3 ls s3://$bucket/$prefix/ | Select-String patabima-backend | ForEach-Object { $_.ToString() }
```

---
## 6. SSM Deployment Script (Canonical)
Execute from local PowerShell (requires AWS CLI configured; IAM perms for SSM + S3):
```powershell
$InstanceId = 'i-0d0f116005d812275'
$Bucket = 'patabima-media-prod'
$Prefix = 'deployment'
$Latest = (aws s3 ls s3://$Bucket/$Prefix/ --region us-east-1 | Select-String 'patabima-backend-' | ForEach-Object { $_.ToString().Split(' ',4)[3] } | Sort-Object | Select-Object -Last 1)
Write-Host "Deploying package: $Latest" -ForegroundColor Cyan
$Command = @"
#!/bin/bash
set -euo pipefail
PKG="$Latest"
DEPLOY_DIR="/var/www/patabima"
LOG_DIR="$DEPLOY_DIR/logs"
cd /tmp
aws s3 cp s3://$Bucket/$Prefix/$PKG . --region us-east-1
systemctl stop patabima || true
systemctl stop nginx || true
# Backup (keep only last 5)
if [ -d "$DEPLOY_DIR/insurance-app" ]; then
  TS=$(date +%Y%m%d-%H%M%S)
  mv "$DEPLOY_DIR/insurance-app" "$DEPLOY_DIR/insurance-app.backup.$TS"
  ls -dt $DEPLOY_DIR/insurance-app.backup.* 2>/dev/null | tail -n +6 | xargs -r rm -rf
fi
mkdir -p "$DEPLOY_DIR"
rm -rf "$DEPLOY_DIR/insurance-app"
unzip -q /tmp/$PKG -d "$DEPLOY_DIR/"
chown -R ec2-user:ec2-user "$DEPLOY_DIR"
python3 -m venv "$DEPLOY_DIR/venv" || true
source "$DEPLOY_DIR/venv/bin/activate"
pip install --upgrade pip
pip install -r "$DEPLOY_DIR/requirements.txt"
cd "$DEPLOY_DIR"
python manage.py migrate --noinput
python manage.py collectstatic --noinput --clear
systemctl start patabima
systemctl start nginx
sleep 4
curl -s http://localhost/api/v1/health/ || true
"@
# Send command
aws ssm send-command `
  --instance-ids $InstanceId `
  --document-name "AWS-RunShellScript" `
  --region us-east-1 `
  --comment "PataBima backend deploy $Latest" `
  --parameters commands="$Command" | Out-Null
Write-Host "Command dispatched. Check SSM Run Command console for output." -ForegroundColor Green
```
Notes:
- Recreates venv each deploy (clean dependency state). For faster deploy skip venv recreation and just `source venv/bin/activate`.
- Keeps last 5 backups for quick rollback.
- Health check executed at end.

---
## 7. Migration Verification (Post-Deploy)
```powershell
aws ssm send-command --instance-ids i-0d0f116005d812275 --document-name AWS-RunShellScript --region us-east-1 --parameters commands='python /var/www/patabima/manage.py showmigrations app | grep 0056'
```
Field length inspection (example banner_image):
```powershell
aws ssm send-command --instance-ids i-0d0f116005d812275 --document-name AWS-RunShellScript --region us-east-1 --parameters commands='python /var/www/patabima/manage.py shell -c "from app.models import Campaign;f=Campaign._meta.get_field(\"banner_image\");print(f.max_length)"'
```
Expected: 255

---
## 8. Verification Checklist
| Item | Command | Expectation |
|------|---------|-------------|
| Service status | `systemctl status patabima` | Active (running) |
| Health endpoint | `curl http://44.200.182.180/api/v1/health/` | JSON status ok |
| Motor categories | `curl http://44.200.182.180/api/v1/motor2/categories/` | 6 categories |
| Static collected | `ls -1 /var/www/patabima/static/` | Admin assets present |
| Migrations applied | showmigrations grep latest | [X] migration number |
| Logs clean | tail error.log / journalctl -u patabima | No tracebacks |

---
## 9. Rollback Strategies (Summary)
1. Quick Restore (from backup folder):
```bash
sudo systemctl stop patabima
cd /var/www/patabima
LATEST=$(ls -dt insurance-app.backup.* | head -1)
rm -rf insurance-app
mv $LATEST insurance-app
sudo systemctl start patabima
```
2. Clean Rollback Script (PowerShell): `deployment\rollback-ec2.ps1`
3. Manual SSH (selective removal) – see ROLLBACK_OPTIONS.md.
4. Terminate Instance (nuclear) – retain RDS + S3.

---
## 10. Common Pitfalls & Fixes
| Issue | Cause | Fix |
|-------|-------|-----|
| SSM command returns Parameter parsing error | Improper quotes/escaping | Use here-string & single dispatch above |
| Health check fails after deploy | Missing env vars / DEBUG mismatch | Inspect `/var/www/patabima/.env` & service file |
| Static files missing | collectstatic not run or cleared incorrectly | Re-run collectstatic --noinput --clear |
| Migrations skipped | Zip missing migration files | Rebuild artifact including `insurance-app/app/migrations` |
| Long filename upload error | ImageField max_length too small | Confirm migration increased length (255) |
| Dependency mismatch | Old venv retained | Force recreate venv (as in script) |

---
## 11. Security & Observability Enhancements (Optional)
- Enable HTTPS (LetsEncrypt cert on Nginx) – ensure port 443 open.
- Add CloudWatch log shipping (journald + Nginx).
- Parameter Store / Secrets Manager for DATABASE + SECRET_KEY (remove from .env).
- Add AWS CodeBuild + CodePipeline for CI/CD (artifact build + SSM deploy).
- Enable AWS Config + GuardDuty for compliance monitoring.

---
## 12. CI/CD Pipeline (Future Standard)
Minimal GitHub Actions outline (pseudo):
```yaml
name: Deploy Backend
on:
  push:
    branches: [ main ]
jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Zip artifact
        run: |
          zip -r patabima-backend-${{ github.sha }}.zip insurance-app -x "*/__pycache__/*" "*/venv/*"
      - name: Upload S3
        run: aws s3 cp patabima-backend-${{ github.sha }}.zip s3://patabima-media-prod/deployment/ --region us-east-1
      - name: Trigger SSM Deploy
        run: |
          LATEST=$(aws s3 ls s3://patabima-media-prod/deployment/ | grep patabima-backend | awk '{print $4}' | sort | tail -n 1)
          aws ssm send-command --instance-ids i-0d0f116005d812275 --document-name AWS-RunShellScript --comment "CI Deploy ${{ github.sha }}" --parameters commands="python --version; ls -1 /var/www/patabima | head"
```
Add environment file management & secret injection later.

---
## 13. Deprecations / Historical Notes
- Old instance ID i-07a424fd876416ad0 retained only in legacy docs; do not deploy there.
- Previous guide recommending direct SCP+SSH replaced by SSM workflow.
- Elastic Beanstalk configs (.ebextensions) remain only for historical compatibility – safe to ignore.

---
## 14. Reference Locations
| File | Purpose |
|------|---------|
| `deployment/BACKEND_DEPLOYMENT_STANDARD.md` | Canonical deployment procedure |
| `deployment/ROLLBACK_OPTIONS.md` | Detailed rollback strategies |
| `deployment/REDEPLOYMENT_GUIDE.md` | Legacy quick redeploy steps |
| `deployment/COMPLETE_DEPLOYMENT_GUIDE.md` | Extended environment + troubleshooting |
| `deployment/EC2_COMMANDS_CHEATSHEET.md` | Fast command lookups |

---
## 15. Next Improvements
- Automate health + migration verification post-SSM with Lambda trigger.
- Add signed artifact integrity check (SHA256) before extraction.
- Introduce blue/green deployment pattern (alternate directory + symlink switch).
- Integrate monitoring alert on failed health after deploy.

---
End of Standard.
