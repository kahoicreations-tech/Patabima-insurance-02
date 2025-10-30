import Constants from 'expo-constants';

const ENV = {
  development: {
    AWS_REGION: 'us-east-1',
    AWS_USER_POOL_ID: 'us-east-1_XXXXXXXXX', // Replace with actual dev pool ID
    AWS_USER_POOL_CLIENT_ID: 'XXXXXXXXXXXXXXXXXXXXXXXXXX', // Replace with actual dev client ID
    AWS_IDENTITY_POOL_ID: 'us-east-1:XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX', // Replace with actual dev identity pool ID
    AWS_S3_BUCKET: 'patabima-dev-storage',
    AWS_API_GATEWAY_URL: 'https://XXXXXXXXXX.execute-api.us-east-1.amazonaws.com/dev',
  },
  staging: {
    AWS_REGION: 'us-east-1',
    AWS_USER_POOL_ID: 'us-east-1_YYYYYYYYY', // Replace with actual staging pool ID
    AWS_USER_POOL_CLIENT_ID: 'YYYYYYYYYYYYYYYYYYYYYYYYYY', // Replace with actual staging client ID
    AWS_IDENTITY_POOL_ID: 'us-east-1:YYYYYYYY-YYYY-YYYY-YYYY-YYYYYYYYYYYY', // Replace with actual staging identity pool ID
    AWS_S3_BUCKET: 'patabima-staging-storage',
    AWS_API_GATEWAY_URL: 'https://YYYYYYYYYY.execute-api.us-east-1.amazonaws.com/staging',
  },
  production: {
    AWS_REGION: 'us-east-1',
    AWS_USER_POOL_ID: 'us-east-1_ZZZZZZZZZ', // Replace with actual prod pool ID
    AWS_USER_POOL_CLIENT_ID: 'ZZZZZZZZZZZZZZZZZZZZZZZZZZ', // Replace with actual prod client ID
    AWS_IDENTITY_POOL_ID: 'us-east-1:ZZZZZZZZ-ZZZZ-ZZZZ-ZZZZ-ZZZZZZZZZZZZ', // Replace with actual prod identity pool ID
    AWS_S3_BUCKET: 'patabima-prod-storage',
    AWS_API_GATEWAY_URL: 'https://ZZZZZZZZZZ.execute-api.us-east-1.amazonaws.com/prod',
  },
};

const getAwsEnvVars = () => {
  const releaseChannel = Constants.expoConfig?.releaseChannel;
  
  if (releaseChannel === 'staging') return ENV.staging;
  if (releaseChannel === 'production') return ENV.production;
  return ENV.development;
};

export const {
  AWS_REGION,
  AWS_USER_POOL_ID,
  AWS_USER_POOL_CLIENT_ID,
  AWS_IDENTITY_POOL_ID,
  AWS_S3_BUCKET,
  AWS_API_GATEWAY_URL,
} = getAwsEnvVars();

// AWS Amplify Configuration
export const AWS_AMPLIFY_CONFIG = {
  Auth: {
    region: AWS_REGION,
    userPoolId: AWS_USER_POOL_ID,
    userPoolWebClientId: AWS_USER_POOL_CLIENT_ID,
    identityPoolId: AWS_IDENTITY_POOL_ID,
    authenticationFlowType: 'USER_PASSWORD_AUTH',
    oauth: {
      domain: 'patabima-auth.auth.us-east-1.amazoncognito.com', // Replace with your domain
      scope: ['email', 'openid', 'profile'],
      redirectSignIn: 'patabima://signin',
      redirectSignOut: 'patabima://signout',
      responseType: 'code',
    },
  },
  Storage: {
    AWSS3: {
      bucket: AWS_S3_BUCKET,
      region: AWS_REGION,
    },
  },
  API: {
    endpoints: [
      {
        name: 'PataBimaAPI',
        endpoint: AWS_API_GATEWAY_URL,
        region: AWS_REGION,
      },
    ],
  },
  Analytics: {
    disabled: false,
    autoSessionRecord: true,
    AWSPinpoint: {
      appId: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // Replace with actual Pinpoint app ID
      region: AWS_REGION,
    },
  },
};

// Lambda Function Names
export const LAMBDA_FUNCTIONS = {
  QUOTATION_PROCESSOR: 'patabima-quotation-processor',
  POLICY_MANAGER: 'patabima-policy-manager',
  CLAIMS_PROCESSOR: 'patabima-claims-processor',
  PRICING_CALCULATOR: 'patabima-pricing-calculator',
  NOTIFICATION_SENDER: 'patabima-notification-sender',
  DOCUMENT_PROCESSOR: 'patabima-document-processor',
  OCR_PROCESSOR: 'patabima-ocr-processor',
};

// DynamoDB Table Names
export const DYNAMODB_TABLES = {
  USERS: 'patabima-users',
  QUOTATIONS: 'patabima-quotations',
  POLICIES: 'patabima-policies',
  CLAIMS: 'patabima-claims',
  DOCUMENTS: 'patabima-documents',
  ACTIVITIES: 'patabima-activities',
  NOTIFICATIONS: 'patabima-notifications',
};

// S3 Bucket Folders
export const S3_FOLDERS = {
  PROFILE_IMAGES: 'profile-images/',
  CLAIM_DOCUMENTS: 'claim-documents/',
  POLICY_DOCUMENTS: 'policy-documents/',
  OCR_UPLOADS: 'ocr-uploads/',
  QUOTATION_ATTACHMENTS: 'quotation-attachments/',
  TEMP_UPLOADS: 'temp-uploads/',
};

// SES Configuration
export const SES_CONFIG = {
  region: AWS_REGION,
  fromEmail: 'noreply@patabima.com',
  supportEmail: 'support@patabima.com',
  templates: {
    WELCOME: 'patabima-welcome-template',
    QUOTATION_CREATED: 'patabima-quotation-created-template',
    POLICY_ISSUED: 'patabima-policy-issued-template',
    CLAIM_SUBMITTED: 'patabima-claim-submitted-template',
    RENEWAL_REMINDER: 'patabima-renewal-reminder-template',
  },
};

// SNS Topics
export const SNS_TOPICS = {
  QUOTATION_EVENTS: 'arn:aws:sns:us-east-1:XXXXXXXXXXXX:patabima-quotation-events',
  POLICY_EVENTS: 'arn:aws:sns:us-east-1:XXXXXXXXXXXX:patabima-policy-events',
  CLAIM_EVENTS: 'arn:aws:sns:us-east-1:XXXXXXXXXXXX:patabima-claim-events',
  USER_EVENTS: 'arn:aws:sns:us-east-1:XXXXXXXXXXXX:patabima-user-events',
};

// CloudWatch Configuration
export const CLOUDWATCH_CONFIG = {
  logGroupName: '/aws/lambda/patabima',
  metricNamespace: 'PataBima/Mobile',
  retentionDays: 14,
};

export default {
  AWS_AMPLIFY_CONFIG,
  LAMBDA_FUNCTIONS,
  DYNAMODB_TABLES,
  S3_FOLDERS,
  SES_CONFIG,
  SNS_TOPICS,
  CLOUDWATCH_CONFIG,
};
