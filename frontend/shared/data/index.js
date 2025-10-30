// Minimal data shims for legacy imports. Prefer backend via InsuranceServicesAPI.
import InsuranceServicesAPI from '../../services/InsuranceServicesAPI';

export async function getVehicleCategories() {
  // Fallback static categories; can be replaced by backend call when available
  return [
    { id: 'private', title: 'Private Vehicle', icon: '🚗', color: '#D5222B' },
    { id: 'commercial', title: 'Commercial Vehicle', icon: '🚚', color: '#FF9800' },
    { id: 'motorcycle', title: 'Motorcycle', icon: '🏍️', color: '#E91E63' },
    { id: 'psv', title: 'PSV (Matatu)', icon: '🚐', color: '#9C27B0' },
  ];
}

export async function getMotorInsuranceProducts(categoryId) {
  // Backend-driven when implemented; provide simple map for now
  const map = {
    private: [
      { id: 'tor_private', title: 'TOR' },
      { id: 'third_party', title: 'Third Party' },
      { id: 'third_party_extendible', title: 'Third Party Extendible' },
      { id: 'comprehensive', title: 'Comprehensive' },
    ],
    commercial: [
      { id: 'tor_commercial', title: 'TOR' },
      { id: 'third_party', title: 'Third Party' },
      { id: 'comprehensive', title: 'Comprehensive' },
      { id: 'tuktuk_comprehensive', title: 'TukTuk Comprehensive' },
    ],
    motorcycle: [
      { id: 'third_party', title: 'Third Party' },
      { id: 'comprehensive', title: 'Comprehensive' },
    ],
    psv: [
      { id: 'third_party', title: 'Third Party' },
      { id: 'matatu_cover', title: 'Matatu Cover' },
    ],
  };
  return map[categoryId] || [];
}

export default { getVehicleCategories, getMotorInsuranceProducts };