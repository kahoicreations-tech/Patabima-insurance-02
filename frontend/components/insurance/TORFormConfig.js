/**
 * TOR Form Configuration
 * 
 * Complete TOR insurance form configuration using the template system
 */

// TOR Form Configuration
export const TOR_FORM_CONFIG = {
  formType: 'TOR',
  title: 'TOR Insurance Quotation changes',
  steps: [
    {
      id: 'vehicle_info',
      title: 'Vehicle Information',
      description: 'Enter your vehicle details',
      stepNumber: 1,
      totalSteps: 4,
      fields: [
        {
          id: 'registration_number',
          label: 'Vehicle Registration Number',
          type: 'text',
          placeholder: 'e.g., KCA 123A',
          required: true
        },
        {
          id: 'make',
          label: 'Vehicle Make',
          type: 'select',
          options: [
            'Toyota', 'Nissan', 'Mazda', 'Honda', 'Subaru', 'Mitsubishi',
            'Volkswagen', 'Mercedes-Benz', 'BMW', 'Audi', 'Land Rover',
            'Isuzu', 'Ford', 'Hyundai', 'Kia', 'Peugeot', 'Other'
          ],
          required: true
        },
        {
          id: 'model',
          label: 'Vehicle Model',
          type: 'text',
          placeholder: 'e.g., Corolla, Vitz, Axio',
          required: true
        },
        {
          id: 'year_of_manufacture',
          label: 'Year of Manufacture',
          type: 'select',
          options: Array.from({length: 30}, (_, i) => (new Date().getFullYear() - i).toString()),
          required: true
        },
        {
          id: 'body_type',
          label: 'Body Type',
          type: 'select',
          options: ['Saloon', 'Station Wagon', 'Hatchback', 'SUV', 'Pick-up', 'Van', 'Bus', 'Truck', 'Motorcycle', 'Other'],
          required: true
        }
      ]
    },
    {
      id: 'client_info',
      title: 'Client Information',
      description: 'Enter your personal details',
      stepNumber: 2,
      totalSteps: 4,
      fields: [
        {
          id: 'client_name',
          label: 'Full Name',
          type: 'text',
          placeholder: 'Enter full name',
          required: true
        },
        {
          id: 'id_number',
          label: 'ID/Passport Number',
          type: 'text',
          placeholder: 'National ID or Passport number',
          required: true
        },
        {
          id: 'phone_number',
          label: 'Phone Number',
          type: 'phone',
          placeholder: '+254700000000',
          required: true
        },
        {
          id: 'email',
          label: 'Email Address',
          type: 'email',
          placeholder: 'example@email.com',
          required: true
        },
        {
          id: 'postal_address',
          label: 'Postal Address',
          type: 'text',
          placeholder: 'P.O. Box 123, Nairobi',
          required: true
        }
      ]
    },
    {
      id: 'insurance_info',
      title: 'Insurance Details',
      description: 'Choose your insurance coverage',
      stepNumber: 3,
      totalSteps: 4,
      fields: [
        {
          id: 'cover_period',
          label: 'Cover Period',
          type: 'select',
          options: ['1 Month', '3 Months', '6 Months', '12 Months'],
          required: true
        },
        {
          id: 'previous_insurer',
          label: 'Previous Insurer',
          type: 'select',
          options: [
            'None', 'APA Insurance', 'Jubilee Insurance', 'CIC Insurance', 'Britam',
            'ICEA LION', 'Madison Insurance', 'GA Insurance', 'Takaful Insurance',
            'Kenindia Assurance', 'AAR Insurance', 'Other'
          ],
          required: true
        },
        {
          id: 'ncb_percentage',
          label: 'No Claims Bonus (%)',
          type: 'select',
          options: ['0', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55', '60'],
          required: false
        }
      ]
    },
    {
      id: 'documents',
      title: 'Document Upload',
      description: 'Upload required documents',
      stepNumber: 4,
      totalSteps: 4,
      fields: [
        {
          id: 'id_copy',
          label: 'Copy of ID/Passport',
          type: 'document',
          accept: 'image/*,application/pdf',
          required: true,
          maxSize: 5000000
        },
        {
          id: 'driving_license',
          label: 'Driving License',
          type: 'document',
          accept: 'image/*,application/pdf',
          required: true,
          maxSize: 5000000
        },
        {
          id: 'logbook',
          label: 'Vehicle Logbook',
          type: 'document',
          accept: 'image/*,application/pdf',
          required: true,
          maxSize: 5000000
        }
      ]
    }
  ],
  defaults: { 
    cover_type: 'third_party',
    cover_period: '1 Month'
  },
  requiredFields: ['registration_number', 'make', 'model', 'client_name', 'phone_number', 'cover_period'],
  validation: true,
  showProgressBar: true
};

export default TOR_FORM_CONFIG;