import { useContext } from 'react';
import { useMotorInsurance as useCtx } from '../contexts/MotorInsuranceContext';

export default function useMotorInsurance() {
  return useCtx();
}
