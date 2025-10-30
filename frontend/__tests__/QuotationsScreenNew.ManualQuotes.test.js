import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import QuotationsScreenNew from '../screens/main/QuotationsScreenNew';
import djangoAPI from '../services/DjangoAPIService';

// Mock the Django API service
jest.mock('../services/DjangoAPIService', () => ({
  initialize: jest.fn(),
  getAllUserQuotes: jest.fn(),
  listManualQuotes: jest.fn(),
  deleteGenericQuote: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

// Mock other dependencies
jest.mock('../shared/services', () => ({
  QuoteStorageService: {
    getAllQuotes: jest.fn(),
  },
}));

jest.mock('../constants/insuranceCatalog', () => ({
  getCategoryLabel: jest.fn((category) => category),
  getProductLabel: jest.fn((product) => product),
}));

// Test Navigation Wrapper
const TestNavigationWrapper = ({ children }) => (
  <NavigationContainer>
    {children}
  </NavigationContainer>
);

describe('QuotationsScreenNew - Manual Quotes Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.getItem.mockResolvedValue(null);
    djangoAPI.initialize.mockResolvedValue();
  });

  const mockManualQuotes = [
    {
      id: 1,
      reference: 'MNL-MEDICAL-ABC123',
      line_key: 'MEDICAL',
      status: 'PENDING_ADMIN_REVIEW',
      created_at: '2025-01-01T10:00:00Z',
      updated_at: '2025-01-01T10:00:00Z',
      payload: {
        client_name: 'John Doe',
        age: 35,
        inpatient_limit: 500000,
        outpatient_cover: true,
        maternity_cover: true,
      },
      preferred_underwriters: ['MADISON', 'BRITAM'],
      computed_premium: null,
      levies_breakdown: null,
      admin_notes: '',
    },
    {
      id: 2,
      reference: 'MNL-TRAVEL-DEF456',
      line_key: 'TRAVEL',
      status: 'IN_PROGRESS',
      created_at: '2025-01-01T11:00:00Z',
      updated_at: '2025-01-01T12:00:00Z',
      payload: {
        client_name: 'Jane Smith',
        destination: 'United States',
        departure_date: '2025-12-01',
        return_date: '2025-12-15',
      },
      preferred_underwriters: ['AIG'],
      computed_premium: null,
      levies_breakdown: null,
      admin_notes: 'Under review',
    },
    {
      id: 3,
      reference: 'MNL-MEDICAL-GHI789',
      line_key: 'MEDICAL',
      status: 'COMPLETED',
      created_at: '2025-01-01T09:00:00Z',
      updated_at: '2025-01-01T15:00:00Z',
      payload: {
        client_name: 'Bob Johnson',
        age: 42,
        inpatient_limit: 1000000,
      },
      preferred_underwriters: ['JUBILEE'],
      computed_premium: '75000.00',
      levies_breakdown: {
        itl: '187.50',
        pcf: '187.50',
        stamp_duty: '40.00',
      },
      admin_notes: 'Premium calculated and approved',
    },
  ];

  test('renders manual quotes with correct status badges', async () => {
    djangoAPI.getAllUserQuotes.mockResolvedValue([]);
    djangoAPI.listManualQuotes.mockResolvedValue(mockManualQuotes);

    render(
      <TestNavigationWrapper>
        <QuotationsScreenNew />
      </TestNavigationWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('MNL-MEDICAL-ABC123')).toBeTruthy();
      expect(screen.getByText('MNL-TRAVEL-DEF456')).toBeTruthy();
      expect(screen.getByText('MNL-MEDICAL-GHI789')).toBeTruthy();
    });

    // Verify status text display
    expect(screen.getByText(/Pending Admin Review/)).toBeTruthy();
    expect(screen.getByText(/Admin Processing/)).toBeTruthy();
    expect(screen.getByText(/Pricing Complete/)).toBeTruthy();
  });

  test('filters manual quotes by category correctly', async () => {
    djangoAPI.getAllUserQuotes.mockResolvedValue([]);
    djangoAPI.listManualQuotes.mockResolvedValue(mockManualQuotes);

    render(
      <TestNavigationWrapper>
        <QuotationsScreenNew />
      </TestNavigationWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('MNL-MEDICAL-ABC123')).toBeTruthy();
    });

    // Test Medical filter
    const medicalFilter = screen.getByText('Medical');
    fireEvent.press(medicalFilter);

    await waitFor(() => {
      expect(screen.getByText('MNL-MEDICAL-ABC123')).toBeTruthy();
      expect(screen.getByText('MNL-MEDICAL-GHI789')).toBeTruthy();
      expect(screen.queryByText('MNL-TRAVEL-DEF456')).toBeFalsy();
    });

    // Test Travel filter
    const travelFilter = screen.getByText('Travel');
    fireEvent.press(travelFilter);

    await waitFor(() => {
      expect(screen.getByText('MNL-TRAVEL-DEF456')).toBeTruthy();
      expect(screen.queryByText('MNL-MEDICAL-ABC123')).toBeFalsy();
      expect(screen.queryByText('MNL-MEDICAL-GHI789')).toBeFalsy();
    });
  });

  test('displays premium information for completed quotes', async () => {
    djangoAPI.getAllUserQuotes.mockResolvedValue([]);
    djangoAPI.listManualQuotes.mockResolvedValue(mockManualQuotes);

    render(
      <TestNavigationWrapper>
        <QuotationsScreenNew />
      </TestNavigationWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('MNL-MEDICAL-GHI789')).toBeTruthy();
    });

    // Expand the completed quote to see premium details
    const completedQuote = screen.getByText('MNL-MEDICAL-GHI789');
    fireEvent.press(completedQuote);

    await waitFor(() => {
      expect(screen.getByText(/KSh 75,000/)).toBeTruthy(); // Premium amount
    });
  });

  test('handles different manual quote statuses correctly', async () => {
    const statusTestQuotes = [
      {
        ...mockManualQuotes[0],
        status: 'PENDING_ADMIN_REVIEW',
        reference: 'MNL-TEST-PENDING',
      },
      {
        ...mockManualQuotes[1],
        status: 'IN_PROGRESS',
        reference: 'MNL-TEST-PROGRESS',
      },
      {
        ...mockManualQuotes[2],
        status: 'COMPLETED',
        reference: 'MNL-TEST-COMPLETED',
      },
      {
        ...mockManualQuotes[0],
        status: 'REJECTED',
        reference: 'MNL-TEST-REJECTED',
      },
    ];

    djangoAPI.getAllUserQuotes.mockResolvedValue([]);
    djangoAPI.listManualQuotes.mockResolvedValue(statusTestQuotes);

    render(
      <TestNavigationWrapper>
        <QuotationsScreenNew />
      </TestNavigationWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('MNL-TEST-PENDING')).toBeTruthy();
      expect(screen.getByText('MNL-TEST-PROGRESS')).toBeTruthy();
      expect(screen.getByText('MNL-TEST-COMPLETED')).toBeTruthy();
      expect(screen.getByText('MNL-TEST-REJECTED')).toBeTruthy();
    });

    // Verify status text
    expect(screen.getByText(/Pending Admin Review/)).toBeTruthy();
    expect(screen.getByText(/Admin Processing/)).toBeTruthy();
    expect(screen.getByText(/Pricing Complete/)).toBeTruthy();
    expect(screen.getByText(/Quote Rejected/)).toBeTruthy();
  });

  test('integrates manual quotes with legacy quotes correctly', async () => {
    const legacyQuotes = [
      {
        id: 'legacy-001',
        quote_number: 'QUO123456',
        insurance_type: 'MOTOR_PRIVATE',
        status: 'DRAFT',
        date_created: '2025-01-01T08:00:00Z',
        motor_details: {
          vehicle_make: 'Toyota',
          vehicle_model: 'Corolla',
          vehicle_year: 2020,
          cover_type: 'COMPREHENSIVE',
        },
        base_premium: 25000,
        total_premium: 26000,
      },
    ];

    djangoAPI.getAllUserQuotes.mockResolvedValue(legacyQuotes);
    djangoAPI.listManualQuotes.mockResolvedValue(mockManualQuotes.slice(0, 1));

    render(
      <TestNavigationWrapper>
        <QuotationsScreenNew />
      </TestNavigationWrapper>
    );

    await waitFor(() => {
      // Should see both legacy and manual quotes
      expect(screen.getByText('QUO123456')).toBeTruthy(); // Legacy quote
      expect(screen.getByText('MNL-MEDICAL-ABC123')).toBeTruthy(); // Manual quote
    });
  });

  test('handles API errors gracefully', async () => {
    djangoAPI.getAllUserQuotes.mockRejectedValue(new Error('Network error'));
    djangoAPI.listManualQuotes.mockRejectedValue(new Error('API error'));

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    render(
      <TestNavigationWrapper>
        <QuotationsScreenNew />
      </TestNavigationWrapper>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Manual quotes fetch failed'),
        expect.any(String)
      );
    });

    consoleSpy.mockRestore();
  });

  test('searches manual quotes correctly', async () => {
    djangoAPI.getAllUserQuotes.mockResolvedValue([]);
    djangoAPI.listManualQuotes.mockResolvedValue(mockManualQuotes);

    render(
      <TestNavigationWrapper>
        <QuotationsScreenNew />
      </TestNavigationWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('MNL-MEDICAL-ABC123')).toBeTruthy();
    });

    // Test search by client name
    const searchInput = screen.getByPlaceholderText(/Search quotes/);
    fireEvent.changeText(searchInput, 'John Doe');

    await waitFor(() => {
      expect(screen.getByText('MNL-MEDICAL-ABC123')).toBeTruthy();
      expect(screen.queryByText('MNL-TRAVEL-DEF456')).toBeFalsy();
      expect(screen.queryByText('MNL-MEDICAL-GHI789')).toBeFalsy();
    });

    // Test search by reference
    fireEvent.changeText(searchInput, 'DEF456');

    await waitFor(() => {
      expect(screen.getByText('MNL-TRAVEL-DEF456')).toBeTruthy();
      expect(screen.queryByText('MNL-MEDICAL-ABC123')).toBeFalsy();
    });
  });

  test('handles quote expansion for manual quotes', async () => {
    djangoAPI.getAllUserQuotes.mockResolvedValue([]);
    djangoAPI.listManualQuotes.mockResolvedValue([mockManualQuotes[2]]); // Completed quote with premium

    render(
      <TestNavigationWrapper>
        <QuotationsScreenNew />
      </TestNavigationWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('MNL-MEDICAL-GHI789')).toBeTruthy();
    });

    // Tap to expand the quote
    const quoteCard = screen.getByText('MNL-MEDICAL-GHI789');
    fireEvent.press(quoteCard);

    await waitFor(() => {
      // Should show expanded details
      expect(screen.getByText(/Premium calculated and approved/)).toBeTruthy();
      expect(screen.getByText(/KSh 75,000/)).toBeTruthy();
    });
  });

  test('handles all supported manual quote line types', async () => {
    const allLineTypeQuotes = [
      { ...mockManualQuotes[0], line_key: 'MEDICAL', reference: 'MNL-MEDICAL-001' },
      { ...mockManualQuotes[1], line_key: 'TRAVEL', reference: 'MNL-TRAVEL-001' },
      { ...mockManualQuotes[0], line_key: 'LAST_EXPENSE', reference: 'MNL-LASTEXP-001' },
      { ...mockManualQuotes[0], line_key: 'WIBA', reference: 'MNL-WIBA-001' },
      { ...mockManualQuotes[0], line_key: 'PERSONAL_ACCIDENT', reference: 'MNL-PA-001' },
    ];

    djangoAPI.getAllUserQuotes.mockResolvedValue([]);
    djangoAPI.listManualQuotes.mockResolvedValue(allLineTypeQuotes);

    render(
      <TestNavigationWrapper>
        <QuotationsScreenNew />
      </TestNavigationWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('MNL-MEDICAL-001')).toBeTruthy();
      expect(screen.getByText('MNL-TRAVEL-001')).toBeTruthy();
      expect(screen.getByText('MNL-LASTEXP-001')).toBeTruthy();
      expect(screen.getByText('MNL-WIBA-001')).toBeTruthy();
      expect(screen.getByText('MNL-PA-001')).toBeTruthy();
    });

    // Test each filter
    const filters = ['Medical', 'Travel', 'Last Expense', 'WIBA', 'Personal Accident'];
    
    for (const filter of filters) {
      const filterButton = screen.getByText(filter);
      fireEvent.press(filterButton);
      
      await waitFor(() => {
        const expectedQuotes = allLineTypeQuotes.filter(q => {
          if (filter === 'Medical') return q.line_key === 'MEDICAL';
          if (filter === 'Travel') return q.line_key === 'TRAVEL';
          if (filter === 'Last Expense') return q.line_key === 'LAST_EXPENSE';
          if (filter === 'WIBA') return q.line_key === 'WIBA';
          if (filter === 'Personal Accident') return q.line_key === 'PERSONAL_ACCIDENT';
          return false;
        });
        
        expect(expectedQuotes.length).toBeGreaterThan(0);
      });
    }
  });
});

