import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

/**
 * User Flow Simulation Agent
 * Simulates a new user registration + login flow and captures UX feedback
 */

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const serverEntrypoint = resolve(here, '../dist/index.js');
  const transport = new StdioClientTransport({ command: 'node', args: [serverEntrypoint] });
  const client = new Client({ name: 'user-flow-agent', version: '1.0.0' });
  await client.connect(transport);

  const outDir = resolve(here, '../out/user-flow-simulation');
  mkdirSync(outDir, { recursive: true });

  // Start observation scoped to Expo (common dev case) and enable expert mode
  try {
    await client.callTool({ name: 'start_observation_for_package', arguments: { package: 'host.exp.exponent', priority: 'I' } });
  } catch {}
  try {
    await client.callTool({ name: 'toggle_expert_mode', arguments: { enabled: true, autoView: true } });
  } catch {}

  const testUser = {
    phone: '0712345678',
    password: 'TestUser123#',
    name: 'John Agent',
    email: 'john.agent@test.com'
  };

  const uxIssues = [];
  const positives = [];
  const rootCauses = [];
  let stepCounter = 0;
  let lastUiSignature = '';

  // Utility: read current UI summary and logs
  const readContext = async (withLogs = false) => {
    const tree = await client.callTool({ name: 'get_ui_tree', arguments: {} });
    const uiText = tree.content?.find(c => c.type === 'text')?.text || '';
    const view = await client.callTool({ name: 'get_current_view', arguments: { includeLogs: withLogs } });
    const logsText = (view.content?.filter(c => c.type === 'text')?.map(t => t.text).join('\n')) || '';
    return { uiText, logsText };
  };

  const signatureOf = (uiText) => uiText.replace(/\s+/g, ' ').slice(0, 2000);

  // Human-like recovery: try to get unstuck
  const recover = async (reason) => {
    console.log(`\n🧭 Recovery: ${reason}`);
    // 1) Dismiss keyboard
    try { await client.callTool({ name: 'dismiss_keyboard', arguments: {} }); } catch {}
    await new Promise(r => setTimeout(r, 400));
    // 2) Try common dismiss buttons
    const dismissLabels = ['OK','Ok','ok','Allow','ALLOW','Cancel','Close','Done','Back'];
    for (const label of dismissLabels) {
      try { await client.callTool({ name: 'act_and_view', arguments: { actions: [{ tool: 'tap_by_query', args: { query: label } }], includeLogs: false } }); } catch {}
    }
    // 3) Try scrolling to reveal obscured controls
    const swipes = [
      { xPct: 50, yPct: 80, x2Pct: 50, y2Pct: 30 }, // scroll up
      { xPct: 50, yPct: 30, x2Pct: 50, y2Pct: 80 }, // scroll down
    ];
    for (const s of swipes) {
      try { await client.callTool({ name: 'swipe_percent', arguments: { ...s, durationMs: 250 } }); } catch {}
      await new Promise(r => setTimeout(r, 400));
    }
    // 4) Try BACK to close overlays
    try { await client.callTool({ name: 'adb_input', arguments: { action: 'keyevent', keycode: 'BACK' } }); } catch {}
    await new Promise(r => setTimeout(r, 400));
  };

  // Tap with synonyms and recovery
  const tapSmart = async (label, synonyms = [], preferClickable = true) => {
    const candidates = [label, ...synonyms];
    for (const q of candidates) {
      const before = await readContext(false);
      const beforeSig = signatureOf(before.uiText);
      try {
        const res = await client.callTool({
          name: 'act_and_view',
          arguments: { actions: [{ tool: 'tap_by_query', args: { query: q, preferClickable } }], includeLogs: false }
        });
      } catch {}
      const after = await readContext(false);
      const afterSig = signatureOf(after.uiText);
      if (afterSig !== beforeSig) return true; // UI changed, success
    }
    await recover(`Could not tap label "${label}"`);
    return false;
  };

  // Wait for an element using the tool; verify via UI signature change
  const waitFor = async (query, timeoutMs = 6000) => {
    const before = await readContext(false);
    const beforeSig = signatureOf(before.uiText);
    try {
      await client.callTool({ name: 'wait_for_element', arguments: { query, timeoutMs } });
    } catch {}
    const after = await readContext(false);
    const afterSig = signatureOf(after.uiText);
    return afterSig !== beforeSig || after.uiText.toLowerCase().includes(query.toLowerCase());
  };

  // Helper to capture and save screenshots
  const captureStep = async (stepName, description) => {
    stepCounter++;
    console.log(`\n📸 Step ${stepCounter}: ${stepName}`);
    const res = await client.callTool({ 
      name: 'get_current_view', 
      arguments: { includeLogs: false } 
    });
    const img = res.content?.find(c => c.type === 'image');
    if (img?.data) {
      const file = resolve(outDir, `step-${stepCounter}-${stepName.toLowerCase().replace(/\s+/g, '-')}.png`);
      writeFileSync(file, Buffer.from(img.data, 'base64'));
      console.log(`   Saved: ${file}`);
      console.log(`   Description: ${description}`);
    }
    // Small delay for UI to settle
    await new Promise(r => setTimeout(r, 800));
  };

  const analyzeElement = async (query, expectedBehavior) => {
    const res = await client.callTool({ name: 'get_ui_tree', arguments: {} });
    const text = res.content?.find(c => c.type === 'text')?.text || '';
    const found = text.toLowerCase().includes(query.toLowerCase());
    console.log(`   🔍 Checking for "${query}": ${found ? '✅ Found' : '❌ Not found'}`);
    if (!found) {
      uxIssues.push({
        step: stepCounter,
        issue: `Missing or unclear element: ${query}`,
        expected: expectedBehavior
      });
    }
    return found;
  };

  try {
    console.log('\n🚀 Starting User Flow Simulation for PataBima Agency App');
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('Test User Profile:');
    console.log(`  Phone: ${testUser.phone}`);
    console.log(`  Name: ${testUser.name}`);
    console.log(`  Email: ${testUser.email}`);
    console.log('\n═══════════════════════════════════════════════════════\n');

    // STEP 1: Initial screen (Login)
    await captureStep('Initial Login Screen', 'User first opens the app and sees the login screen');
    
    // Analyze login screen
    console.log('\n🔍 Analyzing Login Screen UX...');
    const hasPhoneField = await analyzeElement('phone', 'Phone input field should be clearly visible');
    const hasPasswordField = await analyzeElement('password', 'Password input field should be clearly visible');
    const hasGetOTP = await analyzeElement('get otp', 'Primary CTA button should be prominent');
    const hasSignUp = await analyzeElement('sign up', 'Sign up link should be visible for new users');

    if (hasGetOTP) {
      positives.push({
        step: 1,
        positive: 'Get OTP button is prominent and clearly labeled',
        impact: 'Users can easily identify the primary action'
      });
    }

    // STEP 2: Navigate to Sign Up
    console.log('\n👆 Tapping "Sign Up" link...');
    await tapSmart('Sign Up', ['Create account','Register','Sign up','Create Account']);
    
    await captureStep('Sign Up Screen', 'User navigates to registration screen');

    // Analyze sign up form
    console.log('\n🔍 Analyzing Sign Up Form UX...');
    await analyzeElement('name', 'Name input should be present for registration');
    await analyzeElement('email', 'Email input for contact/verification');
    await analyzeElement('phone', 'Phone number input (primary identifier)');
    await analyzeElement('password', 'Password input with requirements');

    // STEP 3: Fill registration form
    console.log('\n✍️ Filling registration form...');
    const registrationActions = [
      // Clear any pre-filled data and fill name
      { tool: 'tap_by_query', args: { query: 'name' } },
      { tool: 'adb_input', args: { action: 'keyevent', keycode: 'MOVE_END' } },
      { tool: 'adb_input', args: { action: 'keyevent', keycode: 'DEL' } },
      { tool: 'adb_input', args: { action: 'keyevent', keycode: 'DEL' } },
      { tool: 'adb_input', args: { action: 'keyevent', keycode: 'DEL' } },
      { tool: 'type_text', args: { value: testUser.name } },
      
      // Fill email
      { tool: 'tap_by_query', args: { query: 'email' } },
      { tool: 'type_text', args: { value: testUser.email } },
      
      // Fill phone
      { tool: 'tap_by_query', args: { query: 'phone' } },
      { tool: 'type_text', args: { value: testUser.phone } },
      
      // Fill password
      { tool: 'tap_by_query', args: { query: 'password' } },
      { tool: 'type_text', args: { value: testUser.password } },
    ];

    const fillFormRes = await client.callTool({
      name: 'act_and_view',
      arguments: {
        actions: registrationActions,
        includeLogs: false
      }
    });

    await captureStep('Registration Form Filled', 'All registration fields completed');

    // Check for validation feedback
    console.log('\n🔍 Checking for validation feedback...');
    const hasValidation = await analyzeElement('valid', 'Real-time validation should confirm input correctness');
    
    if (!hasValidation) {
      uxIssues.push({
        step: stepCounter,
        issue: 'No visible validation feedback during form fill',
        expected: 'Show green checkmarks or validation messages as user fills fields',
        severity: 'Medium',
        recommendation: 'Add real-time validation indicators to improve user confidence'
      });
    }

    // STEP 4: Submit registration
    console.log('\n👆 Submitting registration...');
    await tapSmart('Create Account', ['Create account','Sign Up','Register']);

    await captureStep('Registration Submitted', 'User taps Create Account button');

    // Check for loading state
    console.log('\n🔍 Checking for loading feedback...');
    const hasLoader = await analyzeElement('loading', 'Loading indicator should show during API call');
    
    if (!hasLoader) {
      uxIssues.push({
        step: stepCounter,
        issue: 'No loading state visible during registration',
        expected: 'Show spinner or progress indicator',
        severity: 'High',
        recommendation: 'Add loading overlay with "Creating your account..." message'
      });
    }

    // STEP 5: Check for success/error feedback
  await new Promise(r => setTimeout(r, 2000)); // Wait for API response
    await captureStep('Registration Response', 'Server response and next step');

    const hasSuccess = await analyzeElement('success', 'Success message should confirm registration');
    const hasError = await analyzeElement('error', 'Error message if registration failed');
    
    if (!hasSuccess && !hasError) {
      uxIssues.push({
        step: stepCounter,
        issue: 'No clear feedback after registration submission',
        expected: 'Show success message and next steps, or clear error message',
        severity: 'Critical',
        recommendation: 'Display "Account created! Check your phone for OTP" or specific error messages'
      });
    }

  // STEP 6: OTP Screen (if reached)
    console.log('\n🔍 Checking if OTP screen is shown...');
    const hasOTPInput = await analyzeElement('otp', 'OTP input should be visible after registration');
    
    if (hasOTPInput) {
      await captureStep('OTP Verification Screen', 'User is prompted to enter OTP');
      
      positives.push({
        step: stepCounter,
        positive: 'Clear progression to OTP verification',
        impact: 'User understands next step in onboarding'
      });

      // Analyze OTP screen
      console.log('\n🔍 Analyzing OTP Screen UX...');
      const hasResend = await analyzeElement('resend', 'Resend OTP option should be available');
      const hasTimer = await analyzeElement('second', 'Countdown timer for resend');
      
      if (!hasResend) {
        uxIssues.push({
          step: stepCounter,
          issue: 'No "Resend OTP" option visible',
          expected: 'Users should be able to request a new OTP if not received',
          severity: 'Medium',
          recommendation: 'Add "Didn\'t receive OTP? Resend" link with countdown timer'
        });
      }

      // Simulate OTP entry (test OTP: 123456)
      console.log('\n✍️ Entering test OTP...');
      // Try entering OTP with recovery attempts
      const otpEntered = await (async () => {
        const okTap = await tapSmart('otp', ['OTP','One Time Password']);
        try { await client.callTool({ name: 'act_and_view', arguments: { actions: [{ tool: 'type_text', args: { value: '123456' } }], includeLogs: false } }); } catch {}
        const verified = await tapSmart('Verify', ['verify','Continue','Next']);
        return okTap && verified;
      })();

      await captureStep('OTP Entered', 'User enters OTP code');
    }

  // STEP 7: Check final state (Dashboard or Login)
    await new Promise(r => setTimeout(r, 2000));
    await captureStep('Final State', 'Where user lands after complete flow');

    const hasDashboard = await analyzeElement('dashboard', 'User should reach main dashboard');
    const hasWelcome = await analyzeElement('welcome', 'Welcome message for new user');
    
    if (hasDashboard || hasWelcome) {
      positives.push({
        step: stepCounter,
        positive: 'Successful completion of registration flow',
        impact: 'User is now authenticated and can use the app'
      });
    }

  // GENERATE UX REPORT
    console.log('\n\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 USER FLOW SIMULATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════\n');

    console.log(`Total Steps Captured: ${stepCounter}`);
    console.log(`Screenshots Saved: ${outDir}\n`);

    // Critical UX Issues
    const criticalIssues = uxIssues.filter(i => i.severity === 'Critical');
    const highIssues = uxIssues.filter(i => i.severity === 'High');
    const mediumIssues = uxIssues.filter(i => i.severity === 'Medium' || !i.severity);

    if (criticalIssues.length > 0) {
      console.log('\n🚨 CRITICAL UX ISSUES (Fix Immediately)');
      console.log('═══════════════════════════════════════════════════════');
      criticalIssues.forEach((issue, idx) => {
        console.log(`\n${idx + 1}. ${issue.issue}`);
        console.log(`   Step: ${issue.step}`);
        console.log(`   Expected: ${issue.expected}`);
        if (issue.recommendation) {
          console.log(`   💡 Fix: ${issue.recommendation}`);
        }
      });
    }

    if (highIssues.length > 0) {
      console.log('\n\n⚠️  HIGH PRIORITY UX ISSUES');
      console.log('═══════════════════════════════════════════════════════');
      highIssues.forEach((issue, idx) => {
        console.log(`\n${idx + 1}. ${issue.issue}`);
        console.log(`   Step: ${issue.step}`);
        console.log(`   Expected: ${issue.expected}`);
        if (issue.recommendation) {
          console.log(`   💡 Fix: ${issue.recommendation}`);
        }
      });
    }

    if (mediumIssues.length > 0) {
      console.log('\n\n📋 MEDIUM PRIORITY UX IMPROVEMENTS');
      console.log('═══════════════════════════════════════════════════════');
      mediumIssues.forEach((issue, idx) => {
        console.log(`\n${idx + 1}. ${issue.issue}`);
        console.log(`   Step: ${issue.step}`);
        console.log(`   Expected: ${issue.expected}`);
        if (issue.recommendation) {
          console.log(`   💡 Recommendation: ${issue.recommendation}`);
        }
      });
    }

    if (positives.length > 0) {
      console.log('\n\n✅ POSITIVE UX ELEMENTS (Keep These!)');
      console.log('═══════════════════════════════════════════════════════');
      positives.forEach((item, idx) => {
        console.log(`\n${idx + 1}. ${item.positive}`);
        console.log(`   Step: ${item.step}`);
        console.log(`   Impact: ${item.impact}`);
      });
    }

    // Root-cause suggestions based on logs and UI
    const { uiText: finalUi, logsText: finalLogs } = await readContext(true);
    const logsLower = (finalLogs || '').toLowerCase();
    if (logsLower.includes('network') || logsLower.includes('failed to connect') || logsLower.includes('timeout')) {
      rootCauses.push('Network instability or server unreachable during auth requests. Consider retry logic and clearer offline messaging.');
    }
    if (/\b4\d{2}\b/.test(finalLogs)) {
      rootCauses.push('Client error (4xx) from API—validate payload (phone format, required fields).');
    }
    if (/\b5\d{2}\b/.test(finalLogs)) {
      rootCauses.push('Server error (5xx) from API—backend issue, show friendly error and allow retry.');
    }
    if (finalUi.toLowerCase().includes('get otp') && !finalUi.toLowerCase().includes('otp')) {
      rootCauses.push('OTP request may not be triggering—ensure phone length/format (+2547...) and enable button only when valid.');
    }

    if (rootCauses.length) {
      console.log('\n\n🧩 LIKELY ROOT CAUSES');
      console.log('═══════════════════════════════════════════════════════');
      rootCauses.forEach((c, i) => console.log(`\n${i + 1}. ${c}`));
    }

    // Overall UX Score
    const totalChecks = uxIssues.length + positives.length;
    const score = totalChecks > 0 ? Math.round((positives.length / totalChecks) * 100) : 0;
    
    console.log('\n\n📈 OVERALL UX SCORE');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Score: ${score}% (${positives.length} positives, ${uxIssues.length} issues)`);
    
    if (score >= 80) {
      console.log('Rating: ⭐⭐⭐⭐⭐ Excellent user experience');
    } else if (score >= 60) {
      console.log('Rating: ⭐⭐⭐⭐ Good, but needs improvements');
    } else if (score >= 40) {
      console.log('Rating: ⭐⭐⭐ Fair, several issues to address');
    } else {
      console.log('Rating: ⭐⭐ Needs significant UX improvements');
    }

  console.log('\n\n🎯 TOP 3 ACTIONABLE RECOMMENDATIONS');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\n1. Add Loading States');
    console.log('   • Show spinners during API calls (login, registration, OTP)');
    console.log('   • Add "Processing..." or "Creating account..." messages');
    console.log('   • Prevent double-taps with disabled button states\n');

    console.log('2. Improve Form Validation Feedback');
    console.log('   • Real-time validation with green checkmarks for valid fields');
    console.log('   • Clear error messages below each field (not just on submit)');
    console.log('   • Password strength indicator\n');

    console.log('3. Enhance Success/Error Messaging');
    console.log('   • Show clear success messages: "Account created! Check your SMS"');
    console.log('   • Specific error messages: "Phone number already registered"');
    console.log('   • Use toasts or modals for important feedback\n');

    console.log('\n📁 Full simulation screenshots saved to:');
    console.log(`   ${outDir}\n`);

    // Save JSON report
    const report = {
      timestamp: new Date().toISOString(),
      testUser,
      totalSteps: stepCounter,
      score,
      criticalIssues,
      highIssues,
      mediumIssues,
      positives,
      rootCauses,
      screenshotsDir: outDir
    };

    const reportFile = resolve(outDir, 'ux-report.json');
    writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`💾 Detailed JSON report saved: ${reportFile}\n`);

  } catch (error) {
    console.error('\n❌ Simulation Error:', error.message);
    console.error('Stack:', error.stack);
    
    // Save error screenshot
    try {
      const res = await client.callTool({ 
        name: 'get_current_view', 
        arguments: { includeLogs: true } 
      });
      const img = res.content?.find(c => c.type === 'image');
      if (img?.data) {
        const file = resolve(outDir, `error-state.png`);
        writeFileSync(file, Buffer.from(img.data, 'base64'));
        console.log(`📸 Error state captured: ${file}`);
      }
    } catch (e) {
      console.error('Could not capture error state:', e.message);
    }
  }
}

main().catch((e) => { 
  console.error('\n💥 Fatal error:', e?.message || e); 
  process.exit(1); 
});
