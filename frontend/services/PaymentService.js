// Payment Service - Simplified version (M-PESA integration to be added later)
import DjangoAPIService from './DjangoAPIService';

class PaymentService {
  constructor() {
    this.api = DjangoAPIService;
  }

  /**
   * Mock payment confirmation (Replace with real M-PESA integration later)
   * For now, this simulates a successful payment
   */
  async mockPaymentConfirmation(paymentMethod, amount, reference) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          receipt: `${paymentMethod}-${Date.now()}`,
          amount: amount,
          reference: reference,
          timestamp: new Date().toISOString()
        });
      }, 2000); // Simulate 2 second processing time
    });
  }

  /**
   * TODO: Initiate M-PESA STK Push (To be implemented)
   */
  async initiateMpesaPayment(phoneNumber, amount, accountReference, description) {
    // Placeholder for future M-PESA integration
    console.log('M-PESA integration pending - using mock payment');
    return this.mockPaymentConfirmation('MPESA', amount, accountReference);
  }

  /**
   * TODO: Check M-PESA payment status (To be implemented)
   */
  async checkMpesaPaymentStatus(checkoutRequestId) {
    // Placeholder for future implementation
    return { status: 'COMPLETED' };
  }

  /**
   * Submit payment confirmation to backend
   */
  async confirmPayment(paymentData) {
    try {
      const response = await this.api.makeAuthenticatedRequest(
        '/payments/confirm',
        'POST',
        paymentData
      );
      return response;
    } catch (error) {
      console.error('Payment confirmation failed:', error);
      throw error;
    }
  }
}

export default new PaymentService();
