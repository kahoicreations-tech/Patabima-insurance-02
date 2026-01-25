import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import djangoAPI from '../services/DjangoAPIService';

/**
 * Custom hook for handling vehicle verification via backend DMVIC integration.
 *
 * Strict behavior: no local mock DB fallback.
 */
export const useVehicleVerification = (setFormData) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [vehicleVerified, setVehicleVerified] = useState(false);

  // Verify vehicle registration
  const verifyVehicle = useCallback(async (regNumber, navigation) => {
    if (!regNumber) {
      Alert.alert('Error', 'Please enter a registration number');
      return;
    }
    
    setIsVerifying(true);

    const regUpper = String(regNumber).toUpperCase().trim();

    try {
      await djangoAPI.initialize?.();

      // Standalone backend endpoint historically used `registration_number`.
      // Some newer codepaths use `vehicle_registration`. Send both for compatibility.
      const resp = await djangoAPI.makeRequest('/api/v1/public_app/integrations/vehicle_check', {
        method: 'POST',
        body: JSON.stringify({
          registration_number: regUpper,
          vehicle_registration: regUpper,
        }),
      });

      const vehicleDetails = resp?.vehicle_details;
      const hasExistingCover = !!(resp?.exists || resp?.has_existing_policy);
      const existingPolicy = resp?.policy || resp?.existing_policy || null;

      if (resp?.success && vehicleDetails) {
        setFormData((prev) => ({
          ...prev,
          registrationNumber: regUpper,
          make: vehicleDetails.make,
          model: vehicleDetails.model,
          yearOfManufacture: vehicleDetails.year,
          chassisNumber: vehicleDetails.chassis_number,
          hasExistingCover,
          lastInsurer: existingPolicy?.insurer,
          expiryDate: existingPolicy?.expiry_date,
        }));

        setVehicleVerified(true);

        if (hasExistingCover && existingPolicy?.insurer && existingPolicy?.expiry_date) {
          Alert.alert(
            'Existing Cover Found',
            `Vehicle has existing insurance with ${existingPolicy.insurer} expiring on ${existingPolicy.expiry_date}. You can still proceed with a new policy.`,
            [
              { text: 'Continue Anyway', style: 'default' },
              { text: 'Cancel', style: 'cancel', onPress: () => navigation?.goBack?.() }
            ]
          );
        } else {
          Alert.alert(
            'Vehicle Found',
            `✅ Vehicle details retrieved for ${vehicleDetails.make || ''} ${vehicleDetails.model || ''}. Data has been auto-filled in the next steps.`
          );
        }
      } else {
        Alert.alert(
          'Vehicle Not Found',
          'This vehicle was not found in the DMVIC database. You can continue by manually entering the vehicle details.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Verification Failed',
        error?.message || 'Unable to verify vehicle right now. Please try again later.'
      );
    } finally {
      setIsVerifying(false);
    }
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
