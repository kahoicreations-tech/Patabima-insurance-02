param(
  [Parameter(Mandatory=$true)][string]$KeyPath,
  [Parameter(Mandatory=$true)][string]$Host,
  [string]$User = "ubuntu",
  [string]$RemoteDir = "/home/ubuntu"
)

# Windows PowerShell helper to upload and run deploy scripts on EC2
Write-Host "=== Uploading deploy scripts to $User@$Host ==="

$scp = "scp -i `"$KeyPath`" deployment/deploy_backend.sh $User@$Host:$RemoteDir/"
Write-Host $scp
iex $scp

$ssh = "ssh -i `"$KeyPath`" $User@$Host 'sudo chmod +x $RemoteDir/deploy_backend.sh && sudo bash $RemoteDir/deploy_backend.sh'"
Write-Host $ssh
iex $ssh

Write-Host "=== Done ==="
