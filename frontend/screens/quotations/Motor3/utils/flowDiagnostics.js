/**
 * Motor3 Flow Diagnostic Tool
 * 
 * Add this to debug why fields aren't showing after subcategory selection
 * 
 * Usage: Import and call diagnoseMotor3Flow() at key points
 */

import { useMotor3 } from '../contexts/Motor3Context';
import { useThirdParty } from '../contexts/ThirdPartyContext';

export const diagnoseMotor3Flow = (location = 'Unknown') => {
  console.log(`\n🔍 [DIAGNOSTIC @ ${location}] ==================`);
  
  try {
    const motor3 = useMotor3();
    const thirdParty = useThirdParty();
    
    console.log('📦 Motor3 Context:');
    console.log('  - selectedCategory:', motor3?.selectedCategory?.name || 'null');
    console.log('  - selectedSubcategory:', motor3?.selectedSubcategory?.name || 'null');
    console.log('  - subcategory_code:', motor3?.selectedSubcategory?.subcategory_code || 'null');
    
    console.log('\n📦 ThirdParty Context:');
    console.log('  - selectedProduct:', thirdParty?.selectedProduct?.name || 'null');
    console.log('  - registrationNumber:', thirdParty?.registrationNumber || 'empty');
    console.log('  - cover_start_date:', thirdParty?.cover_start_date || 'empty');
    console.log('  - financialInterest:', thirdParty?.financialInterest || 'empty');
    
    console.log('\n✅ Diagnostic complete');
    console.log('==========================================\n');
    
    return {
      motor3State: motor3,
      thirdPartyState: thirdParty,
      hasSubcategory: !!motor3?.selectedSubcategory,
      hasProduct: !!thirdParty?.selectedProduct,
    };
  } catch (error) {
    console.error('❌ [DIAGNOSTIC] Error:', error);
    return null;
  }
};

export const checkStepReadiness = (currentStep, motor3State, thirdPartyState) => {
  console.log(`\n🔍 [STEP CHECK] Step ${currentStep} readiness:`);
  
  switch (currentStep) {
    case 1: // Category Selection
      console.log('  ✅ Step 1 always ready');
      return { ready: true, message: 'Ready to select category' };
      
    case 2: // Subcategory Selection
      const hasCategory = !!motor3State?.selectedCategory;
      console.log(`  ${hasCategory ? '✅' : '❌'} Has category: ${hasCategory}`);
      return {
        ready: hasCategory,
        message: hasCategory ? 'Ready to select subcategory' : 'No category selected',
      };
      
    case 3: // Vehicle Details
      const hasSubcategory = !!motor3State?.selectedSubcategory;
      const hasProduct = !!thirdPartyState?.selectedProduct;
      console.log(`  ${hasSubcategory ? '✅' : '❌'} Has subcategory: ${hasSubcategory}`);
      console.log(`  ${hasProduct ? '✅' : '❌'} Has product: ${hasProduct}`);
      
      if (!hasSubcategory) {
        return { ready: false, message: 'No subcategory selected' };
      }
      if (!hasProduct) {
        return { ready: false, message: 'Product not set in ThirdPartyContext' };
      }
      return { ready: true, message: 'Ready for vehicle details' };
      
    case 4: // Underwriter Selection
      const hasRegistration = !!thirdPartyState?.registrationNumber;
      const hasCoverDate = !!thirdPartyState?.cover_start_date;
      console.log(`  ${hasRegistration ? '✅' : '❌'} Has registration: ${hasRegistration}`);
      console.log(`  ${hasCoverDate ? '✅' : '❌'} Has cover date: ${hasCoverDate}`);
      return {
        ready: hasRegistration && hasCoverDate,
        message: hasRegistration && hasCoverDate ? 'Ready for underwriter selection' : 'Missing vehicle details',
      };
      
    default:
      return { ready: true, message: 'Unknown step' };
  }
};

export default {
  diagnoseMotor3Flow,
  checkStepReadiness,
};
