# Insurance-App Directory Organization

## Directory Structure

```
insurance-app/
├── app/                          # Main Django application
│   ├── migrations/               # Database migrations (47 applied)
│   ├── models.py                 # Database models
│   ├── serializers.py            # API serializers
│   ├── views/                    # API views
│   ├── services/                 # Business logic services
│   └── admin.py                  # Django admin configuration
│
├── insurance/                    # Django project settings
│   ├── settings.py               # Main settings
│   ├── urls.py                   # URL routing
│   └── wsgi.py / asgi.py        # WSGI/ASGI configuration
│
├── docs/                         # Documentation
│   ├── setup/                    # Setup and deployment guides
│   │   └── runningthebackend.md
│   ├── development/              # Development documentation
│   │   └── API_SIMPLIFICATION_COMPLETE.md
│   ├── api/                      # API documentation
│   └── user flow in quotes and pricings.md
│
├── scripts/                      # Utility scripts (organized)
│   ├── database/                 # Database utilities and verification
│   │   ├── check_db.py
│   │   ├── check_users.py
│   │   ├── verify_migration.py
│   │   └── verify_system_integration.py
│   ├── testing/                  # Test scripts
│   │   ├── test_api.py
│   │   ├── test_motor2_api.py
│   │   └── test_*.py (various test files)
│   ├── debugging/                # Debug utilities
│   │   ├── debug_pricing.py
│   │   ├── debug_endpoints.py
│   │   └── debug_*.py (various debug files)
│   └── temp-scripts/             # Temporary/utility scripts
│       ├── populate_*.py
│       ├── create_*.py
│       └── generate_*.py
│
├── backups/                      # Database backups
│   ├── backup_phone_migration.sql
│   ├── patabima_backup.dump
│   └── *.sql (various backup files)
│
├── static/                       # Static files
├── staticfiles/                  # Collected static files (production)
├── templates/                    # HTML templates
├── mappings/                     # Data mapping files
├── dmvic_credentials/            # DMVIC API credentials
│
├── manage.py                     # Django management script
├── requirements.txt              # Python dependencies
├── README.md                     # Project documentation
├── .env                          # Environment variables (not in git)
├── .env.example                  # Environment variables template
├── Dockerfile                    # Docker configuration (dev)
├── Dockerfile.prod               # Docker configuration (production)
└── db.sqlite3                    # SQLite database (dev only)
```

## Recent Changes (November 3, 2025)

### 1. Phone Number Migration

- **Migration**: `0051_change_phone_to_10_digits_kenyan`
- **Status**: ✅ Completed successfully
- **Changes**:
  - Migrated 24 users from 9-digit to 10-digit phone format
  - Database now stores: `0712345678` (Kenyan format with leading 0)
  - Backend accepts both: `0712345678` AND `712345678` (normalized to 10 digits)
  - Frontend updated to send 10-digit format
  - SMS formatting updated to convert `0712345678` → `254712345678`

### 2. Directory Organization

- Moved **40+ temporary scripts** to organized subdirectories
- Created structured docs folders
- Cleaned up root directory from scattered files
- All backups moved to dedicated `backups/` directory

## Migrations Status

**Total Migrations**: 47 (all applied ✅)

**Latest Migration**: `0051_change_phone_to_10_digits_kenyan`

**Key Migrations**:

- `0001_initial` - Initial database schema
- `0007_insuranceprovider_motorcategory_and_more` - Motor insurance system
- `0027_additionalcoverage_mandatorylevy_underwriter` - Pricing enhancements
- `0031_claim_claimdocument` - Claims management
- `0042_agentcommission_agentperformance` - Commission system
- `0048_campaign_banner_image` - Campaign system
- `0050_remove_extension_models` - Cleanup
- `0051_change_phone_to_10_digits_kenyan` - Phone number migration

**Migration Health**: ✅ No pending migrations, no conflicts detected

## File Organization Summary

### Moved to scripts/database/

- All database check scripts (`check_*.py`)
- Verification scripts (`verify_*.py`)
- Database utilities

### Moved to scripts/testing/

- All test scripts (`test_*.py`)
- API testing utilities
- Integration tests

### Moved to scripts/debugging/

- All debug scripts (`debug_*.py`)
- Diagnostic utilities
- Inspection tools

### Moved to scripts/temp-scripts/

- Data population scripts (`populate_*.py`)
- Schema generation scripts (`generate_*.py`)
- Temporary utilities

### Moved to backups/

- All SQL backup files
- Database dumps
- Backup JSON files

### Moved to docs/

- API documentation → `docs/development/`
- Setup guides → `docs/setup/`
- User flow documentation

## Clean Root Directory

After organization, root directory contains only:

- ✅ `manage.py` - Django management script
- ✅ `README.md` - Project documentation
- ✅ `requirements.txt` - Dependencies
- ✅ `.env` / `.env.example` - Environment configuration
- ✅ `Dockerfile` / `Dockerfile.prod` - Docker configs
- ✅ `db.sqlite3` - Development database
- ✅ Core directories: `app/`, `insurance/`, `docs/`, `scripts/`, `static/`, `templates/`

## Best Practices Applied

1. **Clean Root Directory**: Only essential files in root
2. **Organized Scripts**: Categorized by purpose (database, testing, debugging)
3. **Separate Backups**: Dedicated backup directory
4. **Structured Docs**: Organized documentation by topic
5. **Migration Health**: All migrations applied, no conflicts
6. **Environment Separation**: Clear dev/prod configurations

## Next Steps

1. **Archive Old Scripts**: Consider moving `scripts/temp-scripts/` to `_archive/` if no longer needed
2. **Update README.md**: Document the new directory structure
3. **Git Commit**: Commit the reorganization changes
4. **Review Backups**: Delete old/redundant backup files
5. **Documentation**: Update API docs in `docs/api/`

## Maintenance

### Regular Tasks

- Review and clean `scripts/temp-scripts/` monthly
- Archive old backups quarterly
- Update documentation when APIs change
- Run `python manage.py check` before deployments

### Migration Management

- Always backup before running migrations
- Test migrations in development first
- Use `--plan` flag to preview migration steps
- Keep migration files in version control

---

**Last Updated**: November 3, 2025  
**Organization Completed**: ✅ All files organized and migrations verified
