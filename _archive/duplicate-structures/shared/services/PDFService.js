// PDF Generation Service for PataBima Insurance Quotes
// Generates professional PDF quotes using React Native PDF libraries

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { PricingService } from './PricingService';

export class PDFService {
  
  // Generate PDF quote for any insurance type
  static async generateQuotePDF(quote) {
    try {
      const htmlContent = this.generateHTMLContent(quote);
      
      const options = {
        html: htmlContent,
        width: 612,
        height: 792,
        base64: false
      };

      const pdf = await Print.printToFileAsync(options);
      return pdf;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }

  // Share PDF via native sharing
  static async sharePDF(quote) {
    try {
      const pdf = await this.generateQuotePDF(quote);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdf.uri, {
          mimeType: 'application/pdf',
          dialogTitle: `PataBima Quote - ${quote.id}`,
          UTI: 'com.adobe.pdf'
        });
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing PDF:', error);
      throw error;
    }
  }

  // Save PDF to device
  static async savePDF(quote) {
    try {
      const pdf = await this.generateQuotePDF(quote);
      const fileName = `PataBima_Quote_${quote.id}_${new Date().toISOString().split('T')[0]}.pdf`;
      const documentDirectory = FileSystem.documentDirectory;
      const filePath = `${documentDirectory}${fileName}`;
      
      await FileSystem.moveAsync({
        from: pdf.uri,
        to: filePath
      });
      
      return filePath;
    } catch (error) {
      console.error('Error saving PDF:', error);
      throw error;
    }
  }

