// Centralized Mock Data for PataBima App
// This ensures consistency across all screens

// Import centralized insurance categories
export { INSURANCE_CATEGORIES, getActiveCategories, getPopularCategories, getCategoriesByStatus } from './insuranceCategories';

export const MOCK_AGENT = {
  code: 'IA16332',
  name: 'John Kamau',
  nextPayout: '16th July, 2025',
  sales: 125000,
  production: 85000,
  commission: 15750
};

export const MOCK_POLICIES = [
  {
    id: 1,
    policyNo: 'POL-001234',
    vehicleReg: 'KCD 123A',
    category: 'Motor Vehicle',
    clientName: 'Mary Wanjiku',
    clientPhone: '+254712345678',
    premium: 45000,
    status: 'Active',
    dueDate: '2025-07-15',
    issueDate: '2024-07-15',
    expiryDate: '2025-07-15'
  },
  {
    id: 2,
    policyNo: 'POL-005678',
    vehicleReg: 'KBZ 456B',
    category: 'Motor Vehicle',
    clientName: 'Peter Ochieng',
    clientPhone: '+254723456789',
    premium: 32000,
    status: 'Active',
    dueDate: '2025-06-30',
    issueDate: '2024-06-30',
    expiryDate: '2025-06-30'
  },
  {
    id: 3,
    policyNo: 'POL-009876',
    vehicleReg: 'KCA 789C',
    category: 'Motor Vehicle',
    clientName: 'Grace Muthoni',
    clientPhone: '+254734567890',
    premium: 38000,
    status: 'Active',
    dueDate: '2025-07-20',
    issueDate: '2024-07-20',
    expiryDate: '2025-07-20'
  },
  {
    id: 4,
    policyNo: 'POL-002345',
    vehicleReg: null,
    category: 'Medical',
    clientName: 'David Kiprotich',
    clientPhone: '+254745678901',
    premium: 12500,
    status: 'Active',
    dueDate: '2025-08-01',
    issueDate: '2024-08-01',
    expiryDate: '2025-08-01'
  },
  {
    id: 5,
    policyNo: 'POL-003456',
    vehicleReg: null,
    category: 'WIBA',
    clientName: 'Sarah Nyambura',
    clientPhone: '+254756789012',
    premium: 28750,
    status: 'Active',
    dueDate: '2025-07-25',
    issueDate: '2024-07-25',
    expiryDate: '2025-07-25'
  }
];

export const MOCK_QUOTATIONS = [
  {
    id: 1,
    quoteNo: 'QT-001234',
    policyNo: 'POL-001234', // Links to policy
    vehicleReg: 'KCD 123A',
    category: 'Motor Vehicle',
    clientName: 'Mary Wanjiku',
    clientPhone: '+254712345678',
    premium: 45000,
    status: 'Converted',
    createdDate: '2024-07-10',
    validUntil: '2024-07-25',
    coverType: 'Comprehensive',
    vehicleValue: 1200000
  },
  {
    id: 2,
    quoteNo: 'QT-005678',
    policyNo: 'POL-005678', // Links to policy
    vehicleReg: 'KBZ 456B',
    category: 'Motor Vehicle',
    clientName: 'Peter Ochieng',
    clientPhone: '+254723456789',
    premium: 32000,
    status: 'Converted',
    createdDate: '2024-06-25',
    validUntil: '2024-07-10',
    coverType: 'Third Party',
    vehicleValue: 800000
  },
  {
    id: 3,
    quoteNo: 'QT-009876',
    policyNo: 'POL-009876', // Links to policy
    vehicleReg: 'KCA 789C',
    category: 'Motor Vehicle',
    clientName: 'Grace Muthoni',
    clientPhone: '+254734567890',
    premium: 38000,
    status: 'Converted',
    createdDate: '2024-07-15',
    validUntil: '2024-07-30',
    coverType: 'Comprehensive',
    vehicleValue: 950000
  },
  {
    id: 4,
    quoteNo: 'QT-112233',
    policyNo: null,
    vehicleReg: 'KDB 321D',
    category: 'Motor Vehicle',
    clientName: 'James Mwangi',
    clientPhone: '+254767890123',
    premium: 42000,
    status: 'Pending',
    createdDate: '2025-07-12',
    validUntil: '2025-07-27',
    coverType: 'Comprehensive',
    vehicleValue: 1100000
  },
  {
    id: 5,
    quoteNo: 'QT-445566',
    policyNo: null,
    vehicleReg: 'KCB 654E',
    category: 'Motor Vehicle',
    clientName: 'Alice Wanjiru',
    clientPhone: '+254778901234',
    premium: 29000,
    status: 'Pending',
    createdDate: '2025-07-14',
    validUntil: '2025-07-29',
    coverType: 'Third Party',
    vehicleValue: 700000
  },
  {
    id: 6,
    quoteNo: 'QT-778899',
    policyNo: null,
    vehicleReg: null,
    category: 'Medical',
    clientName: 'Robert Kimani',
    clientPhone: '+254789012345',
    premium: 15000,
    status: 'Pending',
    createdDate: '2025-07-13',
    validUntil: '2025-07-28',
    coverType: 'Individual',
    vehicleValue: null
  },
  {
    id: 7,
    quoteNo: 'QT-001122',
    policyNo: null,
    vehicleReg: null,
    category: 'WIBA',
    clientName: 'Lucy Akinyi',
    clientPhone: '+254790123456',
    premium: 31000,
    status: 'Pending',
    createdDate: '2025-07-11',
    validUntil: '2025-07-26',
    coverType: 'Standard',
    vehicleValue: null
  },
  {
    id: 8,
    quoteNo: 'QT-334455',
    policyNo: null,
    vehicleReg: 'KCC 987F',
    category: 'Motor Vehicle',
    clientName: 'Michael Otieno',
    clientPhone: '+254701234567',
    premium: 36000,
    status: 'Expired',
    createdDate: '2025-06-20',
    validUntil: '2025-07-05',
    coverType: 'Comprehensive',
    vehicleValue: 900000
  }
];

