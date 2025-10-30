# 🏗️ PataBima AWS Setup - Master Organization

## 📋 **SETUP OVERVIEW**

| Component | Resource Name | Status | Configuration |
|-----------|---------------|--------|---------------|
| **Project** | `PataBimaVrs12` | ✅ Ready | Amplify Gen 1 project |
| **Environment** | `dev` | ✅ Active | Development environment |
| **Profile** | `Batabimvs12` | ✅ Configured | AWS CLI profile |
| **Region** | `us-east-1` | ✅ Set | Primary AWS region |

---

## 🔐 **AUTHENTICATION SETUP**

### **Cognito Configuration:**
- **Resource Name**: `patabimavrs127e7c3478`
- **Sign-in Methods**: Email OR Phone Number
- **Required Attributes**: Email, Name, Phone Number, Preferred Username
- **Email Verification**: Custom with redirect to `https://www.kahoikreations.co.ke`
- **Custom Lambda**: `patabimavrs127e7c3478CustomMessage`
- **SMS Support**: Enabled (Sandbox mode)

### **Security Rules:**
- Owner-based authorization for all user data
- Admin group access for pricing management
- Authenticated users only for analytics

---

## 🗄️ **DATABASE & API SETUP**

### **GraphQL API Configuration:**
- **Resource Name**: `patabimavrs12`
- **Authorization**: API Key (7 days) + Cognito User Pool
- **Transformer Version**: 2
- **Conflict Detection**: Disabled

### **Data Models (5 Core Types):**

#### **1. Agent Model**
```graphql
type Agent @model @auth(rules: [{allow: owner}])
```
- **Purpose**: Insurance sales agents
- **Key Fields**: agentCode, email, firstName, lastName, phoneNumber
- **Business Fields**: totalSales, totalCommission
- **Relationships**: Has many quotes, clients, policies
- **Indexes**: byAgentCode, byEmail

#### **2. Client Model**
```graphql
type Client @model @auth(rules: [{allow: owner}])
```
- **Purpose**: Insurance customers
- **Key Fields**: firstName, lastName, email, phoneNumber, idNumber
- **Personal Fields**: dateOfBirth, address
- **Relationships**: Belongs to agent, has many quotes and policies
- **Index**: byAgent

#### **3. Quote Model**
```graphql
type Quote @model @auth(rules: [{allow: owner}])
```
- **Purpose**: Insurance quotations
- **Key Fields**: quoteNumber, insuranceType, status, premium, coverAmount
- **Business Fields**: validUntil, documents
- **Insurance Details**: motorDetails, medicalDetails, wibaDetails, travelDetails
- **Relationships**: Belongs to client and agent
- **Indexes**: byQuoteNumber, byClient, byAgent

#### **4. Policy Model**
```graphql
type Policy @model @auth(rules: [{allow: owner}])
```
- **Purpose**: Active insurance policies
- **Key Fields**: policyNumber, insuranceType, status, premium, coverAmount
- **Date Fields**: startDate, endDate
- **Relationships**: Belongs to client and agent, links to quote
- **Indexes**: byPolicyNumber, byClient, byAgent

#### **5. AdminPricing Model**
```graphql
type AdminPricing @model @auth(rules: [{allow: groups, groups: ["Admin"]}])
```
- **Purpose**: Pricing rules management
- **Key Fields**: insuranceType, basePremium, factors, rates
- **Admin Fields**: version, isActive, createdBy
- **Access**: Admin group only

### **Insurance Details Types:**
- **MotorDetails**: Vehicle information, registration, value, usage
- **MedicalDetails**: Age, gender, occupation, conditions, beneficiaries
- **WIBADetails**: Occupation, salary, risk category
- **TravelDetails**: Destination, dates, purpose, age

### **Enums:**
- **InsuranceType**: MOTOR, MEDICAL, WIBA, TRAVEL, PERSONAL_ACCIDENT
- **QuoteStatus**: DRAFT, SENT, ACCEPTED, REJECTED, EXPIRED
- **PolicyStatus**: ACTIVE, EXPIRED, CANCELLED, PENDING_RENEWAL

---

## 📁 **STORAGE SETUP**

### **S3 Storage:**
- **Resource Name**: `patabimastorage`
- **Bucket Name**: `patabima-storage-bucket`
- **Access Control**: Authenticated users only
- **Permissions**: Create/Update, Read, Delete
- **Use Cases**: Document uploads, profile pictures, policy documents
- **Lambda Triggers**: None

### **Additional DynamoDB:**
- **Resource Name**: `Patabimasql713`
- **Primary Key**: id (string)
- **Sort Key**: createdAt (string)
- **Attributes**: userId, insuranceType, quotationAmount, vehicleDetails, documents, isVerified
- **GSI**: byUserId (createdAt + id)
- **Lambda Triggers**: None

---

## 📈 **ANALYTICS SETUP**

### **Amazon Pinpoint:**
- **Resource Name**: `patabimavrs12`
- **Access Control**: Authenticated users only
- **Guest Analytics**: Disabled
- **Integration**: Ready for custom events

⚠️ **Migration Note**: Pinpoint EOL October 30, 2026. Plan Kinesis migration.

