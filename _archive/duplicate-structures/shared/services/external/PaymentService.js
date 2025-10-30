// Payment Integration Service for PataBima App
// Handles M-Pesa, Bank transfers, and other payment methods

import { Alert } from 'react-native';

export class PaymentService {
  
  // M-Pesa STK Push configuration
  static MPESA_CONFIG = {
    consumerKey: process.env.MPESA_CONSUMER_KEY || 'your_consumer_key',
    consumerSecret: process.env.MPESA_CONSUMER_SECRET || 'your_consumer_secret',
    businessShortCode: process.env.MPESA_SHORTCODE || '174379',
    passkey: process.env.MPESA_PASSKEY || 'your_passkey',
    callbackUrl: process.env.MPESA_CALLBACK_URL || 'https://api.patabima.com/mpesa/callback',
    baseUrl: 'https://sandbox.safaricom.co.ke' // Change to production URL
  };

  // Initialize payment for a quote
  static async initiatePayment(quote, paymentMethod, amount) {
    try {
      const paymentData = {
        quoteId: quote.id,
        amount: amount,
        paymentMethod: paymentMethod,
        customerPhone: quote.phoneNumber,
        customerName: quote.customerName || quote.companyName,
        description: `PataBima ${quote.insuranceType} Insurance Premium`,
        timestamp: new Date().toISOString()
      };

      switch (paymentMethod) {
        case 'mpesa':
          return await this.initiateMpesaPayment(paymentData);
        case 'bank':
          return await this.initiateBankPayment(paymentData);
        case 'card':
          return await this.initiateCardPayment(paymentData);
        default:
          throw new Error('Unsupported payment method');
      }
    } catch (error) {
      console.error('Payment initiation error:', error);
      throw error;
    }
  }

