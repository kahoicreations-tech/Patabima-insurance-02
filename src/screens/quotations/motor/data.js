/**
 * Data for motor insurance quotation
 * @deprecated Use centralized data from src/data/motorCategories.js instead
 */

import { ENHANCED_VEHICLE_CATEGORIES } from '../../../data/motorCategories';

// Vehicle Categories (Step 1) - Now imported from centralized data
export const vehicleCategories = ENHANCED_VEHICLE_CATEGORIES.map(category => ({
  id: category.id,
  name: category.shortName || category.name,
  icon: category.icon,
  description: category.description,
  animation: category.animation
}));

// Insurance Products by Category (Step 2)
export const insuranceProducts = {
  private: {
    thirdParty: [
      { id: 'tor_private', name: 'TOR For Private', icon: '⚡', baseRate: 3.5 },
      { id: 'private_third_party', name: 'Private Third-Party', icon: '🚗', baseRate: 3.0 },
      { id: 'private_third_party_ext', name: 'Private Third-Party Extendible', icon: '🚗', baseRate: 3.2 },
      { id: 'private_motorcycle_third', name: 'Private Motorcycle Third-Party', icon: '🏍️', baseRate: 2.8 }
    ],
    comprehensive: [
      { id: 'private_comprehensive', name: 'Private Comprehensive', icon: '🛡️', baseRate: 5.0 }
    ]
  },
  commercial: {
    thirdParty: [
      { id: 'commercial_third_party', name: 'Commercial Third-Party', icon: '🚚', baseRate: 4.5 },
      { id: 'commercial_ext', name: 'Commercial Extendible', icon: '🚚', baseRate: 4.8 }
    ],
    comprehensive: [
      { id: 'commercial_comprehensive', name: 'Commercial Comprehensive', icon: '🛡️', baseRate: 6.0 }
    ]
  },
  psv: {
    thirdParty: [
      { id: 'psv_third_party', name: 'PSV Third-Party', icon: '🚌', baseRate: 6.0 },
      { id: 'matatu_cover', name: 'Matatu Cover', icon: '🚐', baseRate: 6.5 }
    ],
    comprehensive: [
      { id: 'psv_comprehensive', name: 'PSV Comprehensive', icon: '🛡️', baseRate: 8.0 }
    ]
  },
  motorcycle: {
    thirdParty: [
      { id: 'motorcycle_third_party', name: 'Motorcycle Third-Party', icon: '🏍️', baseRate: 2.8 },
      { id: 'boda_boda_cover', name: 'Boda Boda Cover', icon: '🏍️', baseRate: 4.5 }
    ],
    comprehensive: [
      { id: 'motorcycle_comprehensive', name: 'Motorcycle Comprehensive', icon: '🛡️', baseRate: 4.0 }
    ]
  },
  tuktuk: {
    thirdParty: [
      { id: 'tuktuk_third_party', name: 'TukTuk Third-Party', icon: '🛺', baseRate: 3.5 }
    ],
    comprehensive: [
      { id: 'tuktuk_comprehensive', name: 'TukTuk Comprehensive', icon: '🛡️', baseRate: 5.0 }
    ]
  },
  special: {
    thirdParty: [
      { id: 'tractor_third_party', name: 'Tractor Third-Party', icon: '🚜', baseRate: 3.0 },
      { id: 'heavy_machinery', name: 'Heavy Machinery', icon: '🏗️', baseRate: 5.5 }
    ],
    comprehensive: [
      { id: 'special_comprehensive', name: 'Special Comprehensive', icon: '🛡️', baseRate: 6.5 }
    ]
  }
};
