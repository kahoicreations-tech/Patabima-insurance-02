// Curated list of common vehicle makes and models for Kenya
// Keep lightweight; expand as needed. Used for dropdowns in Motor 2 forms.

export const VEHICLE_MAKES = [
  'Toyota',
  'Nissan',
  'Honda',
  'Mazda',
  'Subaru',
  'Mitsubishi',
  'Mercedes',
  'BMW',
  'Volkswagen',
  'Audi',
  'Isuzu',
  'Hino',
  'Suzuki',
  'Ford',
  'Chevrolet',
];

export const VEHICLE_MODELS = {
  Toyota: [
    'Corolla', 'Axio', 'Premio', 'Vitz', 'RAV4', 'Prado', 'Hilux', 'Noah', 'Harrier', 'Land Cruiser',
  ],
  Nissan: [
    'Note', 'X-Trail', 'Juke', 'Patrol', 'Navara', 'Teana', 'Tiida',
  ],
  Honda: [
    'Fit', 'Vezel', 'CR-V', 'Accord', 'Civic', 'StepWGN',
  ],
  Mazda: [
    'Demio', 'Axela', 'CX-5', 'Atenza', 'CX-3', 'CX-9',
  ],
  Subaru: [
    'Impreza', 'Forester', 'Outback', 'Legacy', 'XV',
  ],
  Mitsubishi: [
    'Outlander', 'Pajero', 'Lancer', 'Mirage', 'ASX', 'Canter',
  ],
  Mercedes: [
    'C-Class', 'E-Class', 'GLC', 'GLE', 'S-Class',
  ],
  BMW: [
    '3 Series', '5 Series', 'X3', 'X5', '1 Series',
  ],
  Volkswagen: [
    'Golf', 'Passat', 'Tiguan', 'Polo', 'Touareg',
  ],
  Audi: [
    'A3', 'A4', 'Q5', 'Q7', 'A6',
  ],
  Isuzu: [
    'D-Max', 'N-Series', 'F-Series',
  ],
  Hino: [
    '300', '500',
  ],
  Suzuki: [
    'Swift', 'Alto', 'Vitara', 'Jimny',
  ],
  Ford: [
    'Ranger', 'Everest', 'Focus',
  ],
  Chevrolet: [
    'Trailblazer', 'Cruze',
  ],
};

export function getModelsForMake(make) {
  return VEHICLE_MODELS[make] || [];
}
