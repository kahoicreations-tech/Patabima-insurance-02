# Backend Switching Scripts Moved

**All backend switching scripts and documentation have been moved to:**

```
deployment/backend-switching/
```

## Quick Access

```powershell
# From project root:
.\deployment\backend-switching\switch-backend.ps1 -Environment ec2
.\deployment\backend-switching\switch-backend.ps1 -Environment local

# Or create an alias in your PowerShell profile:
Set-Alias -Name switch-backend -Value "C:\Users\USER\Desktop\PATABIMA01\deployment\backend-switching\switch-backend.ps1"
```

## Directory Structure

```
deployment/backend-switching/
├── README.md                    # Complete switching guide
├── LEGACY_GUIDE.md              # Original documentation
├── switch-backend.ps1           # Universal switcher (RECOMMENDED)
├── switch-to-ec2.ps1            # Legacy EC2 switcher
├── switch-to-local.ps1          # Legacy local switcher
├── .env.ec2.template            # EC2 environment template
└── .env.local.template          # Local environment template
```

## See Also

- `docs/EC2_FRONTEND_INTEGRATION_GUIDE.md` - EC2 integration details
- `deployment/ec2_admin_setup_instructions.md` - EC2 admin setup