  // M-Pesa STK Push payment
  static async initiateMpesaPayment(paymentData) {
    try {
      // Generate OAuth token
      const token = await this.getMpesaToken();
      
      // Format phone number
      const phoneNumber = this.formatPhoneNumber(paymentData.customerPhone);
      
      // Generate timestamp and password
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(
        `${this.MPESA_CONFIG.businessShortCode}${this.MPESA_CONFIG.passkey}${timestamp}`
      ).toString('base64');

      const stkPushData = {
        BusinessShortCode: this.MPESA_CONFIG.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(paymentData.amount),
        PartyA: phoneNumber,
        PartyB: this.MPESA_CONFIG.businessShortCode,
        PhoneNumber: phoneNumber,
        CallBackURL: this.MPESA_CONFIG.callbackUrl,
        AccountReference: paymentData.quoteId,
        TransactionDesc: paymentData.description
      };

      const response = await fetch(`${this.MPESA_CONFIG.baseUrl}/mpesa/stkpush/v1/processrequest`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(stkPushData)
      });

      const result = await response.json();
      
      if (result.ResponseCode === '0') {
        return {
          success: true,
          transactionId: result.CheckoutRequestID,
          message: 'Payment request sent to your phone. Please enter your M-Pesa PIN.',
          paymentMethod: 'mpesa',
          amount: paymentData.amount
        };
      } else {
        throw new Error(result.ResponseDescription || 'M-Pesa payment failed');
      }
    } catch (error) {
      console.error('M-Pesa payment error:', error);
      return {
        success: false,
        error: error.message,
        paymentMethod: 'mpesa'
      };
    }
  }

  // Bank transfer payment instructions
  static async initiateBankPayment(paymentData) {
    try {
      // Generate unique reference number
      const reference = `PB${paymentData.quoteId}${Date.now().toString().slice(-6)}`;
      
      const bankDetails = {
        bankName: 'Equity Bank Kenya',
        accountName: 'PataBima Insurance Agency',
        accountNumber: '0123456789', // Replace with actual account
        branch: 'Westlands Branch',
        swiftCode: 'EQBLKENA',
        reference: reference,
        amount: paymentData.amount,
        instructions: [
          'Use the reference number when making payment',
          'Send payment confirmation to payments@patabima.com',
          'Include your quote ID in the email subject',
          'Policy will be issued within 24 hours of payment confirmation'
        ]
      };

      return {
        success: true,
        transactionId: reference,
        bankDetails: bankDetails,
        message: 'Bank payment details generated successfully',
        paymentMethod: 'bank',
        amount: paymentData.amount
      };
    } catch (error) {
      console.error('Bank payment error:', error);
      return {
        success: false,
        error: error.message,
        paymentMethod: 'bank'
      };
    }
  }

  // Card payment (integration with payment gateway)
  static async initiateCardPayment(paymentData) {
    try {
      // This would integrate with a payment gateway like Stripe, Paystack, etc.
      // For now, return mock response
      
      const transactionId = `card_${Date.now()}`;
      
      return {
        success: true,
        transactionId: transactionId,
        paymentUrl: `https://checkout.patabima.com/${transactionId}`,
        message: 'Redirecting to secure payment page...',
        paymentMethod: 'card',
        amount: paymentData.amount
      };
    } catch (error) {
      console.error('Card payment error:', error);
      return {
        success: false,
        error: error.message,
        paymentMethod: 'card'
      };
    }
  }

  // Get M-Pesa OAuth token
  static async getMpesaToken() {
    try {
      const auth = Buffer.from(
        `${this.MPESA_CONFIG.consumerKey}:${this.MPESA_CONFIG.consumerSecret}`
      ).toString('base64');

      const response = await fetch(`${this.MPESA_CONFIG.baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      const result = await response.json();
      return result.access_token;
    } catch (error) {
      console.error('M-Pesa token error:', error);
      throw new Error('Failed to get M-Pesa token');
    }
  }

  // Format phone number for M-Pesa (254XXXXXXXXX)
  static formatPhoneNumber(phone) {
    if (!phone) throw new Error('Phone number is required');
    
    // Remove any non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('254')) {
      return cleaned;
    } else if (cleaned.startsWith('0')) {
      return '254' + cleaned.slice(1);
    } else if (cleaned.length === 9) {
      return '254' + cleaned;
    } else {
      throw new Error('Invalid phone number format');
    }
  }

  // Check payment status
  static async checkPaymentStatus(transactionId, paymentMethod) {
    try {
      switch (paymentMethod) {
        case 'mpesa':
          return await this.checkMpesaStatus(transactionId);
        case 'bank':
          return await this.checkBankStatus(transactionId);
        case 'card':
          return await this.checkCardStatus(transactionId);
        default:
          throw new Error('Unsupported payment method');
      }
    } catch (error) {
      console.error('Payment status check error:', error);
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  // Check M-Pesa payment status
  static async checkMpesaStatus(checkoutRequestId) {
    try {
      const token = await this.getMpesaToken();
      const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
      const password = Buffer.from(
        `${this.MPESA_CONFIG.businessShortCode}${this.MPESA_CONFIG.passkey}${timestamp}`
      ).toString('base64');

      const queryData = {
        BusinessShortCode: this.MPESA_CONFIG.businessShortCode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId
      };

      const response = await fetch(`${this.MPESA_CONFIG.baseUrl}/mpesa/stkpushquery/v1/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(queryData)
      });

      const result = await response.json();
      
      return {
        status: result.ResultCode === '0' ? 'completed' : 'pending',
        message: result.ResultDesc,
        transactionId: result.MpesaReceiptNumber || checkoutRequestId
      };
    } catch (error) {
      console.error('M-Pesa status check error:', error);
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  // Check bank payment status (manual verification)
  static async checkBankStatus(reference) {
    // This would typically check with your backend/banking API
    return {
      status: 'pending',
      message: 'Bank payment verification in progress. Please contact support.',
      transactionId: reference
    };
  }

  // Check card payment status
  static async checkCardStatus(transactionId) {
    // This would check with your payment gateway
    return {
      status: 'pending',
      message: 'Card payment verification in progress.',
      transactionId: transactionId
    };
  }

  // Calculate payment installments
  static calculateInstallments(totalAmount, installmentPeriod = 'monthly') {
    const installmentOptions = {
      monthly: 12,
      quarterly: 4,
      biannual: 2,
      annual: 1
    };

    const periods = installmentOptions[installmentPeriod] || 12;
    const baseAmount = totalAmount / periods;
    
    // Add small processing fee for installments
    const processingFeePercentage = periods > 1 ? 0.02 : 0; // 2% for installments
    const installmentAmount = baseAmount * (1 + processingFeePercentage);

    return {
      installmentAmount: Math.round(installmentAmount),
      totalAmount: Math.round(installmentAmount * periods),
      periods: periods,
      processingFee: Math.round(totalAmount * processingFeePercentage),
      savings: totalAmount - Math.round(installmentAmount * periods)
    };
  }

  // Show payment options to user
  static showPaymentOptions(quote, onPaymentSelect) {
    const totalAmount = quote.calculatedPremium?.totalPremium || 0;
    
    Alert.alert(
      'Payment Options',
      `Total Amount: ${PricingService.formatCurrency(totalAmount)}`,
      [
        {
          text: 'M-Pesa',
          onPress: () => onPaymentSelect('mpesa', totalAmount)
        },
        {
          text: 'Bank Transfer',
          onPress: () => onPaymentSelect('bank', totalAmount)
        },
        {
          text: 'Credit Card',
          onPress: () => onPaymentSelect('card', totalAmount)
        },
        {
          text: 'Installments',
          onPress: () => this.showInstallmentOptions(totalAmount, onPaymentSelect)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  }

  // Show installment options
  static showInstallmentOptions(totalAmount, onPaymentSelect) {
    const monthly = this.calculateInstallments(totalAmount, 'monthly');
    const quarterly = this.calculateInstallments(totalAmount, 'quarterly');
    
    Alert.alert(
      'Installment Options',
      'Choose your payment plan:',
      [
        {
          text: `Monthly (${PricingService.formatCurrency(monthly.installmentAmount)})`,
          onPress: () => onPaymentSelect('mpesa', monthly.installmentAmount, 'monthly')
        },
        {
          text: `Quarterly (${PricingService.formatCurrency(quarterly.installmentAmount)})`,
          onPress: () => onPaymentSelect('mpesa', quarterly.installmentAmount, 'quarterly')
        },
        {
          text: 'Back',
          style: 'cancel'
        }
      ]
    );
  }
}

export default PaymentService;
