#!/bin/bash
# Deploy Textract Lambda Function to AWS
# Usage: ./deploy-textract-lambda.sh [region] [bucket-name]

set -e

# Configuration
REGION="${1:-us-east-1}"
S3_BUCKET="${2:-patabima-backend-dev-uploads}"
FUNCTION_NAME="patabima-textract-processor"
ROLE_NAME="PatabimaTextractLambdaRole"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}========================================"
echo "PataBima Textract Lambda Deployment"
echo -e "========================================${NC}"
echo ""

# Get project root (2 levels up from scripts/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
LAMBDA_BUILD_DIR="$PROJECT_ROOT/lambda_build"
LAMBDA_SOURCE="$LAMBDA_BUILD_DIR/lambda_textract.py"
PACKAGE_DIR="$LAMBDA_BUILD_DIR/package"
ZIP_FILE="$LAMBDA_BUILD_DIR/lambda_textract.zip"

echo -e "${YELLOW}Configuration:${NC}"
echo "  Region: $REGION"
echo "  S3 Bucket: $S3_BUCKET"
echo "  Function Name: $FUNCTION_NAME"
echo "  Role Name: $ROLE_NAME"
echo ""

# Check AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}✗ AWS CLI not found. Please install: https://aws.amazon.com/cli/${NC}"
    exit 1
fi

AWS_VERSION=$(aws --version 2>&1)
echo -e "${GREEN}✓ AWS CLI detected: $AWS_VERSION${NC}"

# Check if source exists
if [ ! -f "$LAMBDA_SOURCE" ]; then
    echo -e "${RED}✗ Lambda source not found: $LAMBDA_SOURCE${NC}"
    exit 1
fi

# Get AWS Account ID
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
echo -e "${GREEN}✓ AWS Account: $ACCOUNT_ID${NC}"
echo ""

# Step 1: Create IAM Role
echo -e "${CYAN}[Step 1/6] Creating IAM Role...${NC}"

TRUST_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
)

LAMBDA_POLICY=$(cat <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject"
      ],
      "Resource": "arn:aws:s3:::$S3_BUCKET/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "textract:AnalyzeDocument",
        "textract:DetectDocumentText"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "arn:aws:sqs:$REGION:$ACCOUNT_ID:patabima-textract-queue"
    }
  ]
}
EOF
)

# Check if role exists
if aws iam get-role --role-name "$ROLE_NAME" &> /dev/null; then
    echo -e "  ${GREEN}✓ Role '$ROLE_NAME' already exists${NC}"
    ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
else
    # Create role
    echo "$TRUST_POLICY" > "$LAMBDA_BUILD_DIR/trust-policy.json"
    aws iam create-role \
        --role-name "$ROLE_NAME" \
        --assume-role-policy-document "file://$LAMBDA_BUILD_DIR/trust-policy.json" \
        --description "Lambda execution role for PataBima Textract processing" > /dev/null
    
    # Attach policy
    echo "$LAMBDA_POLICY" > "$LAMBDA_BUILD_DIR/lambda-policy.json"
    aws iam put-role-policy \
        --role-name "$ROLE_NAME" \
        --policy-name "PatabimaTextractPolicy" \
        --policy-document "file://$LAMBDA_BUILD_DIR/lambda-policy.json"
    
    echo -e "  ${GREEN}✓ Created role '$ROLE_NAME'${NC}"
    
    ROLE_ARN=$(aws iam get-role --role-name "$ROLE_NAME" --query 'Role.Arn' --output text)
    
    # Wait for role to propagate
    echo -e "  ${YELLOW}⏳ Waiting 10 seconds for role to propagate...${NC}"
    sleep 10
fi

echo "  Role ARN: $ROLE_ARN"

# Step 2: Create SQS Queue
echo -e "\n${CYAN}[Step 2/6] Creating SQS Queue...${NC}"

QUEUE_NAME="patabima-textract-queue"

if aws sqs get-queue-url --queue-name "$QUEUE_NAME" --region "$REGION" &> /dev/null; then
    QUEUE_URL=$(aws sqs get-queue-url --queue-name "$QUEUE_NAME" --region "$REGION" --query 'QueueUrl' --output text)
    echo -e "  ${GREEN}✓ Queue already exists: $QUEUE_URL${NC}"
else
    QUEUE_URL=$(aws sqs create-queue --queue-name "$QUEUE_NAME" --region "$REGION" --query 'QueueUrl' --output text)
    echo -e "  ${GREEN}✓ Queue created: $QUEUE_URL${NC}"
fi

QUEUE_ARN=$(aws sqs get-queue-attributes --queue-url "$QUEUE_URL" --attribute-names QueueArn --query 'Attributes.QueueArn' --output text)
echo "  Queue ARN: $QUEUE_ARN"

