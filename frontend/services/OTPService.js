/**
 * OTP Service
 * Handles OTP send, verify, and resend operations
 */
import DjangoAPIService from './DjangoAPIService';

class OTPService {
  /**
   * Send OTP to phone number
   * @param {string} phoneNumber - Phone number (0712345678, 712345678, +254712345678, 254712345678)
   * @param {string} purpose - Purpose of OTP (LOGIN, SIGNUP, RESET_PASSWORD, etc.)
   * @returns {Promise<Object>} Response with success, message, expires_in_minutes, otp_code (dev only)
   */
  static async sendOTP(phoneNumber, purpose = 'LOGIN') {
    try {
      const response = await DjangoAPIService.makeRequest(
        '/auth/otp/send',
        {
          method: 'POST',
          body: JSON.stringify({
            phone_number: phoneNumber,
            purpose: purpose,
          }),
        }
      );

      return {
        success: true,
        data: response,
        message: response.message || 'OTP sent successfully',
        expiresInMinutes: response.expires_in_minutes || 5,
        // Note: otp_code only returned in development mode for testing
        otpCode: response.otp_code,
      };
    } catch (error) {
      console.error('[OTPService] Send OTP error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send OTP',
        details: error.detail || error.details,
      };
    }
  }

  /**
   * Verify OTP code
   * @param {string} phoneNumber - Phone number
   * @param {string} otpCode - 6-digit OTP code
   * @param {string} purpose - Purpose of OTP (LOGIN, SIGNUP, etc.)
   * @returns {Promise<Object>} Response with success, message, user_id (if applicable)
   */
  static async verifyOTP(phoneNumber, otpCode, purpose = 'LOGIN') {
    try {
      const response = await DjangoAPIService.makeRequest(
        '/auth/otp/verify',
        {
          method: 'POST',
          body: JSON.stringify({
            phone_number: phoneNumber,
            code: otpCode,
            purpose: purpose,
          }),
        }
      );

      return {
        success: true,
        data: response,
        message: response.message || 'OTP verified successfully',
        userId: response.user_id,
      };
    } catch (error) {
      console.error('[OTPService] Verify OTP error:', error);
      
      // Extract detailed error message
      let errorMessage = 'Failed to verify OTP';
      if (error.detail) {
        errorMessage = error.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        details: error.details,
      };
    }
  }

  /**
   * Resend OTP (invalidates previous OTP and sends new one)
   * @param {string} phoneNumber - Phone number
   * @param {string} purpose - Purpose of OTP (LOGIN, SIGNUP, etc.)
   * @returns {Promise<Object>} Response with success, message, expires_in_minutes, otp_code (dev only)
   */
  static async resendOTP(phoneNumber, purpose = 'LOGIN') {
    try {
      const response = await DjangoAPIService.makeRequest(
        '/auth/otp/resend',
        {
          method: 'POST',
          body: JSON.stringify({
            phone_number: phoneNumber,
            purpose: purpose,
          }),
        }
      );

      return {
        success: true,
        data: response,
        message: response.message || 'OTP resent successfully',
        expiresInMinutes: response.expires_in_minutes || 5,
        // Note: otp_code only returned in development mode for testing
        otpCode: response.otp_code,
      };
    } catch (error) {
      console.error('[OTPService] Resend OTP error:', error);
      
      // Extract detailed error message (e.g., rate limiting)
      let errorMessage = 'Failed to resend OTP';
      if (error.detail) {
        errorMessage = error.detail;
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        error: errorMessage,
        details: error.details,
        rateLimited: errorMessage.toLowerCase().includes('too many') || 
                     errorMessage.toLowerCase().includes('wait'),
      };
    }
  }

  /**
   * Format phone number to accepted format
   * Accepts: 0712345678, 712345678, +254712345678, 254712345678
   * @param {string} phoneNumber - Input phone number
   * @returns {string} Formatted phone number
   */
  static formatPhoneNumber(phoneNumber) {
    if (!phoneNumber) return '';
    
    // Remove all non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If starts with +254, keep as is
    if (cleaned.startsWith('+254')) {
      return cleaned;
    }
    
    // If starts with 254, add +
    if (cleaned.startsWith('254')) {
      return '+' + cleaned;
    }
    
    // If starts with 0, replace with +254
    if (cleaned.startsWith('0')) {
      return '+254' + cleaned.substring(1);
    }
    
    // If just 9 digits, add +254
    if (cleaned.length === 9) {
      return '+254' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Validate phone number format
   * @param {string} phoneNumber - Phone number to validate
   * @returns {Object} { valid: boolean, error: string }
   */
  static validatePhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.trim() === '') {
      return { valid: false, error: 'Phone number is required' };
    }

    const formatted = this.formatPhoneNumber(phoneNumber);
    
    // Kenyan numbers should be +254XXXXXXXXX (13 characters total)
    if (!formatted.startsWith('+254')) {
      return { valid: false, error: 'Phone number must be a Kenyan number (+254)' };
    }
    
    if (formatted.length !== 13) {
      return { valid: false, error: 'Invalid phone number length' };
    }
    
    return { valid: true, formatted };
  }
}

export default OTPService;
