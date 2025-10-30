// AWS Configuration Service for PataBima App
// Simplified configuration to avoid circular dependencies

const awsConfig = {
  Auth: {
    region: 'us-east-1',
    userPoolId: 'PLACEHOLDER_USER_POOL_ID',
    userPoolWebClientId: 'PLACEHOLDER_APP_CLIENT_ID', 
    identityPoolId: 'PLACEHOLDER_IDENTITY_POOL_ID',
    mandatorySignIn: false, // Set to false for development
  },
  
  API: {
    GraphQL: {
      endpoint: 'PLACEHOLDER_GRAPHQL_ENDPOINT',
      region: 'us-east-1',
      defaultAuthMode: 'API_KEY',
    },
  },
  
  Storage: {
    S3: {
      bucket: 'PLACEHOLDER_S3_BUCKET',
      region: 'us-east-1',
    },
  },
  
  Analytics: {
    Pinpoint: {
      appId: 'PLACEHOLDER_PINPOINT_APP_ID',
      region: 'us-east-1',
    },
  },
};

export default awsConfig;
