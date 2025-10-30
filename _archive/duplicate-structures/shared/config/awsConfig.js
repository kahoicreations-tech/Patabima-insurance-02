// AWS Configuration Service for PataBima App
// Handles AWS Amplify setup and configuration

const awsConfig = {
  // AWS Region
  region: 'us-east-1',
  
  // Cognito Configuration for Authentication
  Auth: {
    region: 'us-east-1',
    userPoolId: 'us-east-1_XXXXXXXXX', // Replace with actual User Pool ID
    userPoolWebClientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX', // Replace with actual App Client ID
    identityPoolId: 'us-east-1:XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX', // Replace with actual Identity Pool ID
    mandatorySignIn: true,
    authenticationFlowType: 'USER_SRP_AUTH'
  },
  
  // API Gateway Configuration
  API: {
    endpoints: [
      {
        name: 'PataBimaAPI',
        endpoint: process.env.AWS_API_ENDPOINT,
        region: process.env.AWS_REGION || 'us-east-1',
        custom_header: async () => {
          return {
            'Authorization': `Bearer ${await getAuthToken()}`,
            'Content-Type': 'application/json'
          };
        }
      }
    ]
  },
  
  // Storage Configuration (S3)
  Storage: {
    AWSS3: {
      bucket: process.env.AWS_S3_BUCKET,
      region: process.env.AWS_REGION || 'us-east-1',
      customPrefix: {
        public: 'public/',
        protected: 'protected/',
        private: 'private/'
      }
    }
  },
  
  // Analytics Configuration (Pinpoint)
  Analytics: {
    AWSPinpoint: {
      appId: process.env.AWS_PINPOINT_APP_ID,
      region: process.env.AWS_REGION || 'us-east-1',
      mandatorySignIn: false
    }
  },
  
  // Notifications Configuration (SNS/Pinpoint)
  Notifications: {
    InAppMessaging: {
      AWSPinpoint: {
        appId: process.env.AWS_PINPOINT_APP_ID,
        region: process.env.AWS_REGION || 'us-east-1'
      }
    },
    PushNotification: {
      AWSPinpoint: {
        appId: process.env.AWS_PINPOINT_APP_ID,
        region: process.env.AWS_REGION || 'us-east-1'
      }
    }
  },
  
  // DataStore Configuration (AppSync + DynamoDB)
  DataStore: {
    authModeStrategyType: 'MULTI_AUTH',
    defaultAuthMode: 'AMAZON_COGNITO_USER_POOLS',
    conflictHandler: (local, remote, field) => {
      // Always prefer remote data for pricing and admin updates
      if (field === 'pricing' || field === 'adminUpdated') {
        return remote;
      }
      // For user data, prefer local changes
      return local;
    }
  }
};

// Helper function to get auth token
const getAuthToken = async () => {
  try {
    const { Auth } = await import('aws-amplify');
    const session = await Auth.currentSession();
    return session.getAccessToken().getJwtToken();
  } catch (error) {
    console.warn('Failed to get auth token:', error);
    return null;
  }
};

// Initialize AWS Amplify
export const initializeAWS = () => {
  try {
    Amplify.configure(awsConfig);
    console.log('AWS Amplify configured successfully');
    return true;
  } catch (error) {
    console.error('Failed to configure AWS Amplify:', error);
    return false;
  }
};

// Environment validation
export const validateAWSConfig = () => {
  const requiredEnvVars = [
    'AWS_USER_POOL_ID',
    'AWS_USER_POOL_CLIENT_ID',
    'AWS_API_ENDPOINT',
    'AWS_S3_BUCKET',
    'AWS_PINPOINT_APP_ID'
  ];
  
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.warn('Missing AWS environment variables:', missing);
    return false;
  }
  
  return true;
};

export default awsConfig;
