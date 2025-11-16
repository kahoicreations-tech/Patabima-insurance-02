#!/usr/bin/env bash
set -euo pipefail

# PataBima backend deploy script (run on EC2)
# - Pulls latest from GitHub
# - Ensures Python venv and dependencies
# - Applies migrations and collects static
# - Restarts Gunicorn

# Config
APP_DIR="/home/ubuntu/patabima"
REPO_URL="https://github.com/kahoicreations-tech/Patabima-insurance-02.git"
BRANCH="main"
VENV_DIR="$APP_DIR/venv"
DJANGO_DIR="$APP_DIR/insurance-app"
SERVICE_NAME="gunicorn"

echo "=== PataBima backend deploy ==="
echo "APP_DIR=$APP_DIR"
echo "REPO_URL=$REPO_URL"

sudo apt-get update -y
sudo apt-get install -y git python3-venv python3-pip

# Ensure app directory exists
mkdir -p "$APP_DIR"
cd "$APP_DIR"

if [ ! -d .git ]; then
  echo "Cloning repository..."
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
else
  echo "Fetching latest changes..."
  git fetch --all --prune
  git checkout "$BRANCH"
  git reset --hard "origin/$BRANCH"
fi

# Python virtual environment
if [ ! -d "$VENV_DIR" ]; then
  echo "Creating Python venv..."
  python3 -m venv "$VENV_DIR"
fi

source "$VENV_DIR/bin/activate"
python -m pip install --upgrade pip wheel setuptools

if [ -f "$DJANGO_DIR/requirements.txt" ]; then
  echo "Installing requirements..."
  pip install -r "$DJANGO_DIR/requirements.txt"
else
  echo "requirements.txt not found at $DJANGO_DIR/requirements.txt" >&2
fi

export DJANGO_SETTINGS_MODULE=insurance.settings

echo "Applying migrations..."
python "$DJANGO_DIR/manage.py" migrate --noinput

echo "Collecting static..."
python "$DJANGO_DIR/manage.py" collectstatic --noinput

deactivate

echo "Restarting $SERVICE_NAME..."
if systemctl is-enabled --quiet "$SERVICE_NAME"; then
  sudo systemctl restart "$SERVICE_NAME"
  sudo systemctl status --no-pager "$SERVICE_NAME" | sed -n '1,20p'
else
  echo "Warning: $SERVICE_NAME service not found/enabled. See deployment/systemd/gunicorn.service for a template."
fi

echo "=== Deploy complete ==="
