/**
 * Enhanced Services with Django Backend Integration
 * 
 * Replaces simulation services with real Django API calls when available
 */

// Import Django API service
import djangoAPI from '../../../services/DjangoAPIService';

class EnhancedServices {
  constructor() {
    this.useSimulation = false;
    this.initialized = false;
    this.initializeServices();
  }

  async initializeServices() {
    try {
      await djangoAPI.initialize();
      this.initialized = true;
      console.log('Services initialized - Using Django backend');
      console.log(`Authentication status: ${djangoAPI.isAuthenticated() ? 'authenticated' : 'not authenticated'}`);
      console.log(`Token available: ${!!djangoAPI.token ? 'YES' : 'NO'}`);
    } catch (error) {
      this.initialized = false;
      console.error('Failed to initialize services:', error);
    }
  }

  // Premium Calculation Service Integration
  UnderwriterService = {
    calculatePremium: async (formData) => {
      if (!djangoAPI.isAuthenticated()) {
        return { success: false, error: 'Not authenticated', source: 'django_pricing' };
      }

      const providerToCode = (name) => {
        if (!name) return null;
        const map = {
          'APA Insurance': 'APA',
          'Jubilee Insurance': 'JUB',
          'CIC Insurance': 'CIC',
          'Britam': 'BRITAM',
          'ICEA LION': 'ICEA',
          'Madison Insurance': 'MAD',
          'GA Insurance': 'GA',
          'Takaful Insurance': 'TAKA',
          'Kenindia Assurance': 'KENINDIA',
          'AAR Insurance': 'AAR',
        };
        return map[name] || name.split(' ')[0].toUpperCase();
      };

      try {
        const payload = {
          subcategory_code: 'PRIVATE_TOR',
          underwriter_code: providerToCode(formData.insurance_provider) || 'APA',
          vehicle: {
            registration: formData.vehicle_registration,
            make: formData.vehicle_make,
            model: formData.vehicle_model,
            use: 'PRIVATE',
          },
          cover_days: 1,
          cover_start_date: formData.cover_start_date,
        };

        const response = await djangoAPI.calculateMotorPremium(payload);

        const base = Number(response?.base_premium ?? response?.premium ?? 0);
        const levies = response?.mandatory_levies || {};
        const trainingLevy = Number(levies.insurance_training_levy ?? response?.training_levy ?? 0);
        const pcfLevy = Number(levies.pcf_levy ?? response?.pcf_levy ?? 0);
        const stampDuty = Number(levies.stamp_duty ?? response?.stamp_duty ?? 40);
        const totalPremium = Number(
          response?.total_premium ?? (base + trainingLevy + pcfLevy + stampDuty)
        );

        return {
          success: true,
          data: {
            basePremium: base,
            trainingLevy,
            pcfLevy,
            stampDuty,
            totalPremium,
            breakdown: response?.premium_breakdown || [
              { label: 'Base Premium', amount: base },
              { label: 'Training Levy', amount: trainingLevy },
              { label: 'PCF Levy', amount: pcfLevy },
              { label: 'Stamp Duty', amount: stampDuty },
            ],
            underwriter: response?.underwriter?.company_name || formData.insurance_provider,
          },
          confidence: 95,
          source: 'django_pricing',
        };
      } catch (error) {
        console.error('Django TOR premium failed:', error?.message || error);
        return { success: false, error: error?.message || 'Pricing failed', source: 'django_pricing' };
      }
    },

    getUnderwriters: async (insuranceType) => {
      if (!djangoAPI.isAuthenticated()) {
        return { success: false, error: 'Not authenticated', source: 'django_underwriters', underwriters: [] };
      }

      try {
        const response = await djangoAPI.getUnderwriters(insuranceType);
        const list = Array.isArray(response) ? response : (response?.underwriters || response?.results || []);
        return {
          success: true,
          underwriters: list.map((u) => ({
            id: u.id || u.code || u.name,
            name: u.name || u.company_name || u.code,
            basePremium: u.base_premium,
            rating: u.rating,
            features: u.features,
          })),
          source: 'django_underwriters',
        };
      } catch (error) {
        console.error('Django underwriters failed:', error?.message || error);
        return { success: false, error: error?.message || 'Underwriters fetch failed', source: 'django_underwriters', underwriters: [] };
      }
    },
  };

  // Motor Insurance Form Submission
  async submitMotorInsuranceForm(formData, serviceData = {}) {
    throw new Error('submitMotorInsuranceForm is not supported in strict mode. Use the main quotation flow APIs.');
  }