  // Generate HTML content for PDF
  static generateHTMLContent(quote) {
    const logoBase64 = ""; // Add PataBima logo base64 here
    
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>PataBima Insurance Quote</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                margin: 0;
                padding: 20px;
                color: #333;
                line-height: 1.6;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 3px solid #D5222B;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }
            .logo {
                width: 120px;
                height: 60px;
            }
            .company-info {
                text-align: right;
                font-size: 12px;
                color: #666;
            }
            .quote-title {
                color: #D5222B;
                font-size: 28px;
                font-weight: bold;
                margin: 0;
            }
            .quote-subtitle {
                color: #646767;
                font-size: 16px;
                margin: 5px 0 0 0;
            }
            .quote-details {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                margin: 10px 0;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            .detail-label {
                font-weight: bold;
                color: #646767;
            }
            .detail-value {
                color: #333;
            }
            .premium-section {
                background: #D5222B;
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
                margin: 30px 0;
            }
            .premium-amount {
                font-size: 36px;
                font-weight: bold;
                margin: 10px 0;
            }
            .premium-label {
                font-size: 14px;
                opacity: 0.9;
            }
            .coverage-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .coverage-table th,
            .coverage-table td {
                border: 1px solid #ddd;
                padding: 12px;
                text-align: left;
            }
            .coverage-table th {
                background: #f8f9fa;
                font-weight: bold;
                color: #646767;
            }
            .terms-section {
                margin-top: 40px;
                font-size: 12px;
                color: #666;
            }
            .footer {
                margin-top: 50px;
                text-align: center;
                font-size: 11px;
                color: #888;
                border-top: 1px solid #eee;
                padding-top: 20px;
            }
            .highlight {
                background: #fff3cd;
                padding: 15px;
                border-left: 4px solid #ffc107;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <h1 class="quote-title">INSURANCE QUOTE</h1>
                <p class="quote-subtitle">${this.getInsuranceTypeTitle(quote.insuranceType)}</p>
            </div>
            <div class="company-info">
                <strong>PataBima Insurance Agency</strong><br>
                Quote ID: ${quote.id}<br>
                Date: ${new Date(quote.createdAt).toLocaleDateString()}<br>
                Valid Until: ${this.getExpiryDate(quote.createdAt)}
            </div>
        </div>

        ${this.generateCustomerSection(quote)}
        
        ${this.generateCoverageSection(quote)}
        
        <div class="premium-section">
            <div class="premium-label">Total Annual Premium</div>
            <div class="premium-amount">${PricingService.formatCurrency(quote.calculatedPremium?.totalPremium || 0)}</div>
            <div class="premium-label">
                Monthly: ${PricingService.formatCurrency((quote.calculatedPremium?.totalPremium || 0) / 12)}
            </div>
        </div>

        ${this.generateTermsSection(quote)}

        <div class="highlight">
            <strong>Next Steps:</strong><br>
            1. Review the quote details carefully<br>
            2. Contact your PataBima agent for any clarifications<br>
            3. Provide required documents for policy issuance<br>
            4. Complete premium payment to activate coverage
        </div>

        <div class="footer">
            <p><strong>PataBima Insurance Agency</strong></p>
            <p>Licensed Insurance Broker | Kenya | info@patabima.com</p>
            <p>This quote is subject to underwriter approval and final terms may vary.</p>
        </div>
    </body>
    </html>
    `;
  }

  static getInsuranceTypeTitle(type) {
    const titles = {
      'motor': 'Motor Vehicle Insurance',
      'medical': 'Medical Insurance',
      'wiba': 'Work Injury Benefits Act (WIBA)',
      'lastExpense': 'Last Expense Insurance',
      'travel': 'Travel Insurance',
      'personalAccident': 'Personal Accident Insurance'
    };
    return titles[type] || 'Insurance Quote';
  }

  static generateCustomerSection(quote) {
    return `
    <div class="quote-details">
        <h3 style="margin-top: 0; color: #D5222B;">Customer Information</h3>
        <div class="detail-row">
            <span class="detail-label">Name:</span>
            <span class="detail-value">${quote.customerName || quote.companyName || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Phone:</span>
            <span class="detail-value">${quote.phoneNumber || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Email:</span>
            <span class="detail-value">${quote.email || 'N/A'}</span>
        </div>
        ${quote.idNumber ? `
        <div class="detail-row">
            <span class="detail-label">ID Number:</span>
            <span class="detail-value">${quote.idNumber}</span>
        </div>
        ` : ''}
    </div>
    `;
  }

  static generateCoverageSection(quote) {
    switch (quote.insuranceType) {
      case 'motor':
        return this.generateMotorCoverage(quote);
      case 'medical':
        return this.generateMedicalCoverage(quote);
      case 'wiba':
        return this.generateWIBACoverage(quote);
      case 'lastExpense':
        return this.generateLastExpenseCoverage(quote);
      case 'travel':
        return this.generateTravelCoverage(quote);
      case 'personalAccident':
        return this.generatePersonalAccidentCoverage(quote);
      default:
        return '<div class="quote-details"><h3>Coverage Details</h3><p>Coverage information not available</p></div>';
    }
  }

  static generateMotorCoverage(quote) {
    return `
    <div class="quote-details">
        <h3 style="margin-top: 0; color: #D5222B;">Vehicle Information</h3>
        <div class="detail-row">
            <span class="detail-label">Vehicle Make:</span>
            <span class="detail-value">${quote.vehicleMake || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Vehicle Model:</span>
            <span class="detail-value">${quote.vehicleModel || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Year of Manufacture:</span>
            <span class="detail-value">${quote.yearOfManufacture || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Vehicle Value:</span>
            <span class="detail-value">${PricingService.formatCurrency(quote.vehicleValue || 0)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Coverage Type:</span>
            <span class="detail-value">${quote.coverageType || 'N/A'}</span>
        </div>
    </div>
    `;
  }

  static generateMedicalCoverage(quote) {
    const coverage = PricingService.medical.basePremiums[quote.coverageType];
    return `
    <div class="quote-details">
        <h3 style="margin-top: 0; color: #D5222B;">Medical Coverage Details</h3>
        <div class="detail-row">
            <span class="detail-label">Plan Type:</span>
            <span class="detail-value">${quote.coverageType || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Coverage Limit:</span>
            <span class="detail-value">${PricingService.formatCurrency(coverage?.coverage || 0)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Policy Type:</span>
            <span class="detail-value">${quote.policyType || 'N/A'}</span>
        </div>
        ${quote.dependents ? `
        <div class="detail-row">
            <span class="detail-label">Dependents:</span>
            <span class="detail-value">${quote.dependents} people</span>
        </div>
        ` : ''}
    </div>
    `;
  }

  static generateWIBACoverage(quote) {
    return `
    <div class="quote-details">
        <h3 style="margin-top: 0; color: #D5222B;">WIBA Coverage Details</h3>
        <div class="detail-row">
            <span class="detail-label">Company:</span>
            <span class="detail-value">${quote.companyName || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Total Employees:</span>
            <span class="detail-value">${quote.calculatedPremium?.totalEmployees || 0}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Industry Type:</span>
            <span class="detail-value">${quote.industryType || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Coverage Type:</span>
            <span class="detail-value">${quote.coverageType || 'N/A'}</span>
        </div>
    </div>
    `;
  }

  static generateLastExpenseCoverage(quote) {
    const coverage = PricingService.lastExpense.basePremiums[quote.coverageType];
    return `
    <div class="quote-details">
        <h3 style="margin-top: 0; color: #D5222B;">Last Expense Coverage</h3>
        <div class="detail-row">
            <span class="detail-label">Coverage Amount:</span>
            <span class="detail-value">${PricingService.formatCurrency(coverage?.coverage || 0)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Payment Frequency:</span>
            <span class="detail-value">${quote.paymentFrequency || 'Annual'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Age:</span>
            <span class="detail-value">${PricingService.calculateAge(quote.dateOfBirth)} years</span>
        </div>
    </div>
    `;
  }

  static generateTravelCoverage(quote) {
    return `
    <div class="quote-details">
        <h3 style="margin-top: 0; color: #D5222B;">Travel Coverage Details</h3>
        <div class="detail-row">
            <span class="detail-label">Destination:</span>
            <span class="detail-value">${quote.destination || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Travel Duration:</span>
            <span class="detail-value">${quote.duration || 0} days</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Coverage Type:</span>
            <span class="detail-value">${quote.coverageType || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Travel Purpose:</span>
            <span class="detail-value">${quote.travelPurpose || 'N/A'}</span>
        </div>
    </div>
    `;
  }

  static generatePersonalAccidentCoverage(quote) {
    return `
    <div class="quote-details">
        <h3 style="margin-top: 0; color: #D5222B;">Personal Accident Coverage</h3>
        <div class="detail-row">
            <span class="detail-label">Coverage Amount:</span>
            <span class="detail-value">${PricingService.formatCurrency(quote.coverageAmount || 0)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Occupation:</span>
            <span class="detail-value">${quote.occupation || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Risk Level:</span>
            <span class="detail-value">${quote.riskLevel || 'N/A'}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Age:</span>
            <span class="detail-value">${PricingService.calculateAge(quote.dateOfBirth)} years</span>
        </div>
    </div>
    `;
  }

  static generateTermsSection(quote) {
    return `
    <div class="terms-section">
        <h3 style="color: #D5222B;">Terms and Conditions</h3>
        <ul>
            <li>This quote is valid for 30 days from the date of issue</li>
            <li>Premium rates are subject to underwriter approval</li>
            <li>Policy will be issued upon receipt of required documents and premium payment</li>
            <li>Coverage is subject to policy terms, conditions, and exclusions</li>
            <li>Claims must be reported within 30 days of occurrence</li>
            <li>Premium rates may vary based on final risk assessment</li>
        </ul>
        
        <h4 style="color: #D5222B;">Required Documents:</h4>
        <ul>
            ${this.getRequiredDocuments(quote.insuranceType)}
        </ul>
    </div>
    `;
  }

  static getRequiredDocuments(insuranceType) {
    const docs = {
      'motor': `
        <li>Copy of National ID/Passport</li>
        <li>Copy of Driving License</li>
        <li>Vehicle Logbook/Import Documents</li>
        <li>KRA PIN Certificate</li>
        <li>Vehicle Inspection Report (if required)</li>
      `,
      'medical': `
        <li>Copy of National ID/Passport</li>
        <li>Completed Medical Questionnaire</li>
        <li>KRA PIN Certificate</li>
        <li>Proof of Income</li>
        <li>Medical Reports (if applicable)</li>
      `,
      'wiba': `
        <li>Certificate of Incorporation</li>
        <li>KRA PIN Certificate</li>
        <li>Employee Register</li>
        <li>Previous Insurance Policy (if any)</li>
        <li>Claims History Report</li>
      `,
      'lastExpense': `
        <li>Copy of National ID/Passport</li>
        <li>Completed Application Form</li>
        <li>KRA PIN Certificate</li>
        <li>Medical Questionnaire</li>
      `,
      'travel': `
        <li>Copy of Passport</li>
        <li>Travel Itinerary</li>
        <li>Visa (if applicable)</li>
        <li>Proof of Travel Booking</li>
      `,
      'personalAccident': `
        <li>Copy of National ID/Passport</li>
        <li>Completed Application Form</li>
        <li>Medical Certificate</li>
        <li>Occupation Certificate</li>
      `
    };
    
    return docs[insuranceType] || '<li>Standard insurance documents required</li>';
  }

  static getExpiryDate(createdAt) {
    const date = new Date(createdAt);
    date.setDate(date.getDate() + 30);
    return date.toLocaleDateString();
  }
}

export default PDFService;
