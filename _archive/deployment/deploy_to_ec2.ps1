param(
  [Parameter(Mandatory = $true)][string]$KeyPath,
  [Parameter(Mandatory = $true)][string]$EC2Host,
  [string]$User = "ubuntu",
  [string]$RemoteDir = "/home/ubuntu"
)

# Windows PowerShell helper to upload and run deploy scripts on EC2
Write-Host "=== Uploading deploy scripts to $User@$EC2Host ==="

$RemoteUser = "${User}@${EC2Host}"
$RemotePath = "${User}@${EC2Host}:${RemoteDir}/"

Write-Host "Running: scp -i `"$KeyPath`" deployment/deploy_backend.sh $RemotePath"
scp -i "$KeyPath" deployment/deploy_backend.sh "$RemotePath"

Write-Host "Running: ssh -i `"$KeyPath`" $RemoteUser 'sudo chmod +x $RemoteDir/deploy_backend.sh && sudo bash $RemoteDir/deploy_backend.sh'"
ssh -i "$KeyPath" "$RemoteUser" "sudo chmod +x $RemoteDir/deploy_backend.sh && sudo bash $RemoteDir/deploy_backend.sh"

Write-Host "=== Done ==="
