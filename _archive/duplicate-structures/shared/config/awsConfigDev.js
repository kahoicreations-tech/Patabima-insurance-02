// Simple AWS configuration without circular dependencies
// This will be used until we deploy actual AWS services

const awsConfig = {
  // Development mode configuration
  isConfigured: false,
  
  Auth: {
    region: 'us-east-1',
    userPoolId: 'DEVELOPMENT_MODE',
    userPoolWebClientId: 'DEVELOPMENT_MODE',
    identityPoolId: 'DEVELOPMENT_MODE',
    mandatorySignIn: false,
  },
  
  API: {
    GraphQL: {
      endpoint: 'DEVELOPMENT_MODE',
      region: 'us-east-1',
      defaultAuthMode: 'API_KEY',
    },
  },
  
  Storage: {
    S3: {
      bucket: 'DEVELOPMENT_MODE',
      region: 'us-east-1',
    },
  },
  
  Analytics: {
    Pinpoint: {
      appId: 'DEVELOPMENT_MODE',
      region: 'us-east-1',
    },
  },
};

export default awsConfig;
