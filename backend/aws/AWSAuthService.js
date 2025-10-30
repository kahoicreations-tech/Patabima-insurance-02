// AWS Authentication Service for PataBima App
// Handles user authentication, registration, and session management

// import { Auth } from 'aws-amplify'; // Removed for Android bundling compatibility
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_STORAGE_KEYS = {
  USER_DATA: '@PataBima:userData',
  AGENT_PROFILE: '@PataBima:agentProfile',
  SESSION_TOKEN: '@PataBima:sessionToken'
};

// AWS Authentication Service temporarily disabled for Android bundling compatibility
/*
export const AWSAuthService = {
  
  // Sign up new agent
  signUp: async (agentData) => {
    try {
      const { email, password, agentCode, firstName, lastName, phone } = agentData;
      
      const signUpResult = await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          given_name: firstName,
          family_name: lastName,
          phone_number: phone,
          'custom:agent_code': agentCode,
          'custom:user_type': 'agent'
        },
        autoSignIn: {
          enabled: true
        }
      });
      
      return {
        success: true,
        user: signUpResult.user,
        userSub: signUpResult.userSub,
        nextStep: signUpResult.nextStep
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: error.message || 'Sign up failed'
      };
    }
  },
  
  // Confirm sign up with verification code
  confirmSignUp: async (email, confirmationCode) => {
    try {
      await Auth.confirmSignUp(email, confirmationCode);
      return { success: true };
    } catch (error) {
      console.error('Confirmation error:', error);
      return {
        success: false,
        error: error.message || 'Confirmation failed'
      };
    }
  },
  
  // Sign in agent
  signIn: async (email, password) => {
    try {
      const user = await Auth.signIn(email, password);
      
      // Store user data locally
      const userData = {
        username: user.username,
        attributes: user.attributes,
        signInUserSession: user.signInUserSession
      };
      
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      
      return {
        success: true,
        user,
        requiresNewPassword: user.challengeName === 'NEW_PASSWORD_REQUIRED'
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error.message || 'Sign in failed'
      };
    }
  },
  
  // Sign out
  signOut: async () => {
    try {
      await Auth.signOut();
      
      // Clear local storage
      await AsyncStorage.multiRemove([
        AUTH_STORAGE_KEYS.USER_DATA,
        AUTH_STORAGE_KEYS.AGENT_PROFILE,
        AUTH_STORAGE_KEYS.SESSION_TOKEN
      ]);
      
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.message || 'Sign out failed'
      };
    }
  },
  
  // Get current authenticated user
  getCurrentUser: async () => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      return {
        success: true,
        user
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: 'No authenticated user'
      };
    }
  },
  
  // Update user attributes
  updateUserAttributes: async (attributes) => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.updateUserAttributes(user, attributes);
      
      return { success: true };
    } catch (error) {
      console.error('Update attributes error:', error);
      return {
        success: false,
        error: error.message || 'Update failed'
      };
    }
  },
  
  // Change password
  changePassword: async (oldPassword, newPassword) => {
    try {
      const user = await Auth.currentAuthenticatedUser();
      await Auth.changePassword(user, oldPassword, newPassword);
      
      return { success: true };
    } catch (error) {
      console.error('Change password error:', error);
      return {
        success: false,
        error: error.message || 'Password change failed'
      };
    }
  },
  
  // Forgot password
  forgotPassword: async (email) => {
    try {
      await Auth.forgotPassword(email);
      return { success: true };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        error: error.message || 'Forgot password failed'
      };
    }
  },
  
  // Confirm forgot password
  forgotPasswordSubmit: async (email, code, newPassword) => {
    try {
      await Auth.forgotPasswordSubmit(email, code, newPassword);
      return { success: true };
    } catch (error) {
      console.error('Forgot password submit error:', error);
      return {
        success: false,
        error: error.message || 'Password reset failed'
      };
    }
  },
  
  // Get session token
  getSessionToken: async () => {
    try {
      const session = await Auth.currentSession();
      const token = session.getAccessToken().getJwtToken();
      
      // Cache token locally
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.SESSION_TOKEN, token);
      
      return {
        success: true,
        token
      };
    } catch (error) {
      console.error('Get session token error:', error);
      return {
        success: false,
        error: 'Failed to get session token'
      };
    }
  },
  
  // Check if user is authenticated
  isAuthenticated: async () => {
    try {
      await Auth.currentAuthenticatedUser();
      return true;
    } catch (error) {
      return false;
    }
  },
  
  // Get agent profile
  getAgentProfile: async () => {
    try {
      const cachedProfile = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.AGENT_PROFILE);
      if (cachedProfile) {
        return {
          success: true,
          profile: JSON.parse(cachedProfile)
        };
      }
      
      const user = await Auth.currentAuthenticatedUser();
      const profile = {
        agentCode: user.attributes['custom:agent_code'],
        firstName: user.attributes.given_name,
        lastName: user.attributes.family_name,
        email: user.attributes.email,
        phone: user.attributes.phone_number,
        userType: user.attributes['custom:user_type']
      };
      
      // Cache profile
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.AGENT_PROFILE, JSON.stringify(profile));
      
      return {
        success: true,
        profile
      };
    } catch (error) {
      console.error('Get agent profile error:', error);
      return {
        success: false,
        error: 'Failed to get agent profile'
      };
    }
  },
  
  // Update agent profile
  updateAgentProfile: async (profileData) => {
    try {
      const attributes = {};
      
      if (profileData.firstName) attributes.given_name = profileData.firstName;
      if (profileData.lastName) attributes.family_name = profileData.lastName;
      if (profileData.phone) attributes.phone_number = profileData.phone;
      
      if (Object.keys(attributes).length > 0) {
        await AWSAuthService.updateUserAttributes(attributes);
      }
      
      // Update cached profile
      const currentProfile = await AWSAuthService.getAgentProfile();
      if (currentProfile.success) {
        const updatedProfile = { ...currentProfile.profile, ...profileData };
        await AsyncStorage.setItem(AUTH_STORAGE_KEYS.AGENT_PROFILE, JSON.stringify(updatedProfile));
      }
      
      return { success: true };
    } catch (error) {
      console.error('Update agent profile error:', error);
      return {
        success: false,
        error: error.message || 'Profile update failed'
      };
    }
  }
};
*/

// Temporary placeholder export for Android compatibility
export const AWSAuthService = {
  signUp: async () => ({ success: false, error: 'AWS temporarily disabled' }),
  confirmSignUp: async () => ({ success: false, error: 'AWS temporarily disabled' }),
  signIn: async () => ({ success: false, error: 'AWS temporarily disabled' }),
  signOut: async () => ({ success: false, error: 'AWS temporarily disabled' }),
  getCurrentUser: async () => ({ success: false, error: 'AWS temporarily disabled' }),
  updateUserAttributes: async () => ({ success: false, error: 'AWS temporarily disabled' }),
  changePassword: async () => ({ success: false, error: 'AWS temporarily disabled' }),
  forgotPassword: async () => ({ success: false, error: 'AWS temporarily disabled' }),
  forgotPasswordSubmit: async () => ({ success: false, error: 'AWS temporarily disabled' }),
  getCurrentSession: async () => ({ success: false, error: 'AWS temporarily disabled' }),
  isAuthenticated: async () => ({ success: false, isAuthenticated: false, error: 'AWS temporarily disabled' }),
  getUserProfile: async () => ({ success: false, error: 'AWS temporarily disabled' })
};

export default AWSAuthService;
