// Payment Service - Simplified version (M-PESA integration to be added later)
import DjangoAPIService from './DjangoAPIService';

class PaymentService {
  constructor() {
    this.api = DjangoAPIService;
  }

  async initiateMpesaPayment(phoneNumber, amount, accountReference, description) {
    return await this.api.initiatePayment({
      amount,
      method: 'MPESA',
      phone: phoneNumber,
      account_reference: accountReference,
      policy_reference: description,
    });
  }

  /**
   * TODO: Check M-PESA payment status (To be implemented)
   */
  async checkMpesaPaymentStatus(checkoutRequestId) {
    if (!checkoutRequestId) {
      throw new Error('checkoutRequestId/reference is required');
    }
    return await this.api.getPaymentStatus(checkoutRequestId);
  }

  /**
   * Submit payment confirmation to backend
   */
  async confirmPayment(paymentData) {
    throw new Error('confirmPayment is not supported. Payments are confirmed via provider callbacks/webhooks on the backend.');
  }
}

export default new PaymentService();
