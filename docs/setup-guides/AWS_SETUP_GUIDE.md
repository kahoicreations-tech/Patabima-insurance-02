# AWS Setup Guide for PataBima App

This guide will help you set up AWS services for the PataBima insurance app.

## Prerequisites

1. AWS Account with billing enabled
2. AWS CLI installed and configured
3. Node.js and npm installed
4. Expo CLI installed

## Step 1: Create AWS Amplify Project

```bash
# Install Amplify CLI globally
npm install -g @aws-amplify/cli

# Configure Amplify CLI with your AWS credentials
amplify configure

# Initialize Amplify in your project (run from project root)
amplify init
```

When prompted during `amplify init`:
- Project name: `patabima-app`
- Environment name: `dev`
- Default editor: `Visual Studio Code`
- App type: `javascript`
- Framework: `react-native`
- Source directory: `src`
- Distribution directory: `dist`
- Build command: `npm run build`
- Start command: `npm start`

## Step 2: Add Authentication (Amazon Cognito)

```bash
# Add authentication service
amplify add auth

# Follow the prompts:
# - Do you want to use the default authentication and security configuration? Manual configuration
# - Select the authentication/authorization services that you want to use: User Sign-Up, Sign-In, connected with AWS IAM controls
# - Please provide a friendly name for your resource: patabimaauth
# - Please enter a name for your identity pool: patabima_identitypool
# - Allow unauthenticated logins? No
# - Do you want to enable 3rd party authentication providers? No
# - Do you want to configure Lambda Triggers for Cognito? No
# - What attributes are required for signing up? Email, Phone Number
# - Specify the app's refresh token expiration period: 30
# - Do you want to specify the user attributes that can be read by your app? Yes
# - What attributes do you want your app to read? Email, Phone Number, Given Name, Family Name
# - Do you want to enable any of the following capabilities? None
```

## Step 3: Add API (AWS AppSync + DynamoDB)

```bash
# Add GraphQL API
amplify add api

# Follow the prompts:
# - Please select from one of the below mentioned services: GraphQL
# - Here is the GraphQL API that we will create. Select a setting to edit or continue: Continue
# - Choose a schema template: Single object with fields
# - Do you want to edit the schema now? Yes
```

Replace the generated schema with this PataBima-specific schema:

```graphql
type Agent @model @auth(rules: [{allow: owner}]) {
  id: ID!
  agentCode: String! @index(name: "byAgentCode")
  email: String! @index(name: "byEmail")
  firstName: String!
  lastName: String!
  phoneNumber: String!
  profilePicture: String
  totalSales: Float
  totalCommission: Float
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  quotes: [Quote] @hasMany
  clients: [Client] @hasMany
  policies: [Policy] @hasMany
}

type Client @model @auth(rules: [{allow: owner}]) {
  id: ID!
  firstName: String!
  lastName: String!
  email: String
  phoneNumber: String!
  idNumber: String
  dateOfBirth: AWSDate
  address: String
  agentId: ID! @index(name: "byAgent")
  agent: Agent @belongsTo(fields: ["agentId"])
  quotes: [Quote] @hasMany
  policies: [Policy] @hasMany
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type Quote @model @auth(rules: [{allow: owner}]) {
  id: ID!
  quoteNumber: String! @index(name: "byQuoteNumber")
  insuranceType: InsuranceType!
  status: QuoteStatus!
  premium: Float!
  coverAmount: Float!
  validUntil: AWSDate!
  clientId: ID! @index(name: "byClient")
  client: Client @belongsTo(fields: ["clientId"])
  agentId: ID! @index(name: "byAgent")
  agent: Agent @belongsTo(fields: ["agentId"])
  motorDetails: MotorDetails
  medicalDetails: MedicalDetails
  wibaDetails: WIBADetails
  travelDetails: TravelDetails
  documents: [String]
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type Policy @model @auth(rules: [{allow: owner}]) {
  id: ID!
  policyNumber: String! @index(name: "byPolicyNumber")
  insuranceType: InsuranceType!
  status: PolicyStatus!
  premium: Float!
  coverAmount: Float!
  startDate: AWSDate!
  endDate: AWSDate!
  clientId: ID! @index(name: "byClient")
  client: Client @belongsTo(fields: ["clientId"])
  agentId: ID! @index(name: "byAgent")
  agent: Agent @belongsTo(fields: ["agentId"])
  quoteId: ID
  documents: [String]
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

type MotorDetails {
  vehicleType: String!
  make: String!
  model: String!
  year: Int!
  registrationNumber: String!
  engineNumber: String
  chassisNumber: String
  value: Float!
  usage: String!
}

type MedicalDetails {
  age: Int!
  gender: String!
  occupation: String
  preExistingConditions: [String]
  beneficiaries: [String]
}

type WIBADetails {
  occupation: String!
  salary: Float!
  riskCategory: String!
}

type TravelDetails {
  destination: String!
  departureDate: AWSDate!
  returnDate: AWSDate!
  purpose: String!
  age: Int!
}

type AdminPricing @model @auth(rules: [{allow: groups, groups: ["Admin"]}]) {
  id: ID!
  insuranceType: InsuranceType!
  basePremium: Float!
  factors: AWSJSON!
  rates: AWSJSON!
  version: Int!
  isActive: Boolean!
  createdBy: String!
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
}

enum InsuranceType {
  MOTOR
  MEDICAL
  WIBA
  TRAVEL
  PERSONAL_ACCIDENT
}

enum QuoteStatus {
  DRAFT
  SENT
  ACCEPTED
  REJECTED
  EXPIRED
}

enum PolicyStatus {
  ACTIVE
  EXPIRED
  CANCELLED
  PENDING_RENEWAL
}
```

