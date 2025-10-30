/**
 * Enhanced Services with Django Backend Integration
 * 
 * Replaces simulation services with real Django API calls when available
 */

// Import Django API service
import djangoAPI from '../../../services/DjangoAPIService';

class EnhancedServices {
  constructor() {
    this.useSimulation = false; // Try Django first, fallback to simulation
    this.initializeServices();
  }

  async initializeServices() {
    try {
      await djangoAPI.initialize();
      // Force Django backend usage if we have a token
      this.useSimulation = !djangoAPI.isAuthenticated();
      console.log(`Services initialized - Using ${this.useSimulation ? 'simulation' : 'Django backend'}`);
      console.log(`Authentication status: ${djangoAPI.isAuthenticated() ? 'authenticated' : 'not authenticated'}`);
      console.log(`Token available: ${!!djangoAPI.token ? 'YES' : 'NO'}`);
    } catch (error) {
      console.error('Failed to initialize services, falling back to simulation:', error);
      this.useSimulation = true;
    }
  }

  // Premium Calculation Service Integration
  UnderwriterService = {
    calculatePremium: async (formData) => {
      const usingSim = this.useSimulation || !djangoAPI.isAuthenticated();
      if (usingSim) {
        return this.simulatePremiumCalculation(formData);
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
        console.error('Django TOR premium failed, using simulation:', error?.message || error);
        return this.simulatePremiumCalculation(formData);
      }
    },

    getUnderwriters: async (insuranceType) => {
      const usingSim = this.useSimulation || !djangoAPI.isAuthenticated();
      if (usingSim) {
        return this.simulateUnderwritersList(insuranceType);
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
        console.error('Django underwriters failed, using simulation:', error?.message || error);
        return this.simulateUnderwritersList(insuranceType);
      }
    },
  };

  // Motor Insurance Form Submission
  async submitMotorInsuranceForm(formData, serviceData = {}) {
    // Always use simulation mode for React Native app
    console.log('Submitting to simulation mode:', formData);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return {
      success: true,
      quotationId: `SIM${Date.now()}`,
      message: 'Form submitted successfully (simulation)',
      source: 'simulation',
    };
  }

  // DMVIC Service Integration
  DMVICService = {
    checkExistingPolicy: async (vehicleRegistration) => {
      if (this.useSimulation) {
        return this.simulateDMVICPolicyCheck(vehicleRegistration);
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
        console.error('Django DMVIC check failed, using simulation:', error);
        return this.simulateDMVICPolicyCheck(vehicleRegistration);
      }
    },

    getVehicleDetails: async (vehicleRegistration) => {
      if (this.useSimulation) {
        return this.simulateDMVICVehicleDetails(vehicleRegistration);
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
        console.error('Django vehicle details check failed, using simulation:', error);
        return this.simulateDMVICVehicleDetails(vehicleRegistration);
      }
    },
  };

  // Textract Service Integration
  TextractService = {
    extractDocumentData: async (file, documentType) => {
      if (this.useSimulation) {
        return this.simulateTextractExtraction(file, documentType);
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
        console.error('Django Textract processing failed, using simulation:', error);
        return this.simulateTextractExtraction(file, documentType);
      }
    },

    validateExtractedData: async (extractedData, formData) => {
      if (this.useSimulation) {
        return this.simulateTextractValidation(extractedData, formData);
      }

      try {
        const response = await djangoAPI.makeRequest('/api/v1/services/textract/validate/', {
          method: 'POST',
          body: JSON.stringify({
            extracted_data: extractedData,
            form_data: formData,
            validation_rules: {
              name_similarity_threshold: 85,
              required_fields: ['owner_name', 'vehicle_registration'],
            },
          }),
        });

        return {
          valid: response.is_valid,
          confidence: response.validation_confidence,
          issues: response.validation_issues || [],
          suggestions: response.suggestions || [],
          source: 'django_validation',
        };
      } catch (error) {
        console.error('Django validation failed, using simulation:', error);
        return this.simulateTextractValidation(extractedData, formData);
      }
    },
  };

  // (Removed duplicate UnderwriterService definition by merging into the version above)

