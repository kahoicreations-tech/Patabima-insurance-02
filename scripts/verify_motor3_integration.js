/**
 * Motor3 Integration Verification Script
 * 
 * This script performs automated checks on the Motor3 codebase
 * to verify structural integrity, imports, and component existence.
 * 
 * Run with: node scripts/verify_motor3_integration.js
 */

const fs = require('fs');
const path = require('path');

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Paths
const FRONTEND_DIR = path.join(__dirname, '../frontend');
const MOTOR3_DIR = path.join(FRONTEND_DIR, 'screens/quotations/Motor3');

// Test results
let passed = 0;
let failed = 0;
const issues = [];

// Utility functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkFileExists(filePath, description) {
  const fullPath = path.join(MOTOR3_DIR, filePath);
  if (fs.existsSync(fullPath)) {
    log(`✓ ${description}`, 'green');
    passed++;
    return true;
  } else {
    log(`✗ ${description}`, 'red');
    failed++;
    issues.push(`Missing file: ${filePath}`);
    return false;
  }
}

function checkFileContains(filePath, searchString, description) {
  const fullPath = path.join(MOTOR3_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    log(`✗ ${description} (file not found)`, 'red');
    failed++;
    issues.push(`Cannot check "${searchString}" - file missing: ${filePath}`);
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  if (content.includes(searchString)) {
    log(`✓ ${description}`, 'green');
    passed++;
    return true;
  } else {
    log(`✗ ${description}`, 'red');
    failed++;
    issues.push(`Missing "${searchString}" in ${filePath}`);
    return false;
  }
}

function checkImport(filePath, importName, description) {
  const fullPath = path.join(MOTOR3_DIR, filePath);
  if (!fs.existsSync(fullPath)) {
    log(`✗ ${description} (file not found)`, 'red');
    failed++;
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf-8');
  const importRegex = new RegExp(`import.*${importName}.*from`, 'g');
  if (importRegex.test(content)) {
    log(`✓ ${description}`, 'green');
    passed++;
    return true;
  } else {
    log(`✗ ${description}`, 'red');
    failed++;
    issues.push(`Missing import "${importName}" in ${filePath}`);
    return false;
  }
}

// Test suites
function testThirdPartyFlowStructure() {
  log('\n=== Third Party Flow Structure ===', 'cyan');
  
  checkFileExists('third-party/ThirdPartyFlow.js', 'ThirdPartyFlow main file exists');
  
  // Step files
  checkFileExists('third-party/steps/Step1_CategorySelection.js', 'TP Step 1: Category Selection');
  checkFileExists('third-party/steps/Step1b_SubcategorySelection.js', 'TP Step 2: Subcategory Selection');
  checkFileExists('third-party/steps/Step2_VehicleDetails.js', 'TP Step 3: Vehicle Details');
  checkFileExists('third-party/steps/Step3_UnderwriterSelection.js', 'TP Step 4: Underwriter Selection');
  checkFileExists('third-party/steps/Step4_ClientDetails.js', 'TP Step 5: Client Details');
  checkFileExists('third-party/steps/Step5_DocumentUpload.js', 'TP Step 6: Document Upload');
  checkFileExists('third-party/steps/Step6_Review.js', 'TP Step 7: Review');
  checkFileExists('third-party/steps/Step7_Payment.js', 'TP Step 8: Payment');
  checkFileExists('third-party/steps/Step8_Submission.js', 'TP Step 9: Submission');
  
  // Component files
  checkFileExists('third-party/components/TPVehicleForm.js', 'TPVehicleForm component');
}

function testComprehensiveFlowStructure() {
  log('\n=== Comprehensive Flow Structure ===', 'cyan');
  
  checkFileExists('comprehensive/ComprehensiveFlow.js', 'ComprehensiveFlow main file exists');
  
  // Step files
  // Note: Category/Subcategory selection is handled by ThirdPartyFlow + Motor3Container routing.
  // Comprehensive flow starts at Vehicle Details.
  checkFileExists('comprehensive/steps/Step2_VehicleDetails.js', 'COMP Step 1: Vehicle Details');
  checkFileExists('comprehensive/steps/Step3_PricingInputs.js', 'COMP Step 2: Pricing Inputs');
  checkFileExists('comprehensive/steps/Step4_UnderwriterSelection.js', 'COMP Step 3: Underwriter Selection');
  checkFileExists('comprehensive/steps/Step5_ClientDetails.js', 'COMP Step 4: Client Details');
  checkFileExists('comprehensive/steps/Step6_DocumentUpload.js', 'COMP Step 5: Document Upload');
  checkFileExists('comprehensive/steps/Step7_Review.js', 'COMP Step 6: Review');
  checkFileExists('comprehensive/steps/Step8_Payment.js', 'COMP Step 7: Payment');
  checkFileExists('comprehensive/steps/Step9_Submission.js', 'COMP Step 8: Submission');
  
  // Component files
  checkFileExists('comprehensive/components/CompVehicleForm.js', 'CompVehicleForm component');
  checkFileExists('comprehensive/components/CompPricingForm.js', 'CompPricingForm component');
}

function testContextFiles() {
  log('\n=== Context Files ===', 'cyan');
  
  checkFileExists('contexts/Motor3Context.js', 'Motor3Context exists');
  checkFileExists('contexts/ThirdPartyContext.js', 'ThirdPartyContext exists');
  checkFileExists('contexts/ComprehensiveContext.js', 'ComprehensiveContext exists');
}

function testHookFiles() {
  log('\n=== Hook Files ===', 'cyan');
  
  checkFileExists('third-party/hooks/useTPUnderwriters.js', 'useTPUnderwriters hook exists');
  checkFileExists('comprehensive/hooks/useCompUnderwriters.js', 'useCompUnderwriters hook exists');
}

function testComponentFiles() {
  log('\n=== Shared Component Files ===', 'cyan');

  // Motor3 uses its own component set under screens/quotations/Motor3/components
  const motor3ComponentsDir = path.join(MOTOR3_DIR, 'components');

  [
    'RadioGroup.js',
    'StableTextInput.js',
    'DropdownSelect.js',
    'VehicleMakeSelector.js',
    'VehicleModelSelector.js',
    'VehicleYearSelector.js',
    'TonnageSelector.js',
    'PassengerCapacityInput.js',
  ].forEach(component => {
    const fullPath = path.join(motor3ComponentsDir, component);
    if (fs.existsSync(fullPath)) {
      log(`✓ Component: ${component}`, 'green');
      passed++;
    } else {
      log(`✗ Component: ${component}`, 'red');
      failed++;
      issues.push(`Missing component: ${component}`);
    }
  });
}

function testTPVehicleFormFields() {
  log('\n=== TPVehicleForm Field Implementation ===', 'cyan');
  
  const filePath = 'third-party/components/TPVehicleForm.js';
  
  // Check for category-specific fields
  checkFileContains(filePath, 'needsEngineCC', 'Engine CC field detection logic');
  checkFileContains(filePath, 'pricingModel === \'ENGINE_CC\'', 'ENGINE_CC pricing model check');
  checkFileContains(filePath, 'needsTonnage', 'Tonnage field detection logic');
  checkFileContains(filePath, 'needsCapacity', 'Passenger capacity field detection logic');
  checkFileContains(filePath, 'isThirdPartyLike', 'Third Party product detection logic');
  
  // Check imports
  checkImport(filePath, 'useTPUnderwriters', 'useTPUnderwriters hook import');
  checkImport(filePath, 'useMotor3', 'Motor3Context hook import');
  checkImport(filePath, 'useThirdParty', 'ThirdPartyContext hook import');
}

function testCompVehicleFormFields() {
  log('\n=== CompVehicleForm Field Implementation ===', 'cyan');
  
  const filePath = 'comprehensive/components/CompVehicleForm.js';
  
  // Check for comprehensive-specific fields
  checkFileContains(filePath, 'make', 'Vehicle make field');
  checkFileContains(filePath, 'model', 'Vehicle model field');
  checkFileContains(filePath, 'year', 'Year of manufacture field');
  checkFileContains(filePath, 'engineNumber', 'Engine number field');
  checkFileContains(filePath, 'chasisNumber', 'Chasis number field');
  checkFileContains(filePath, 'logbookNumber', 'Logbook number field');
}

function testCompPricingFormFields() {
  log('\n=== CompPricingForm Field Implementation ===', 'cyan');
  
  const filePath = 'comprehensive/components/CompPricingForm.js';
  
  // Check for pricing input fields
  checkFileContains(filePath, 'sum_insured', 'Sum insured field');
  checkFileContains(filePath, 'windscreen', 'Windscreen cover field');
  checkFileContains(filePath, 'radio_cassette', 'Radio/Cassette field');
  checkFileContains(filePath, 'excess_protector', 'Excess Protector add-on');
  checkFileContains(filePath, 'pvt', 'PVT add-on');
  checkFileContains(filePath, 'loss_of_use', 'Loss of Use add-on');
}

function testUnderwriterHooks() {
  log('\n=== Underwriter Hook Implementation ===', 'cyan');
  
  // Check useTPUnderwriters
  checkFileContains(
    'third-party/hooks/useTPUnderwriters.js',
    'compareUnderwritersBySubcategory',
    'useTPUnderwriters calls pricing API'
  );
  checkFileContains(
    'third-party/hooks/useTPUnderwriters.js',
    'engine_cc',
    'useTPUnderwriters accepts engine_cc parameter'
  );
  
  // Check useCompUnderwriters
  checkFileContains(
    'comprehensive/hooks/useCompUnderwriters.js',
    'sum_insured',
    'useCompUnderwriters accepts sum_insured parameter'
  );
}

function testValidationFiles() {
  log('\n=== Validation Files ===', 'cyan');
  
  const utilsDir = path.join(MOTOR3_DIR, 'utils');
  
  ['enhancedValidation.js', 'motor3Validation.js', 'stepValidation.js'].forEach(file => {
    const fullPath = path.join(utilsDir, file);
    if (fs.existsSync(fullPath)) {
      log(`✓ Validation: ${file}`, 'green');
      passed++;
    } else {
      log(`✗ Validation: ${file}`, 'red');
      failed++;
      issues.push(`Missing validation file: ${file}`);
    }
  });
}

function testServiceFiles() {
  log('\n=== Service Files ===', 'cyan');
  
  const servicesDir = path.join(FRONTEND_DIR, 'services');
  
  ['DjangoAPIService.js', 'MotorInsurancePricingService.js'].forEach(file => {
    const fullPath = path.join(servicesDir, file);
    if (fs.existsSync(fullPath)) {
      log(`✓ Service: ${file}`, 'green');
      passed++;
    } else {
      log(`✗ Service: ${file}`, 'red');
      failed++;
      issues.push(`Missing service file: ${file}`);
    }
  });
}

// Main execution
function runAllTests() {
  log('\n╔════════════════════════════════════════════════╗', 'blue');
  log('║   Motor3 Integration Verification Script      ║', 'blue');
  log('╚════════════════════════════════════════════════╝\n', 'blue');
  
  testThirdPartyFlowStructure();
  testComprehensiveFlowStructure();
  testContextFiles();
  testHookFiles();
  testComponentFiles();
  testTPVehicleFormFields();
  testCompVehicleFormFields();
  testCompPricingFormFields();
  testUnderwriterHooks();
  testValidationFiles();
  testServiceFiles();
  
  // Summary
  log('\n╔════════════════════════════════════════════════╗', 'blue');
  log('║                  Test Summary                  ║', 'blue');
  log('╚════════════════════════════════════════════════╝\n', 'blue');
  
  log(`Total Tests: ${passed + failed}`);
  log(`Passed: ${passed}`, 'green');
  log(`Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  
  if (issues.length > 0) {
    log('\n⚠️  Issues Found:', 'yellow');
    issues.forEach((issue, index) => {
      log(`  ${index + 1}. ${issue}`, 'yellow');
    });
  }
  
  log('\n╔════════════════════════════════════════════════╗', 'blue');
  log('║              Next Steps                        ║', 'blue');
  log('╚════════════════════════════════════════════════╝\n', 'blue');
  
  if (failed === 0) {
    log('✅ All automated checks passed!', 'green');
    log('\nNext: Manual testing required for:', 'cyan');
    log('  1. Flow navigation (use MOTOR3_MANUAL_TESTING_CHECKLIST.md)', 'cyan');
    log('  2. Context state management', 'cyan');
    log('  3. Underwriter API integration', 'cyan');
    log('  4. Product type detection', 'cyan');
    log('  5. Payment flow', 'cyan');
  } else {
    log('❌ Some checks failed. Please fix the issues above before manual testing.', 'red');
  }
  
  log('\n');
  
  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests();
