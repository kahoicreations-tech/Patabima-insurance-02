#!/bin/bash
# Check which EC2 instances are actually running

echo "Checking all EC2 instances..."
echo ""

aws ec2 describe-instances \
  --query 'Reservations[*].Instances[*].[InstanceId,State.Name,PublicIpAddress,LaunchTime]' \
  --output table

echo ""
echo "Checking SSM-managed instances..."
aws ssm describe-instance-information \
  --query 'InstanceInformationList[*].[InstanceId,PingStatus,PlatformName]' \
  --output table