  // Simulation methods (fallback when Django API is not available)
  simulateDMVICPolicyCheck = async (vehicleRegistration) => {
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    const hasExisting = Math.random() > 0.7;
    return {
      success: true,
      hasExisting,
      policy: hasExisting ? {
        policyNumber: `POL${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        insurer: ['APA Insurance', 'Jubilee Insurance', 'ICEA LION'][Math.floor(Math.random() * 3)],
        expiryDate: '2025-12-15',
        status: 'active',
      } : null,
      processingTime: 1200,
      source: 'simulation',
    };
  };

  simulateDMVICVehicleDetails = async (vehicleRegistration) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const makes = ['Toyota', 'Nissan', 'Mitsubishi', 'Isuzu', 'Mazda'];
    const models = ['Hilux', 'Hardbody', 'Canter', 'Demio', 'Probox'];
    
    return {
      success: true,
      data: {
        registration: vehicleRegistration,
        make: makes[Math.floor(Math.random() * makes.length)],
        model: models[Math.floor(Math.random() * models.length)],
        year: 2015 + Math.floor(Math.random() * 9),
        ownerName: 'John Doe',
        chassisNumber: `CH${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      },
      confidence: 95,
      source: 'simulation',
    };
  };

  simulateTextractExtraction = async (file, documentType) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const extractedData = {
      logbook: {
        owner_name: 'John Doe',
        vehicle_registration: 'KCA 123A',
        vehicle_make: 'Toyota',
        vehicle_model: 'Hilux',
        chassis_number: 'CH123456789',
      },
      nationalId: {
        name: 'John Doe',
        id_number: '12345678',
        date_of_birth: '1990-01-01',
      },
      kraPin: {
        name: 'John Doe',
        kra_pin: 'A123456789P',
      },
    };

    return {
      success: true,
      data: extractedData[documentType] || {},
      confidence: 88,
      processingTime: 2000,
      source: 'simulation',
    };
  };

  simulateTextractValidation = async (extractedData, formData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const issues = [];
    if (extractedData.owner_name !== formData.owner_name) {
      issues.push('Name mismatch between document and form');
    }
    
    return {
      valid: issues.length === 0,
      confidence: 92,
      issues,
      suggestions: issues.length > 0 ? ['Please verify the name spelling'] : [],
      source: 'simulation',
    };
  };

  simulatePremiumCalculation = async (formData) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const basePremium = 3000 + Math.floor(Math.random() * 2000);
    const trainingLevy = Math.floor(basePremium * 0.002);
    const pcfLevy = Math.floor(basePremium * 0.002);
    const stampDuty = 40;
    const totalPremium = basePremium + trainingLevy + pcfLevy + stampDuty;

    return {
      success: true,
      data: {
        basePremium,
        trainingLevy,
        pcfLevy,
        stampDuty,
        totalPremium,
        breakdown: [
          { label: 'Base Premium', amount: basePremium },
          { label: 'Training Levy', amount: trainingLevy },
          { label: 'PCF Levy', amount: pcfLevy },
          { label: 'Stamp Duty', amount: stampDuty },
        ],
        underwriter: 'APA Insurance',
      },
      confidence: 95,
      source: 'simulation',
    };
  };

  simulateUnderwritersList = async (insuranceType) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      success: true,
      underwriters: [
        { id: 1, name: 'APA Insurance', basePremium: 3500, rating: 4.5, features: ['Fast Claims', '24/7 Support'] },
        { id: 2, name: 'Jubilee Insurance', basePremium: 3200, rating: 4.3, features: ['Roadside Assistance'] },
        { id: 3, name: 'ICEA LION', basePremium: 3800, rating: 4.7, features: ['Premium Service', 'Mobile Claims'] },
      ],
      source: 'simulation',
    };
  };

  // Switch between Django and simulation modes
  setSimulationMode(useSimulation) {
    this.useSimulation = useSimulation;
    console.log(`Services switched to ${useSimulation ? 'simulation' : 'Django backend'} mode`);
  }

  isUsingDjango() {
    return !this.useSimulation && djangoAPI.isAuthenticated();
  }
}

// Create singleton instance
const enhancedServices = new EnhancedServices();

export default enhancedServices;