  // DMVIC Service Integration
  DMVICService = {
    checkExistingPolicy: async (vehicleRegistration) => {
      if (!djangoAPI.isAuthenticated()) {
        return { success: false, error: 'Not authenticated', hasExisting: false, policy: null, source: 'django_dmvic' };
      }

      try {
        const response = await djangoAPI.checkDMVIC(vehicleRegistration);
        return {
          success: true,
          hasExisting: response.has_existing_policy,
          policy: response.existing_policy ? {
            policyNumber: response.existing_policy.policy_number,
            insurer: response.existing_policy.insurer,
            expiryDate: response.existing_policy.expiry_date,
            status: response.existing_policy.status,
          } : null,
          processingTime: response.processing_time || 1200,
        };
      } catch (error) {
        console.error('Django DMVIC check failed:', error);
        return { success: false, error: error?.message || 'DMVIC check failed', hasExisting: false, policy: null, source: 'django_dmvic' };
      }
    },

    getVehicleDetails: async (vehicleRegistration) => {
      if (!djangoAPI.isAuthenticated()) {
        return { success: false, error: 'Not authenticated', data: null, source: 'django_dmvic' };
      }

      try {
        const response = await djangoAPI.checkDMVIC(vehicleRegistration);
        return {
          success: response.vehicle_found,
          data: response.vehicle_details ? {
            registration: response.vehicle_details.registration,
            make: response.vehicle_details.make,
            model: response.vehicle_details.model,
            year: response.vehicle_details.year,
            ownerName: response.vehicle_details.owner_name,
            chassisNumber: response.vehicle_details.chassis_number,
          } : null,
          confidence: response.confidence || 95,
          source: 'django_dmvic',
        };
      } catch (error) {
        console.error('Django vehicle details check failed:', error);
        return { success: false, error: error?.message || 'Vehicle details check failed', data: null, source: 'django_dmvic' };
      }
    },
  };

  // Textract Service Integration
  TextractService = {
    extractDocumentData: async (file, documentType) => {
      if (!djangoAPI.isAuthenticated()) {
        return { success: false, error: 'Not authenticated', data: {}, source: 'django_textract' };
      }

      try {
        // Upload document to Django
        const uploadResponse = await djangoAPI.uploadDocument(file, documentType);
        
        // Process document with Textract
        const processResponse = await djangoAPI.processDocument(uploadResponse.upload_id);
        
        return {
          success: processResponse.success,
          data: processResponse.extracted_data,
          confidence: processResponse.confidence,
          processingTime: processResponse.processing_time,
          extractionId: processResponse.extraction_id,
          source: 'django_textract',
        };
      } catch (error) {
        console.error('Django Textract processing failed:', error);
        return { success: false, error: error?.message || 'Extraction failed', data: {}, source: 'django_textract' };
      }
    },

    validateExtractedData: async (extractedData, formData) => {
      // No backend validate endpoint currently exists; do lightweight client-side checks.
      const issues = [];
      const suggestions = [];

      const extractedOwner = extractedData?.owner_name || extractedData?.ownerName || extractedData?.name;
      const formOwner = formData?.owner_name || formData?.ownerName || formData?.name;
      if (extractedOwner && formOwner && String(extractedOwner).trim().toLowerCase() !== String(formOwner).trim().toLowerCase()) {
        issues.push('Owner name mismatch between document and form');
        suggestions.push('Confirm the owner name spelling matches the document');
      }

      const extractedReg = extractedData?.vehicle_registration || extractedData?.registration_number || extractedData?.registrationNumber;
      const formReg = formData?.vehicle_registration || formData?.registration_number || formData?.registrationNumber;
      if (extractedReg && formReg && String(extractedReg).replace(/\s+/g, '').toLowerCase() !== String(formReg).replace(/\s+/g, '').toLowerCase()) {
        issues.push('Vehicle registration mismatch between document and form');
        suggestions.push('Confirm the vehicle registration matches the logbook');
      }

      return {
        valid: issues.length === 0,
        confidence: issues.length === 0 ? 95 : 70,
        issues,
        suggestions,
        source: 'client_validation',
      };
    },
  };

  // (Removed simulation fallback methods; this service is backend-only.)

  // Switch between Django and simulation modes
  setSimulationMode(useSimulation) {
    this.useSimulation = !!useSimulation;
    console.warn(`EnhancedServices.setSimulationMode called (${this.useSimulation}). Simulation is not used by default.`);
  }

  isUsingDjango() {
    return !this.useSimulation && djangoAPI.isAuthenticated();
  }
}

// Create singleton instance
const enhancedServices = new EnhancedServices();

export default enhancedServices;