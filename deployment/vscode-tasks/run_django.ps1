param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('check', 'check-deploy', 'migrate', 'test-commissions')]
    [string]$Action
)

$ErrorActionPreference = 'Stop'

$env:PYTHONUNBUFFERED = '1'
$env:DJANGO_SETTINGS_MODULE = 'insurance.settings'

python -m pip show django > $null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Python env not ready. Please run the backend venv and install dependencies."
    exit 1
}

switch ($Action) {
    'check' {
        python insurance-app/manage.py check
    }
    'check-deploy' {
        python insurance-app/manage.py check --deploy
    }
    'migrate' {
        python insurance-app/manage.py migrate --noinput
    }
    'test-commissions' {
        python insurance-app/manage.py test app.tests.test_commissions_api -v 2
    }
}
