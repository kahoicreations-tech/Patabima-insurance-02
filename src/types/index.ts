// User and Authentication Types
export interface User {
  id: string;
  email: string;
  phoneNumber: string;
  agentCode: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  error?: string;
}

// Insurance Category Status Types
export type CategoryStatus = 'active' | 'maintenance' | 'coming_soon' | 'disabled';
export type CategoryType = 'motor' | 'health' | 'life' | 'general' | 'commercial';

// Enhanced Insurance Category Interface
export interface InsuranceCategory {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  image?: any; // React Native require() type
  color: string;
  type: CategoryType;
  status: CategoryStatus;
  screen?: string;
  isPopular: boolean;
  commissionRate: number;
  minimumPremium: number;
  features: string[];
  tags: string[];
}

// Legacy Insurance Category Interface (for backward compatibility)
export interface LegacyInsuranceCategory {
  id: number;
  name: string;
  icon: string;
  image?: any;
  color: string;
  screen?: string;
}

export interface PolicyDetails {
  id: string;
  policyNumber: string;
  categoryId: string;
  premiumAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'active' | 'expired' | 'pending' | 'cancelled';
  startDate: string;
  endDate: string;
  clientName: string;
  clientPhone: string;
  vehicleRegistration?: string;
  coverType?: string;
}

export interface QuotationData {
  id: string;
  categoryId: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  vehicleDetails?: VehicleDetails;
  coverageDetails: CoverageDetails;
  premiumAmount: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined' | 'expired';
  createdAt: string;
  expiresAt: string;
}

export interface VehicleDetails {
  registration: string;
  make: string;
  model: string;
  year: number;
  engineCapacity: number;
  bodyType: string;
  seatingCapacity: number;
  vehicleValue: number;
  useType: 'private' | 'commercial' | 'taxi';
}

export interface CoverageDetails {
  type: 'comprehensive' | 'third_party' | 'third_party_fire_theft';
  benefits: string[];
  excess: number;
  additionalCovers?: string[];
}

// Campaign and Promotion Types
export interface Campaign {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  targetCategories: string[];
  discountPercentage?: number;
  terms?: string;
}

// Claims Types
export interface Claim {
  id: string;
  policyId: string;
  claimNumber: string;
  category: string;
  description: string;
  amount: number;
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'paid';
  dateReported: string;
  dateResolved?: string;
  documents: ClaimDocument[];
}

export interface ClaimDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;
}

// Sales and Commission Types
export interface SalesData {
  totalSales: number;
  totalProduction: number;
  totalCommission: number;
  pendingCommission: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  periodStart: string;
  periodEnd: string;
}

export interface CommissionPayment {
  id: string;
  amount: number;
  period: string;
  paymentDate: string;
  status: 'pending' | 'paid' | 'failed';
  policies: string[];
}

// Renewal and Extension Types
export interface RenewalItem {
  id: string;
  policyId: string;
  policyNumber: string;
  clientName: string;
  vehicleRegistration?: string;
  category: string;
  expiryDate: string;
  premiumAmount: number;
  status: 'due_soon' | 'overdue' | 'renewed';
  daysUntilExpiry: number;
}

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  MainTabs: undefined;
};

export type AuthStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  Login: undefined;
  Signup: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Quotations: undefined;
  Upcoming: undefined;
  MyAccount: undefined;
};

export type MotorQuotationParamList = {
  VehicleDetails: undefined;
  ClientDetails: { vehicleData: VehicleDetails };
  CoverageSelection: { vehicleData: VehicleDetails; clientData: any };
  QuotationReview: { quotationData: QuotationData };
};

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Form Types
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'select' | 'date' | 'checkbox';
  required: boolean;
  validation?: any;
  options?: { label: string; value: any }[];
}

export interface ValidationError {
  field: string;
  message: string;
}
