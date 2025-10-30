import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

/**
 * Custom hook for handling vehicle verification against a mock database
 */
export const useVehicleVerification = (setFormData) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [vehicleVerified, setVehicleVerified] = useState(false);

  // Mock vehicle database for verification
  const mockVehicleDatabase = {
    'KAA123A': {
      make: 'Toyota',
      model: 'Corolla',
      yearOfManufacture: '2019',
      engineCapacity: '1800',
      vehicleType: 'Sedan',
      vehicleValue: '1500000',
      ownerName: 'John Kamau',
      hasExistingCover: false
    },
    'KBB456B': {
      make: 'Honda',
      model: 'CR-V',
      yearOfManufacture: '2020',
      engineCapacity: '2000',
      vehicleType: 'SUV',
      vehicleValue: '2500000',
      ownerName: 'Jane Wanjiku',
      hasExistingCover: true,
      lastInsurer: 'Jubilee Insurance',
      expiryDate: '2025-05-20'
    },
    'KCK789C': {
      make: 'Nissan',
      model: 'X-Trail',
      yearOfManufacture: '2021',
      engineCapacity: '2500',
      vehicleType: 'SUV',
      vehicleValue: '3200000',
      ownerName: 'Mary Wanjiku Njoroge',
      hasExistingCover: true,
      lastInsurer: 'CIC Insurance',
      expiryDate: '2025-03-15'
    }
  };

  // Verify vehicle registration
  const verifyVehicle = useCallback((regNumber, navigation) => {
    if (!regNumber) {
      Alert.alert('Error', 'Please enter a registration number');
      return;
    }
    
    setIsVerifying(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      const vehicleData = mockVehicleDatabase[regNumber.toUpperCase()];
      
      if (vehicleData) {
        setFormData(prev => ({
          ...prev,
          ...vehicleData,
          registrationNumber: regNumber.toUpperCase()
        }));
        setVehicleVerified(true);
        setIsVerifying(false);
        
        if (vehicleData.hasExistingCover) {
          Alert.alert(
            'Existing Cover Found', 
            `Vehicle has existing insurance with ${vehicleData.lastInsurer} expiring on ${vehicleData.expiryDate}. You can still proceed with a new policy.`,
            [
              { text: 'Continue Anyway', style: 'default' },
              { text: 'Cancel', style: 'cancel', onPress: () => navigation.goBack() }
            ]
          );
        } else {
          Alert.alert('Vehicle Found', `✅ Vehicle details retrieved for ${vehicleData.make} ${vehicleData.model}. Data has been auto-filled in the next steps.`);
        }
      } else {
        setIsVerifying(false);
        Alert.alert('Vehicle Not Found', 'This vehicle was not found in the AKI database. You can continue by manually entering the vehicle details in the next step.');
      }
    }, 1500); // Simulate network delay
  }, [setFormData]);

  return {
    isVerifying,
    setIsVerifying,
    vehicleVerified,
    setVehicleVerified,
    verifyVehicle
  };
};

export default useVehicleVerification;