---

## 🛠️ **PROJECT STRUCTURE ORGANIZATION**

### **Backend Structure:**
```
amplify/
├── backend/
│   ├── auth/
│   │   └── patabimavrs127e7c3478/       # Cognito User Pool config
│   ├── function/
│   │   └── patabimavrs127e7c3478CustomMessage/  # Email verification Lambda
│   ├── api/
│   │   └── patabimavrs12/               # GraphQL API with schema
│   ├── storage/
│   │   ├── patabimastorage/             # S3 bucket config
│   │   └── Patabimasql713/              # DynamoDB table config
│   └── analytics/
│       └── patabimavrs12/               # Pinpoint analytics config
├── .config/
├── hooks/
├── cli.json
└── team-provider-info.json
```

### **Frontend Integration:**
```
src/
├── contexts/
│   ├── AWSContext.js                   # Production AWS context
│   └── AWSContextDev.js                # Development mock context
├── services/
│   ├── AWSAuthService.js               # Authentication service
│   ├── AWSDataService.js               # GraphQL data operations
│   └── index.js                        # Service exports
├── config/
│   ├── awsConfig.js                    # Production AWS config
│   ├── awsConfigDev.js                 # Development config
│   └── awsConfigSimple.js              # Simplified config
└── types/
    └── index.ts                        # TypeScript definitions
```

---

## 📋 **DEPLOYMENT ORGANIZATION**

### **Pre-Deployment Checklist:**
- [x] AWS CLI configured with profile `Batabimvs12`
- [x] Amplify project initialized as `PataBimaVrs12`
- [x] Authentication service configured
- [x] GraphQL API with PataBima schema
- [x] S3 storage for file uploads
- [x] Additional DynamoDB table
- [x] Pinpoint analytics configured
- [x] Lambda function for email verification

### **Deployment Command:**
```bash
amplify push
```

### **Expected Cloud Resources:**
1. **Cognito User Pool** + Identity Pool
2. **AppSync GraphQL API** with 5 DynamoDB tables
3. **S3 Bucket** with CORS configuration
4. **Lambda Function** for custom messages
5. **Pinpoint Application** for analytics
6. **IAM Roles and Policies** for all services

---

## 🔧 **CONFIGURATION FILES ORGANIZATION**

### **Environment Files:**
1. **`.env`** - Production environment variables (to be created after deployment)
2. **`amplify/team-provider-info.json`** - Environment configurations
3. **`amplify/.config/local-env-info.json`** - Local environment settings

### **Documentation Files:**
1. **`AWS_DEPLOYMENT_STATUS.md`** - Current status overview
2. **`DEPLOYMENT_COMMANDS.md`** - Deployment guide and commands
3. **`DEPLOYMENT_READY.md`** - Final deployment summary
4. **`AWS_SETUP_GUIDE.md`** - Comprehensive setup documentation

---

## 🎯 **BUSINESS LOGIC ORGANIZATION**

### **Insurance Workflow:**
1. **Agent Registration** → Creates Agent record
2. **Client Onboarding** → Creates Client linked to Agent
3. **Quote Generation** → Creates Quote with insurance details
4. **Quote Acceptance** → Converts Quote to Policy
5. **Policy Management** → Updates Policy status and renewals

### **Data Relationships:**
```
Agent (1) ←→ (Many) Client
Agent (1) ←→ (Many) Quote
Agent (1) ←→ (Many) Policy
Client (1) ←→ (Many) Quote
Client (1) ←→ (Many) Policy
Quote (1) ←→ (0..1) Policy
```

### **Authorization Model:**
- **Agents**: Own their data and client data
- **Clients**: Read access to their own data
- **Admin**: Full access to pricing and system configuration

---

## 🚀 **DEPLOYMENT READINESS**

### **Current Status:**
- **Environment**: `dev`
- **Resources**: 6 categories configured
- **Status**: ✅ **READY FOR DEPLOYMENT**

### **Post-Deployment Tasks:**
1. Update production AWS configuration
2. Switch app from dev to production context
3. Test all authentication flows
4. Verify GraphQL operations
5. Test file upload functionality
6. Configure analytics events
7. Set up monitoring and alerts

---

## 📊 **MONITORING & MAINTENANCE**

### **AWS Console Access:**
- **Cognito**: User management and authentication
- **AppSync**: GraphQL playground and monitoring
- **DynamoDB**: Table data and performance metrics
- **S3**: Storage usage and access logs
- **Pinpoint**: Analytics and user engagement
- **CloudWatch**: Logs and performance monitoring

### **Cost Optimization:**
- DynamoDB on-demand pricing for development
- S3 lifecycle policies for old documents
- CloudWatch billing alarms
- Regular resource cleanup

---

## ✅ **ORGANIZATION COMPLETE**

**Status**: All AWS services organized and ready for deployment  
**Next Action**: Run `amplify push` to deploy to AWS cloud  
**Documentation**: Complete with 4 comprehensive guides  
**Architecture**: Production-ready insurance application backend

🎉 **Your PataBima AWS setup is perfectly organized and ready for deployment!**
