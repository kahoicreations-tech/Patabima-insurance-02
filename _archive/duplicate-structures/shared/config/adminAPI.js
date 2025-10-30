/**
 * Sample Admin API Endpoints Configuration
 * This demonstrates how the admin system would work with a backend API
 */

// Environment Configuration
export const API_CONFIG = {
  development: {
    baseUrl: 'http://localhost:3000/api',
    timeout: 10000,
  },
  staging: {
    baseUrl: 'https://staging-api.patabima.com/api',
    timeout: 15000,
  },
  production: {
    baseUrl: 'https://api.patabima.com/api',
    timeout: 20000,
  }
};

// Sample API Responses for Testing
export const SAMPLE_ADMIN_RESPONSES = {
  // GET /admin/pricing/motor-rates
  getRates: {
    version: 'admin-2025.01.20',
    effectiveDate: '2025-01-20T00:00:00.000Z',
    lastModified: '2025-01-19T15:30:00.000Z',
    modifiedBy: 'admin@patabima.com',
    underwriters: [
      {
        id: 'sanlam_commercial',
        name: 'Sanlam Commercial',
        status: 'active',
        effectiveDate: '2025-01-20',
        premiumRates: {
          comprehensive: {
            "0-5": 4.0,
            "6-10": 4.5,
            "11-15": 5.0
          },
          thirdParty: {
            "0-5": 2.0,
            "6-10": 2.5,
            "11-15": 3.0
          }
        },
        minimumPremium: {
          comprehensive: 25000,
          thirdParty: 12000
        },
        maximumVehicleAge: 15,
        maximumSumInsured: 20000000,
        specificAddOns: [
          {
            id: 'windscreen_cover',
            name: 'Windscreen Cover',
            category: 'protection',
            type: 'percentage',
            rate: 0.5,
            description: 'Covers windscreen replacement and repair',
            conditions: ['Comprehensive policy required']
          },
          {
            id: 'excess_protector',
            name: 'Excess Protector',
            category: 'protection',
            type: 'fixed',
            fixedAmount: 15000,
            description: 'Waives excess on first claim per year'
          }
        ],
        riskAssessment: {
          requiresInspection: true,
          inspectionThreshold: 2000000,
          blacklistedAreas: ['Eastleigh', 'Kibera'],
          preferredAreas: ['Karen', 'Westlands', 'Kilifi']
        }
      },
      {
        id: 'kal_insurance',
        name: 'KAL Insurance',
        status: 'active',
        effectiveDate: '2025-01-20',
        premiumRates: {
          comprehensive: {
            "0-5": 3.0,
            "6-10": 4.0,
            "11-20": 4.5
          },
          thirdParty: {
            "0-5": 1.8,
            "6-10": 2.2,
            "11-20": 2.8
          }
        },
        minimumPremium: {
          comprehensive: 22000,
          thirdParty: 10000
        },
        maximumVehicleAge: 20,
        maximumSumInsured: 15000000,
        specificAddOns: [
          {
            id: 'roadside_assistance',
            name: '24/7 Roadside Assistance',
            category: 'service',
            type: 'fixed',
            fixedAmount: 8000,
            description: 'Emergency roadside assistance nationwide'
          },
          {
            id: 'political_violence',
            name: 'Political Violence & Terrorism',
            category: 'extension',
            type: 'percentage',
            rate: 0.3,
            description: 'Coverage for political violence and terrorism'
          }
        ]
      }
      // More underwriters would be added here...
    ],
    metadata: {
      totalUnderwriters: 12,
      activeUnderwriters: 11,
      lastRateUpdate: '2025-01-19T15:30:00.000Z',
      nextScheduledUpdate: '2025-02-01T00:00:00.000Z',
      updateFrequency: 'monthly'
    }
  },

  // GET /admin/pricing/updates
  getUpdates: {
    hasUpdates: true,
    version: 'admin-2025.01.20',
    changes: [
      {
        type: 'rate_update',
        underwriter: 'sanlam_commercial',
        field: 'premiumRates.comprehensive.0-5',
        oldValue: 3.8,
        newValue: 4.0,
        effectiveDate: '2025-01-20T00:00:00.000Z',
        reason: 'Market adjustment for inflation'
      },
      {
        type: 'addon_added',
        underwriter: 'kal_insurance',
        addon: 'political_violence',
        effectiveDate: '2025-01-20T00:00:00.000Z',
        reason: 'New product offering'
      }
    ],
    downloadUrl: '/admin/pricing/download/admin-2025.01.20.json'
  },

  // POST /quotes/motor - Submit quote response
  submitQuote: {
    quoteId: 'QT-2025-001234',
    status: 'submitted',
    submittedAt: '2025-01-20T10:30:00.000Z',
    rateVersion: 'admin-2025.01.20',
    estimatedProcessingTime: '2-4 hours',
    referenceNumber: 'PB-MT-20250120-001234',
    nextSteps: [
      'Underwriter review',
      'Vehicle inspection (if required)',
      'Final approval',
      'Policy issuance'
    ]
  }
};

// Sample Admin Rate Update Payload
export const SAMPLE_RATE_UPDATE = {
  version: 'admin-2025.01.21',
  effectiveDate: '2025-01-21T00:00:00.000Z',
  modifiedBy: 'admin@patabima.com',
  changes: [
    {
      underwriterId: 'sanlam_commercial',
      updates: {
        'premiumRates.comprehensive.0-5': 4.1,
        'minimumPremium.comprehensive': 26000
      }
    },
    {
      underwriterId: 'madison_insurance',
      updates: {
        'status': 'suspended',
        'suspensionReason': 'Temporary capacity constraints'
      }
    }
  ],
  rollbackPlan: {
    enabled: true,
    previousVersion: 'admin-2025.01.20',
    rollbackDeadline: '2025-01-22T00:00:00.000Z'
  }
};

// API Client Example
export class AdminAPIClient {
  constructor(environment = 'development') {
    this.config = API_CONFIG[environment];
    this.baseUrl = this.config.baseUrl;
    this.timeout = this.config.timeout;
  }

  async get(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.token}`,
          'X-Client-Version': '1.0.0',
          ...options.headers
        },
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API GET Error:', error);
      throw error;
    }
  }

  async post(endpoint, data, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${options.token}`,
          'X-Client-Version': '1.0.0',
          ...options.headers
        },
        body: JSON.stringify(data),
        timeout: this.timeout
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API POST Error:', error);
      throw error;
    }
  }

  // Admin-specific methods
  async getRates(token) {
    return this.get('/admin/pricing/motor-rates', { token });
  }

  async getUpdates(token) {
    return this.get('/admin/pricing/updates', { token });
  }

  async submitQuote(quoteData, token) {
    return this.post('/quotes/motor', quoteData, { token });
  }

  async updateRates(rateUpdate, token) {
    return this.post('/admin/pricing/update', rateUpdate, { token });
  }
}

export default {
  API_CONFIG,
  SAMPLE_ADMIN_RESPONSES,
  SAMPLE_RATE_UPDATE,
  AdminAPIClient
};
