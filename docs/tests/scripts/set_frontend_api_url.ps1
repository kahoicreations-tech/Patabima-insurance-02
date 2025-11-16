param(
  [Parameter(Mandatory = $true)]
  [string]$ApiUrl
)

$ErrorActionPreference = 'Stop'
$frontendEnv = Join-Path $PSScriptRoot '..' 'frontend' '.env'
Set-Content -Path $frontendEnv -Value "EXPO_PUBLIC_API_BASE_URL=$ApiUrl"
Write-Host "Updated frontend .env -> $ApiUrl"
