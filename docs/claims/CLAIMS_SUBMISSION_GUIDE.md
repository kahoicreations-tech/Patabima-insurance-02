# Claims Submission Screen - Multi-Step Flow

## Overview
The Claims Submission Screen provides a comprehensive 5-step workflow for users to submit insurance claims with all necessary documentation and information.

## Features

### 📋 Multi-Step Process
1. **Policy Information** - Select and verify policy details
2. **Incident Details** - When and where the incident occurred
3. **Claim Details** - Type of claim and estimated amount
4. **Supporting Documents** - Upload necessary documentation
5. **Review & Submit** - Final review and submission

### 🔍 Key Functionality

#### Step 1: Policy Information
- Modal selector for available policies
- Auto-population of policy details
- Real-time validation
- Policy status verification

#### Step 2: Incident Details
- Date and time picker
- Location input
- Detailed description field
- Form validation

#### Step 3: Claim Details
- Dynamic claim type selector based on policy
- Estimated amount input
- Detailed claim description
- Category-specific options

#### Step 4: Supporting Documents
- Multiple document type support
- Document upload simulation
- Document management (add/remove)
- Required document validation

#### Step 5: Review & Submit
- Complete information review
- Contact preference selection
- Declaration acceptance
- Final submission

### 🎨 UI/UX Features

#### Progress Indicators
- Progress bar showing completion percentage
- Step indicator with visual feedback
- Current step highlighting

#### Navigation
- Forward/backward navigation
- Step validation before progression
- Cancel option at any step

#### Form Validation
- Real-time field validation
- Error message display
- Required field indicators

#### Modal Interfaces
- Policy selection modal
- Claim type selection modal
- Responsive design

### 🔧 Technical Implementation

#### State Management
```javascript
const [currentStep, setCurrentStep] = useState(1);
const [formData, setFormData] = useState({
  // Policy Information
  policyNumber: '',
  policyType: '',
  policyHolderName: '',
  
  // Incident Details
  incidentDate: '',
  incidentTime: '',
  incidentLocation: '',
  incidentDescription: '',
  
  // Claim Details
  claimType: '',
  claimAmount: '',
  claimDescription: '',
  
  // Supporting Documents
  documents: [],
  
  // Declaration
  declarationAccepted: false,
  contactPreference: 'phone',
  additionalComments: ''
});
```

#### Navigation Integration
- Added to HomeStack and UpcomingStack
- Accessible from ClaimsScreen via "Submit New Claim" button
- Proper navigation flow with back button support

#### Component Structure
```
ClaimsSubmissionScreen/
├── Progress Components
│   ├── Progress Bar
│   └── Step Indicator
├── Step Components
│   ├── Step 1: Policy Selection
│   ├── Step 2: Incident Details
│   ├── Step 3: Claim Details
│   ├── Step 4: Document Upload
│   └── Step 5: Review & Submit
├── Modal Components
│   ├── Policy Selection Modal
│   └── Claim Type Selection Modal
└── Navigation Components
    ├── Footer Navigation
    └── Header with Back Button
```

### 📱 User Experience

#### Responsive Design
- Optimized for mobile devices
- Touch-friendly interface
- Proper spacing and typography

#### Visual Feedback
- Loading states during submission
- Success/error messages
- Progress indication
- Step completion feedback

#### Form Usability
- Auto-focus on relevant fields
- Keyboard type optimization
- Clear error messages
- Logical tab order

### 🔐 Data Validation

#### Field Validation
- Required field checking
- Format validation (dates, amounts)
- Business rule validation
- Real-time feedback

#### Security Considerations
- Input sanitization
- File type validation
- Size limitations
- Secure data handling

### 🚀 Integration Points

#### Navigation Routes
```javascript
// From ClaimsScreen
navigation.navigate('ClaimsSubmission')

// From HomeScreen (via HomeStack)
navigation.navigate('ClaimsSubmission')

// From UpcomingScreen (via UpcomingStack)
navigation.navigate('ClaimsSubmission')
```

#### Component Dependencies
- SafeScreen wrapper
- CompactCurvedHeader with back button
- EnhancedCard for consistent styling
- StatusBadge for status indicators

### 📊 Data Flow

#### Form Data Structure
```javascript
{
  policyNumber: 'POL-001234',
  policyType: 'Motor Vehicle',
  policyHolderName: 'John Doe',
  incidentDate: '2025-07-16',
  incidentTime: '14:30',
  incidentLocation: 'Nairobi CBD',
  incidentDescription: 'Vehicle collision at intersection',
  claimType: 'Accident/Collision',
  claimAmount: '45000',
  claimDescription: 'Front bumper damage and headlight replacement',
  documents: [
    { id: 1, type: 'Police Report', name: 'police_report.pdf', size: '2.5 MB' },
    { id: 2, type: 'Photos of Damage', name: 'damage_photos.jpg', size: '1.8 MB' }
  ],
  declarationAccepted: true,
  contactPreference: 'phone',
  additionalComments: 'Urgent claim processing requested'
}
```

### 🎯 Future Enhancements

#### Planned Features
- Real-time file upload
- Photo capture integration
- GPS location integration
- Push notification updates
- PDF generation
- Email confirmation

#### Technical Improvements
- Offline form saving
- Auto-save functionality
- Enhanced validation
- Performance optimization
- Analytics integration

### 📝 Usage Instructions

#### For Users
1. Navigate to Claims screen
2. Tap "Submit New Claim" button
3. Follow the 5-step process
4. Review all information carefully
5. Accept declaration and submit

#### For Developers
1. Screen is registered in navigation
2. Uses existing component library
3. Follows app design patterns
4. Implements proper error handling
5. Includes comprehensive validation

### 🔄 Testing

#### Test Scenarios
- Complete form submission
- Step validation
- Modal interactions
- Navigation flow
- Error handling
- Data persistence

#### Validation Testing
- Required field validation
- Format validation
- Business rule validation
- Cross-step validation
- Final submission validation

---

*Created: July 16, 2025*
*Version: 1.0*
*Status: Complete and Integrated*
