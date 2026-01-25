// Centralized default add-on definitions; used as fallback when backend metadata is unavailable
export const DEFAULT_ADD_ONS = [
  {
    id: 'pll',
    name: 'Passenger Legal Liability',
    description: 'Covers legal liability for passengers in case of injury or death',
    recommended: true,
    type: 'switch',
  },
  {
    id: 'riot_strike',
    name: 'Riot & Strike Coverage',
    description: 'Protection against damage from riots, strikes, and civil commotion',
    recommended: false,
    type: 'switch',
  },
  {
    id: 'emergency_medical',
    name: 'Emergency Medical Expenses',
    description: 'Covers emergency medical treatment for driver and passengers',
    recommended: true,
    type: 'switch',
  },
  {
    id: 'windscreen',
    name: 'Windscreen Cover',
    description: 'Coverage for windscreen replacement and repair',
    type: 'amount',
    placeholder: 'Enter windscreen value',
  },
  {
    id: 'accessories',
    name: 'Radio/Accessories',
    description: 'Coverage for aftermarket accessories',
    type: 'amount',
    placeholder: 'Enter accessories value',
  }
];

// Helper to normalize backend response to client shape
export function normalizeAddOns(serverAddOns = []) {
  return (serverAddOns || []).map((a) => ({
    id: a.id || a.code || a.key,
    name: a.name || a.title,
    description: a.description || a.help || '',
    type: a.type || a.input_type || 'switch', // 'switch' | 'amount'
    placeholder: a.placeholder || '',
    recommended: Boolean(a.recommended),
    premium: typeof a.premium === 'number' ? a.premium : undefined,
    // Any additional flags can be carried through
  }));
}