export const MOCK_RENEWALS = [
  {
    id: 1,
    policyNo: 'POL-001234',
    vehicleReg: 'KCD 123A',
    clientName: 'Mary Wanjiku',
    status: 'Due Soon',
    dueDate: '2025-07-15',
    premium: 45000,
    category: 'Motor Vehicle'
  },
  {
    id: 2,
    policyNo: 'POL-005678',
    vehicleReg: 'KBZ 456B',
    clientName: 'Peter Ochieng',
    status: 'Overdue',
    dueDate: '2025-06-30',
    premium: 32000,
    category: 'Motor Vehicle'
  },
  {
    id: 3,
    policyNo: 'POL-009876',
    vehicleReg: 'KCA 789C',
    clientName: 'Grace Muthoni',
    status: 'Due Soon',
    dueDate: '2025-07-20',
    premium: 38000,
    category: 'Motor Vehicle'
  }
];

export const MOCK_EXTENSIONS = [
  {
    id: 1,
    policyNo: 'POL-001234',
    vehicleReg: 'KCD 123A',
    clientName: 'Mary Wanjiku',
    status: 'Extension Due',
    dueDate: '2025-07-18',
    extensionPeriod: '3 months',
    reason: 'Awaiting vehicle inspection',
    category: 'Motor Vehicle'
  },
  {
    id: 2,
    policyNo: 'POL-005678',
    vehicleReg: 'KBZ 456B',
    clientName: 'Peter Ochieng',
    status: 'Extension Due',
    dueDate: '2025-07-20',
    extensionPeriod: '1 month',
    reason: 'Pending documentation',
    category: 'Motor Vehicle'
  }
];

export const MOCK_CLAIMS = [
  {
    id: 1,
    category: 'Vehicle',
    policyNo: 'POL-001234',
    vehicleReg: 'KCD 123A',
    clientName: 'Mary Wanjiku',
    status: 'Processed',
    amount: 'KES 45,000',
    claimNo: 'CLM-001234',
    claimDate: '2025-06-28',
    submissionDate: '2025-06-28',
    description: 'Vehicle accident claim - Front bumper damage due to collision at parking lot. Minor scratches and dents observed.',
    documents: ['Police Report', 'Vehicle Registration', 'Photos of Damage', 'Repair Estimate']
  },
  {
    id: 2,
    category: 'Medical',
    policyNo: 'POL-002345',
    vehicleReg: null,
    clientName: 'David Kiprotich',
    status: 'Pending',
    amount: 'KES 12,500',
    claimNo: 'CLM-002345',
    claimDate: '2025-07-01',
    submissionDate: '2025-07-01',
    description: 'Medical claim for outpatient treatment - Consultation and medication for respiratory infection.',
    documents: ['Medical Report', 'Prescription', 'Hospital Receipt']
  },
  {
    id: 3,
    category: 'WIBA',
    policyNo: 'POL-003456',
    vehicleReg: null,
    clientName: 'Sarah Nyambura',
    status: 'Processed',
    amount: 'KES 28,750',
    claimNo: 'CLM-003456',
    claimDate: '2025-06-25',
    submissionDate: '2025-06-25',
    description: 'Work injury claim - Slip and fall incident at workplace resulting in minor injury requiring physiotherapy.',
    documents: ['Incident Report', 'Medical Certificate', 'Physiotherapy Report', 'Employer Statement']
  },
  {
    id: 4,
    category: 'Vehicle',
    policyNo: 'POL-005678',
    vehicleReg: 'KBZ 456B',
    clientName: 'Peter Ochieng',
    status: 'Pending',
    amount: 'KES 67,200',
    claimNo: 'CLM-004567',
    claimDate: '2025-07-03',
    submissionDate: '2025-07-03',
    description: 'Vehicle theft claim - Complete vehicle theft from secured parking area. Police report filed and case under investigation.',
    documents: ['Police Report', 'Vehicle Registration', 'Insurance Certificate', 'Key Replacement Report']
  }
];

// Helper functions for data consistency
export const formatCurrency = (amount) => {
  return `KES ${amount.toLocaleString()}`;
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};

export const getStatusColor = (status) => {
  const statusColors = {
    'Active': '#10B981',
    'Pending': '#F59E0B',
    'Overdue': '#EF4444',
    'Due Soon': '#F59E0B',
    'Processed': '#10B981',
    'Extension Due': '#F59E0B',
    'Converted': '#10B981',
    'Expired': '#6B7280'
  };
  return statusColors[status] || '#6B7280';
};
