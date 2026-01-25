# AI Coding Agent Guidelines for PataBima Codebase

## Overview

PataBima is a React Native Expo application with a Django backend, designed for insurance agents in Kenya. The system supports:

- 60+ motor insurance products
- Real-time premium calculations
- Multi-underwriter comparisons
- Payment integrations (M-PESA, DPO Pay)
- Offline capabilities with data synchronization

The project is structured into distinct frontend and backend components, with AWS services for deployment.

---

## Key Components

### Frontend

- **Framework**: React Native with Expo SDK 53
- **Location**: `frontend/`
- **Design System**: Shared tokens and components in `frontend/theme` and `frontend/components/common`
- **Switching Environments**: Use `switch-backend.ps1` to toggle between local and EC2 backends.

### Backend

- **Framework**: Django REST Framework
- **Location**: `insurance-app/`
- **Database**: PostgreSQL (production) or SQLite (local)
- **Scripts**: `deployment/` contains PowerShell and Bash scripts for EC2 management.

---

## Developer Workflows

### Setting Up the Environment

1. **Frontend**:
   ```powershell
   cd frontend
   npm install
   npm start
   ```
2. **Backend**:
   ```powershell
   cd insurance-app
   python manage.py runserver
   ```

### Switching Backend Environments

- **To EC2**:
  ```powershell
  cd frontend
  .\switch-backend.ps1 -Environment ec2
  npm start
  ```
- **To Local**:
  ```powershell
  cd frontend
  .\switch-backend.ps1 -Environment local
  cd insurance-app
  python manage.py runserver
  ```

### Running Tests

- **Backend Tests**:
  ```powershell
  pwsh deployment/vscode-tasks/run_django.ps1 -Action test-commissions
  ```

---

## Project-Specific Conventions

- **Design Tokens**: Use `BRAND`, `SPACING`, and `FONT_SIZES` from `frontend/theme`.
- **Backend Switching**: Always use `switch-backend.ps1` to ensure correct environment setup.
- **AWS Integration**: Scripts in `scripts/` automate EC2 connections and deployments.

---

## External Dependencies

- **AWS**: EC2, RDS PostgreSQL, Amplify
- **Payment Gateways**: M-PESA, DPO Pay
- **Expo**: OTA updates and app bundling

---

## Examples

### Adding a New Design Token

1. Update `frontend/theme/tokens.js`.
2. Use the token in `frontend/components/common`.

### Debugging Backend Issues

1. Check logs in `insurance-app/logs/`.
2. Use `deployment/ec2-ssh.ps1` to connect to the EC2 instance.

---

For more details, refer to the [project documentation](docs/README.md).