// Integration test for the complete workflow
describe('Manual Quotes End-to-End Workflow', () => {
  test('complete workflow from submission to display', async () => {
    // Mock the complete workflow
    const submissionResponse = {
      reference: 'MNL-MEDICAL-WORKFLOW',
      line_key: 'MEDICAL',
      status: 'PENDING_ADMIN_REVIEW',
      created_at: new Date().toISOString(),
    };

    const quotesAfterSubmission = [
      {
        ...submissionResponse,
        id: 1,
        payload: {
          client_name: 'Workflow Test User',
          age: 30,
          inpatient_limit: 500000,
        },
        preferred_underwriters: ['MADISON'],
        computed_premium: null,
        levies_breakdown: null,
        admin_notes: '',
      },
    ];

    djangoAPI.getAllUserQuotes.mockResolvedValue([]);
    djangoAPI.listManualQuotes.mockResolvedValue(quotesAfterSubmission);

    render(
      <TestNavigationWrapper>
        <QuotationsScreenNew />
      </TestNavigationWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('MNL-MEDICAL-WORKFLOW')).toBeTruthy();
      expect(screen.getByText(/Pending Admin Review/)).toBeTruthy();
    });

    // Simulate admin processing
    const updatedQuotes = [
      {
        ...quotesAfterSubmission[0],
        status: 'COMPLETED',
        computed_premium: '45000.00',
        levies_breakdown: {
          itl: '112.50',
          pcf: '112.50',
          stamp_duty: '40.00',
        },
        admin_notes: 'Processed successfully',
      },
    ];

    djangoAPI.listManualQuotes.mockResolvedValue(updatedQuotes);

    // Trigger refresh
    const refreshControl = screen.getByTestId('refresh-control');
    fireEvent(refreshControl, 'refresh');

    await waitFor(() => {
      expect(screen.getByText(/Pricing Complete/)).toBeTruthy();
    });
  });
});