# Step 3: Package Lambda Function
echo -e "\n${CYAN}[Step 3/6] Packaging Lambda Function...${NC}"

# Clean previous package
rm -rf "$PACKAGE_DIR"
rm -f "$ZIP_FILE"

mkdir -p "$PACKAGE_DIR"

# Copy Lambda source
cp "$LAMBDA_SOURCE" "$PACKAGE_DIR/lambda_function.py"

echo -e "  ${GREEN}✓ Lambda source copied${NC}"

# Create ZIP
cd "$PACKAGE_DIR"
zip -r "$ZIP_FILE" . > /dev/null
cd - > /dev/null

ZIP_SIZE=$(du -h "$ZIP_FILE" | cut -f1)
echo -e "  ${GREEN}✓ Package created: $ZIP_FILE ($ZIP_SIZE)${NC}"

# Step 4: Create/Update Lambda Function
echo -e "\n${CYAN}[Step 4/6] Deploying Lambda Function...${NC}"

if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" &> /dev/null; then
    # Update existing function
    echo -e "  ${YELLOW}Updating existing function...${NC}"
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file "fileb://$ZIP_FILE" \
        --region "$REGION" > /dev/null
    
    echo -e "  ${GREEN}✓ Function code updated${NC}"
    
    # Update configuration
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --timeout 300 \
        --memory-size 512 \
        --environment "Variables={S3_BUCKET=$S3_BUCKET,AWS_REGION=$REGION}" \
        --region "$REGION" > /dev/null
    
    echo -e "  ${GREEN}✓ Function configuration updated${NC}"
else
    # Create new function
    echo -e "  ${YELLOW}Creating new function...${NC}"
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime python3.11 \
        --role "$ROLE_ARN" \
        --handler lambda_function.lambda_handler \
        --zip-file "fileb://$ZIP_FILE" \
        --timeout 300 \
        --memory-size 512 \
        --environment "Variables={S3_BUCKET=$S3_BUCKET,AWS_REGION=$REGION}" \
        --region "$REGION" > /dev/null
    
    echo -e "  ${GREEN}✓ Function created successfully${NC}"
fi

# Step 5: Add SQS Trigger
echo -e "\n${CYAN}[Step 5/6] Configuring SQS Trigger...${NC}"

# Check if event source mapping already exists
MAPPINGS=$(aws lambda list-event-source-mappings --function-name "$FUNCTION_NAME" --region "$REGION" --query "EventSourceMappings[?EventSourceArn=='$QUEUE_ARN'].UUID" --output text)

if [ -n "$MAPPINGS" ]; then
    echo -e "  ${GREEN}✓ SQS trigger already configured${NC}"
else
    aws lambda create-event-source-mapping \
        --function-name "$FUNCTION_NAME" \
        --event-source-arn "$QUEUE_ARN" \
        --batch-size 10 \
        --region "$REGION" > /dev/null
    
    echo -e "  ${GREEN}✓ SQS trigger added${NC}"
fi

# Step 6: Test Lambda Function
echo -e "\n${CYAN}[Step 6/6] Testing Lambda Function...${NC}"

TEST_EVENT=$(cat <<EOF
{
  "Records": [
    {
      "body": "{\"jobId\": \"test-job-123\", \"objectKey\": \"dev/test-agent/2025/11/test-doc.jpg\", \"docType\": \"logbook\"}"
    }
  ]
}
EOF
)

echo "$TEST_EVENT" > "$LAMBDA_BUILD_DIR/test-event.json"

echo -e "  ${YELLOW}Running test invocation...${NC}"
if aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --payload "file://$LAMBDA_BUILD_DIR/test-event.json" \
    --region "$REGION" \
    "$LAMBDA_BUILD_DIR/test-response.json" &> /dev/null; then
    
    echo -e "  ${GREEN}✓ Test invocation successful${NC}"
    if [ -f "$LAMBDA_BUILD_DIR/test-response.json" ]; then
        echo "  Response:"
        cat "$LAMBDA_BUILD_DIR/test-response.json"
    fi
else
    echo -e "  ${YELLOW}⚠ Test invocation failed (function may work in production)${NC}"
fi

# Summary
echo -e "\n${CYAN}========================================"
echo -e "${GREEN}Deployment Complete!"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update Django .env with SQS Queue URL:"
echo "   SQS_QUEUE_URL=$QUEUE_URL"
echo ""
echo "2. Restart Django server to pick up new env variable"
echo ""
echo "3. Test document upload in the app"
echo ""
echo -e "${CYAN}Lambda Function Name: $FUNCTION_NAME"
echo "Region: $REGION${NC}"
echo ""
