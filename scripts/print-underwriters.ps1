#!/usr/bin/env pwsh
[CmdletBinding()]
param(
    [string]$BaseUrl = "http://localhost:8000/api/insurance",
    [string]$Token,
    [switch]$Json
)

$ErrorActionPreference = 'Stop'

function Write-Err($msg) { Write-Host "[ERROR] $msg" -ForegroundColor Red }

try {
    if (-not $Token -and $env:PATABIMA_ACCESS_TOKEN) {
        $Token = $env:PATABIMA_ACCESS_TOKEN
    }

    # Normalize BaseUrl (no trailing slash)
    if ($BaseUrl.EndsWith('/')) { $BaseUrl = $BaseUrl.TrimEnd('/') }
    $uri = "$BaseUrl/insurance/underwriters"

    $headers = @{}
    if ($Token) { $headers['Authorization'] = "Bearer $Token" }

    $params = @{ Uri = $uri; Method = 'GET' }
    if ($headers.Count -gt 0) { $params['Headers'] = $headers }

    $resp = Invoke-RestMethod @params

    # Response may be an object with `underwriters` or a raw array
    $list = if ($resp -and $resp.PSObject.Properties.Name -contains 'underwriters') { $resp.underwriters } else { $resp }

    if ($Json) {
        $list | ConvertTo-Json -Depth 6
        return
    }

    if (-not $list) {
        Write-Host "Underwriters: 0"
        return
    }

    Write-Host ("Underwriters ({0}):" -f $list.Count)
    foreach ($u in $list) {
        $name = if ($u.name) { $u.name } else { $u.Name }
        $code = if ($u.code) { $u.code } else { $u.Code }
        if ($code) {
            Write-Host (" - {0} [{1}]" -f $name, $code)
        }
        else {
            Write-Host (" - {0}" -f $name)
        }
    }

}
catch {
    $status = $_.Exception.Response.StatusCode.value__ 2>$null
    if ($status -eq 401) {
        Write-Err "Unauthorized (401). Provide -Token or set PATABIMA_ACCESS_TOKEN."
        Write-Host "Example:"
        Write-Host "  $env:PATABIMA_ACCESS_TOKEN = 'eyJ...'; .\\scripts\\print-underwriters.ps1 -BaseUrl '$BaseUrl'"
    }
    else {
        Write-Err "Request failed: $($_.Exception.Message)"
    }
    exit 1
}
