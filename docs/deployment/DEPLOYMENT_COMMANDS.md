# PataBima AWS Deployment Commands & Checklist

## 🚀 **Quick Deployment Commands**

### **1. Final Status Check**
```bash
amplify status
```

### **2. Deploy Everything to AWS**
```bash
amplify push
```

### **3. Post-Deployment Verification**
```bash
amplify console  # Opens AWS console
amplify console api  # Opens GraphQL playground
amplify console auth  # Opens Cognito console
amplify console storage  # Opens S3 console
amplify console analytics  # Opens Pinpoint console
```

---

## 📋 **Pre-Deployment Checklist**

- [x] **Amplify CLI** configured with AWS credentials
- [x] **IAM User** created with appropriate permissions
- [x] **Authentication** service added (Cognito)
- [x] **API** service added (GraphQL + DynamoDB)
- [x] **Storage** services added (S3 + DynamoDB)
- [x] **Analytics** service added (Pinpoint)
- [x] **Custom Schema** updated with PataBima models
- [x] **Lambda Function** added for email verification

---

## ⚡ **Deployment Process**

When you run `amplify push`, the following will happen:

### **Phase 1: CloudFormation Stack Creation**
- Root stack creation for the project
- Nested stacks for each service category

### **Phase 2: Authentication Deployment**
- Cognito User Pool creation
- Cognito Identity Pool creation
- IAM roles and policies setup
- Lambda function deployment for custom messages

### **Phase 3: API Deployment**
- AppSync GraphQL API creation
- DynamoDB tables creation based on schema
- GraphQL resolvers generation
- API key generation (7-day expiration)

### **Phase 4: Storage Deployment**
- S3 bucket creation for file storage
- Additional DynamoDB table creation
- IAM policies for storage access

### **Phase 5: Analytics Deployment**
- Pinpoint application creation
- Analytics IAM policies setup

---

## 🔧 **Expected Resources Created**

### **Amazon Cognito**
- User Pool: `patabimavrs127e7c3478`
- Identity Pool: Auto-generated
- App Client: Auto-generated

### **AWS AppSync**
- GraphQL API: `patabimavrs12`
- Data Sources: DynamoDB tables for each model
- Resolvers: Auto-generated for CRUD operations

### **Amazon DynamoDB**
- `Agent-<env>-<id>` table
- `Client-<env>-<id>` table  
- `Quote-<env>-<id>` table
- `Policy-<env>-<id>` table
- `AdminPricing-<env>-<id>` table
- `Patabimasql713-<env>-<id>` table (custom)

### **Amazon S3**
- Bucket: `patabima-storage-bucket-<env>-<id>`
- CORS configuration for web access
- IAM policies for authenticated access

### **AWS Lambda**
- Function: `patabimavrs127e7c3478CustomMessage`
- Trigger: Cognito custom message events

### **Amazon Pinpoint**
- Application: `patabimavrs12`
- Analytics configuration

---

## 🎯 **Post-Deployment Actions**

### **1. Update App Configuration**
After deployment completes, update your app's AWS configuration:

```javascript
// src/config/awsConfigProduction.js
const awsConfig = {
  Auth: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_XXXXXXXXX',  // From deployment output
    userPoolWebClientId: 'XXXXXXXXXXXXXXXXXX',  // From deployment output
    identityPoolId: 'us-east-1:xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
  },
  API: {
    GraphQL: {
      endpoint: 'https://xxxxxxxxxxxx.appsync-api.us-east-1.amazonaws.com/graphql',
      region: 'us-east-1',
      defaultAuthMode: 'userPool',
    },
  },
  Storage: {
    S3: {
      bucket: 'patabima-storage-bucket-dev-xxxxxx',
      region: 'us-east-1',
    },
  },
  Analytics: {
    Pinpoint: {
      appId: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
      region: 'us-east-1',
    },
  },
};
```

### **2. Switch App to Production Config**
Update `App.js` to use production AWS configuration:

```javascript
// In App.js
import { AWSProvider } from './src/contexts/AWSContext';
import awsConfig from './src/config/awsConfigProduction';

// Replace AWSProviderDev with AWSProvider
```

### **3. Test All Features**
- [ ] User registration and email verification
- [ ] User login and logout
- [ ] Create agents, clients, quotes, policies
- [ ] File upload to S3
- [ ] Analytics event tracking

### **4. Environment Variables**
Create production `.env` file with actual values from deployment.

---

## 🛠️ **Useful Commands**

### **Check Deployment Status**
```bash
amplify status
```

### **View CloudFormation Stacks**
```bash
amplify console
```

### **Update Specific Service**
```bash
amplify update auth      # Update authentication
amplify update api       # Update API/schema
amplify update storage   # Update storage
amplify update analytics # Update analytics
```

### **Environment Management**
```bash
amplify env list         # List environments
amplify env add          # Add new environment (e.g., prod)
amplify env checkout     # Switch environments
```

### **Troubleshooting**
```bash
amplify diagnose         # Diagnose issues
amplify logs             # View CloudFormation logs
```

---

## ⚠️ **Important Notes**

1. **First Deployment**: May take 15-20 minutes
2. **API Key**: Generated with 7-day expiration (for testing)
3. **SMS Sandbox**: Verify phone numbers in Cognito console
4. **Pinpoint EOL**: Consider migration to Kinesis for production
5. **Costs**: Monitor AWS billing for deployed resources

---

## 🎉 **Ready to Deploy!**

Your PataBima AWS backend is fully configured and ready for deployment. 

**Next Command**: `amplify push`