## Step 4: Add Storage (Amazon S3)

```bash
# Add storage for file uploads
amplify add storage

# Follow the prompts:
# - Please select from one of the below mentioned services: Content (Images, audio, video, etc.)
# - Please provide a friendly name for your resource: patabimastorage
# - Please provide bucket name: patabima-storage-bucket
# - Who should have access: Auth users only
# - What kind of access do you want for Authenticated users? read, write, delete
```

## Step 5: Add Analytics (Amazon Pinpoint)

```bash
# Add analytics
amplify add analytics

# Follow the prompts:
# - Select an Analytics provider: Amazon Pinpoint
# - Provide your pinpoint resource name: patabimaanalytics
# - Apps need authorization to send analytics events. Do you want to allow guests and unauthenticated users to send analytics events? No
```

## Step 6: Deploy to AWS

```bash
# Deploy all services to AWS
amplify push

# This will:
# - Create CloudFormation stacks
# - Deploy Cognito User Pool and Identity Pool
# - Create AppSync GraphQL API
# - Set up DynamoDB tables
# - Create S3 bucket
# - Set up Pinpoint analytics
```

## Step 7: Configure Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_USER_POOL_ID=your_user_pool_id
AWS_USER_POOL_WEB_CLIENT_ID=your_app_client_id
AWS_IDENTITY_POOL_ID=your_identity_pool_id
AWS_APPSYNC_GRAPHQL_ENDPOINT=your_graphql_endpoint
AWS_APPSYNC_REGION=us-east-1
AWS_APPSYNC_AUTHENTICATION_TYPE=AMAZON_COGNITO_USER_POOLS
AWS_S3_BUCKET=your_s3_bucket_name
AWS_S3_REGION=us-east-1
AWS_PINPOINT_APP_ID=your_pinpoint_app_id
AWS_PINPOINT_REGION=us-east-1

# Feature Flags
ENABLE_OFFLINE_MODE=true
ENABLE_ANALYTICS=true
ENABLE_PUSH_NOTIFICATIONS=true
DEBUG_MODE=false
```

## Step 8: Update AWS Config File

After deployment, update `src/config/awsConfig.js` with your actual AWS configuration values:

```javascript
import { Amplify } from 'aws-amplify';

const awsConfig = {
  Auth: {
    region: process.env.AWS_REGION || 'us-east-1',
    userPoolId: process.env.AWS_USER_POOL_ID,
    userPoolWebClientId: process.env.AWS_USER_POOL_WEB_CLIENT_ID,
    identityPoolId: process.env.AWS_IDENTITY_POOL_ID,
  },
  API: {
    GraphQL: {
      endpoint: process.env.AWS_APPSYNC_GRAPHQL_ENDPOINT,
      region: process.env.AWS_APPSYNC_REGION || 'us-east-1',
      defaultAuthMode: 'userPool',
    },
  },
  Storage: {
    S3: {
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_S3_REGION || 'us-east-1',
    },
  },
  Analytics: {
    Pinpoint: {
      appId: process.env.AWS_PINPOINT_APP_ID,
      region: process.env.AWS_PINPOINT_REGION || 'us-east-1',
    },
  },
};

export default awsConfig;
```

## Step 9: Test AWS Integration

Run your app and test:

1. **Authentication**: Sign up and sign in
2. **Data Operations**: Create quotes, clients, policies
3. **File Upload**: Upload documents to S3
4. **Analytics**: Check events in Pinpoint console

## Step 10: Environment Management

For production deployment:

```bash
# Add production environment
amplify env add

# Switch between environments
amplify env checkout prod
amplify env checkout dev

# Deploy to specific environment
amplify push
```

## Monitoring and Maintenance

1. **CloudWatch**: Monitor API performance and errors
2. **Cognito Console**: Manage users and authentication
3. **AppSync Console**: Monitor GraphQL queries
4. **S3 Console**: Manage storage and costs
5. **Pinpoint Console**: View analytics and user engagement

## Security Best Practices

1. Enable MFA for admin accounts
2. Use least privilege IAM policies
3. Regularly rotate access keys
4. Monitor CloudTrail logs
5. Enable AWS Config for compliance
6. Set up billing alerts

## Cost Optimization

1. Use DynamoDB on-demand pricing for development
2. Implement S3 lifecycle policies
3. Set up CloudWatch billing alarms
4. Use Cognito free tier limits
5. Monitor Pinpoint analytics costs

## Troubleshooting

Common issues and solutions:

1. **Build errors**: Check Amplify CLI version and Node.js compatibility
2. **Auth issues**: Verify Cognito configuration
3. **API errors**: Check GraphQL schema and resolvers
4. **Storage issues**: Verify S3 permissions and CORS settings
5. **Analytics not working**: Check Pinpoint app configuration

For more detailed information, refer to the [AWS Amplify documentation](https://docs.amplify.aws/).
