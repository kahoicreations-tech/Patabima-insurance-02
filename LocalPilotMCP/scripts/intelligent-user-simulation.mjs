#!/usr/bin/env node

/**
 * Intelligent User Flow Simulation with Vision and Recovery
 * 
 * This agent OBSERVES what's happening on screen, REASONS about issues,
 * and applies RECOVERY strategies - just like a real user would.
 * 
 * Usage: node scripts/intelligent-user-simulation.mjs
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Test user data
const testUser = {
  phone: '712345678', // 9 digits as required
  password: 'TestUser123#',
  name: 'John Agent',
  email: 'john.agent@test.com'
};

// Observation and analysis utilities
class UIObserver {
  constructor(client) {
    this.client = client;
  }

  async captureView() {
    const result = await this.client.callTool({ 
      name: 'get_current_view', 
      arguments: { includeLogs: true, maxLogLines: 150 } 
    });
    
    const screenshot = result.content?.find(c => c.type === 'image')?.data;
    const logs = result.content?.find(c => c.type === 'text')?.text || '';
    
    return { screenshot, logs };
  }

  async getUITree() {
    const result = await this.client.callTool({ 
      name: 'get_ui_tree', 
      arguments: {} 
    });
    
    return result.content?.find(c => c.type === 'text')?.text || '';
  }

  analyzeUIState(uiTree, logs) {
    const analysis = {
      errors: [],
      warnings: [],
      success: [],
      inputFields: [],
      buttons: [],
      hasKeyboard: false,
      focusedField: null,
      validationMessages: []
    };

    const lines = uiTree.toLowerCase().split('\n');
    
    for (const line of lines) {
      // Check for errors
      if (line.includes('error') || line.includes('invalid') || line.includes('wrong')) {
        const match = line.match(/text=([^=\s]+)/);
        if (match) analysis.errors.push(match[1]);
      }

      // Check for validation messages
      if (line.includes('must') || line.includes('required') || line.includes('should')) {
        const match = line.match(/text=([^=]+?)\s/);
        if (match) analysis.validationMessages.push(match[1]);
      }

      // Check for success indicators
      if (line.includes('success') || line.includes('welcome') || line.includes('verify')) {
        const match = line.match(/text=([^=]+?)\s/);
        if (match) analysis.success.push(match[1]);
      }

      // Check for keyboard
      if (line.includes('keyboard') || line.includes('ime')) {
        analysis.hasKeyboard = true;
      }

      // Find input fields
      if (line.includes('edittext') || line.includes('textinput')) {
        const textMatch = line.match(/text=([^=]+?)\s/);
        const idMatch = line.match(/id=([^=]+?)\s/);
        const descMatch = line.match(/contentdesc=([^=]+?)\s/);
        
        const label = textMatch?.[1] || descMatch?.[1] || idMatch?.[1];
        if (label) analysis.inputFields.push(label);
      }

      // Find buttons
      if (line.includes('button') && line.includes('clickable=y')) {
        const match = line.match(/text=([^=]+?)\s/);
        if (match && match[1].trim()) analysis.buttons.push(match[1]);
      }
    }

    // Analyze logs for API responses
    const logLower = logs.toLowerCase();
    if (logLower.includes('200') || logLower.includes('201')) {
      analysis.success.push('API Success (200/201)');
    }
    if (logLower.includes('400') || logLower.includes('422')) {
      analysis.errors.push('API Validation Error (400/422)');
    }
    if (logLower.includes('500')) {
      analysis.errors.push('API Server Error (500)');
    }

    return analysis;
  }
}

class SmartAgent {
  constructor(client, observer) {
    this.client = client;
    this.observer = observer;
    this.report = {
      timestamp: new Date().toISOString(),
      testUser,
      steps: [],
      observations: [],
      recoveryActions: [],
      finalScore: 0,
      issues: [],
      recommendations: []
    };
  }

  log(message, type = 'info') {
    const emoji = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      observe: '👁️',
      think: '🤔',
      action: '🎯'
    }[type] || 'ℹ️';
    
    console.log(`${emoji} ${message}`);
  }

  async observe(stepName) {
    this.log(`Observing: ${stepName}`, 'observe');
    
    const { screenshot, logs } = await this.observer.captureView();
    const uiTree = await this.observer.getUITree();
    const analysis = this.observer.analyzeUIState(uiTree, logs);

    this.report.observations.push({
      step: stepName,
      timestamp: new Date().toISOString(),
      analysis,
      screenshot: screenshot ? 'captured' : 'none'
    });

    return { analysis, screenshot, logs, uiTree };
  }

  async think(observation, context) {
    this.log('Analyzing situation...', 'think');
    
    const { analysis } = observation;
    const reasoning = {
      canProceed: true,
      blockers: [],
      nextAction: null,
      recovery: null
    };

    // Check for blocking errors
    if (analysis.errors.length > 0) {
      this.log(`Found ${analysis.errors.length} errors: ${analysis.errors.join(', ')}`, 'error');
      reasoning.canProceed = false;
      reasoning.blockers.push(...analysis.errors);
    }

    // Check for validation messages
    if (analysis.validationMessages.length > 0) {
      this.log(`Validation issues: ${analysis.validationMessages.join(', ')}`, 'warning');
      reasoning.blockers.push(...analysis.validationMessages);
    }

    // Check if keyboard is blocking
    if (analysis.hasKeyboard && context.expectingButton) {
      this.log('Keyboard is blocking the view', 'warning');
      reasoning.recovery = 'dismiss_keyboard';
    }

    // Determine next action based on context
    if (reasoning.blockers.length === 0) {
      reasoning.canProceed = true;
    } else {
      // Try to understand the blocker and fix it
      const phoneError = reasoning.blockers.some(b => 
        b.toLowerCase().includes('phone') || b.toLowerCase().includes('9 digits')
      );
      
      if (phoneError) {
        this.log('Phone number validation failed - need to fix format', 'think');
        reasoning.recovery = 'fix_phone_format';
      }
    }

    return reasoning;
  }

  async act(action, params = {}) {
    this.log(`Action: ${action}`, 'action');
    
    try {
      let result;
      
      switch (action) {
        case 'tap':
          result = await this.client.callTool({
            name: 'tap_by_query',
            arguments: { query: params.query, preferClickable: true }
          });
          break;

        case 'type':
          result = await this.client.callTool({
            name: 'type_text',
            arguments: { value: params.value }
          });
          break;

        case 'dismiss_keyboard':
          result = await this.client.callTool({
            name: 'dismiss_keyboard',
            arguments: {}
          });
          break;

        case 'scroll_down':
          result = await this.client.callTool({
            name: 'swipe_percent',
            arguments: { xPct: 50, yPct: 70, x2Pct: 50, y2Pct: 30, durationMs: 300 }
          });
          break;

        case 'wait':
          await new Promise(r => setTimeout(r, params.ms || 2000));
          result = { success: true };
          break;

        default:
          throw new Error(`Unknown action: ${action}`);
      }

      this.log(`Action completed: ${action}`, 'success');
      return { success: true, result };
      
    } catch (error) {
      this.log(`Action failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async recover(recoveryType, observation) {
    this.log(`Attempting recovery: ${recoveryType}`, 'warning');
    
    this.report.recoveryActions.push({
      type: recoveryType,
      timestamp: new Date().toISOString(),
      reason: observation.analysis.errors.join(', ')
    });

    switch (recoveryType) {
      case 'dismiss_keyboard':
        await this.act('dismiss_keyboard');
        await this.act('wait', { ms: 500 });
        break;

      case 'fix_phone_format':
        // Clear the phone field and re-enter with correct format
        this.log('Fixing phone number format (removing leading 0)', 'think');
        await this.act('tap', { query: 'phone' });
        await this.act('wait', { ms: 300 });
        // Select all and delete
        await this.client.callTool({
          name: 'adb_input',
          arguments: { action: 'keyevent', keycode: 'MOVE_END' }
        });
        // Delete characters
        for (let i = 0; i < 15; i++) {
          await this.client.callTool({
            name: 'adb_input',
            arguments: { action: 'keyevent', keycode: 'DEL' }
          });
        }
        await this.act('wait', { ms: 300 });
        // Enter correct format (9 digits)
        await this.act('type', { value: testUser.phone });
        await this.act('dismiss_keyboard');
        break;

      case 'scroll_to_reveal':
        await this.act('scroll_down');
        await this.act('wait', { ms: 500 });
        break;

      default:
        this.log(`Unknown recovery type: ${recoveryType}`, 'error');
    }
  }

  async saveScreenshot(screenshot, filename) {
    const dir = resolve(__dirname, '../out/intelligent-simulation');
    mkdirSync(dir, { recursive: true });
    const filepath = resolve(dir, filename);
    writeFileSync(filepath, Buffer.from(screenshot, 'base64'));
    return filepath;
  }
}

// Main simulation flow
async function runIntelligentSimulation() {
  console.log('🚀 Starting Intelligent User Flow Simulation\n');
  console.log('Test User:', testUser);
  console.log('');

  const serverEntrypoint = resolve(__dirname, '../dist/index.js');
  const transport = new StdioClientTransport({ 
    command: 'node', 
    args: [serverEntrypoint] 
  });
  
  const client = new Client({ 
    name: 'intelligent-agent', 
    version: '1.0.0' 
  });

  try {
    await client.connect(transport);
    console.log('✅ Connected to MCP Server\n');

    // Initialize
    const observer = new UIObserver(client);
    const agent = new SmartAgent(client, observer);

    // Enable expert mode
    await client.callTool({ 
      name: 'toggle_expert_mode', 
      arguments: { enabled: true } 
    });

    // Start observation
    await client.callTool({ 
      name: 'start_observation_for_package', 
      arguments: {} 
    });

    console.log('═'.repeat(70));
    console.log('STEP 1: Initial Screen Analysis');
    console.log('═'.repeat(70) + '\n');

    let observation = await agent.observe('Initial Screen');
    await agent.saveScreenshot(observation.screenshot, 'step-1-initial.png');
    
    agent.log(`Found ${observation.analysis.inputFields.length} input fields`);
    agent.log(`Found ${observation.analysis.buttons.length} buttons`);
    
    if (observation.analysis.errors.length > 0) {
      agent.log(`Errors on screen: ${observation.analysis.errors.join(', ')}`, 'error');
    }

    // Check if we're on login or signup
    const hasSignUp = observation.uiTree.toLowerCase().includes('sign up') || 
                      observation.uiTree.toLowerCase().includes('signup');
    
    if (hasSignUp) {
      console.log('\n─────────────────────────────────────────────────────────────────────');
      console.log('STEP 2: Navigate to Sign Up');
      console.log('─────────────────────────────────────────────────────────────────────\n');
      
      await agent.act('tap', { query: 'sign up' });
      await agent.act('wait', { ms: 1500 });
      
      observation = await agent.observe('Sign Up Screen');
      await agent.saveScreenshot(observation.screenshot, 'step-2-signup.png');
    }

    // Fill registration form
    console.log('\n─────────────────────────────────────────────────────────────────────');
    console.log('STEP 3: Fill Registration Form');
    console.log('─────────────────────────────────────────────────────────────────────\n');

    const fields = [
      { query: 'name', value: testUser.name, label: 'Name' },
      { query: 'email', value: testUser.email, label: 'Email' },
      { query: 'phone', value: testUser.phone, label: 'Phone' },
      { query: 'password', value: testUser.password, label: 'Password' }
    ];

    for (const field of fields) {
      agent.log(`Filling ${field.label}...`);
      
      await agent.act('tap', { query: field.query });
      await agent.act('wait', { ms: 500 });
      await agent.act('type', { value: field.value });
      await agent.act('dismiss_keyboard');
      await agent.act('wait', { ms: 500 });

      // Observe after each field
      observation = await agent.observe(`After filling ${field.label}`);
      
      // Check for validation errors
      const reasoning = await agent.think(observation, { 
        justFilledField: field.label 
      });

      if (!reasoning.canProceed) {
        agent.log(`Validation issue detected for ${field.label}`, 'warning');
        
        if (reasoning.recovery) {
          await agent.recover(reasoning.recovery, observation);
          
          // Re-observe after recovery
          observation = await agent.observe(`After recovery for ${field.label}`);
          const newReasoning = await agent.think(observation, {});
          
          if (!newReasoning.canProceed) {
            agent.log(`Recovery failed for ${field.label}`, 'error');
            agent.report.issues.push({
              field: field.label,
              issue: reasoning.blockers.join(', '),
              recovered: false
            });
          } else {
            agent.log(`Recovery successful for ${field.label}`, 'success');
          }
        }
      }
    }

    await agent.saveScreenshot(observation.screenshot, 'step-3-form-filled.png');

    // Submit registration
    console.log('\n─────────────────────────────────────────────────────────────────────');
    console.log('STEP 4: Submit Registration');
    console.log('─────────────────────────────────────────────────────────────────────\n');

    // Dismiss keyboard first to see submit button
    await agent.act('dismiss_keyboard');
    await agent.act('wait', { ms: 500 });

    observation = await agent.observe('Before Submit');
    agent.log(`Available buttons: ${observation.analysis.buttons.join(', ')}`);

    const submitQueries = ['sign up', 'register', 'create', 'continue', 'next', 'submit'];
    let submitted = false;

    for (const query of submitQueries) {
      const result = await agent.act('tap', { query });
      if (result.success) {
        submitted = true;
        agent.log(`Successfully tapped: ${query}`, 'success');
        break;
      }
    }

    if (!submitted) {
      agent.log('Could not find submit button', 'error');
      agent.report.issues.push({
        step: 'Submit',
        issue: 'Submit button not found',
        availableButtons: observation.analysis.buttons
      });
    }

    await agent.act('wait', { ms: 3000 });

    // Observe result
    console.log('\n─────────────────────────────────────────────────────────────────────');
    console.log('STEP 5: Analyze Registration Result');
    console.log('─────────────────────────────────────────────────────────────────────\n');

    observation = await agent.observe('After Submit');
    await agent.saveScreenshot(observation.screenshot, 'step-4-after-submit.png');

    const finalReasoning = await agent.think(observation, { afterSubmit: true });

    agent.log('\n📊 FINAL ANALYSIS:', 'observe');
    agent.log(`Errors: ${observation.analysis.errors.length}`);
    agent.log(`Success indicators: ${observation.analysis.success.length}`);
    agent.log(`Validation messages: ${observation.analysis.validationMessages.length}`);

    if (observation.analysis.errors.length > 0) {
      agent.log('Errors detected:', 'error');
      observation.analysis.errors.forEach(e => agent.log(`  - ${e}`, 'error'));
    }

    if (observation.analysis.success.length > 0) {
      agent.log('Success indicators:', 'success');
      observation.analysis.success.forEach(s => agent.log(`  - ${s}`, 'success'));
    }

    if (observation.analysis.validationMessages.length > 0) {
      agent.log('Validation messages:', 'warning');
      observation.analysis.validationMessages.forEach(v => agent.log(`  - ${v}`, 'warning'));
    }

    // Calculate score
    let score = 100;
    score -= observation.analysis.errors.length * 15;
    score -= agent.report.recoveryActions.length * 10;
    score -= agent.report.issues.length * 10;
    if (observation.analysis.success.length > 0) score += 20;
    
    agent.report.finalScore = Math.max(0, Math.min(100, score));

    // Generate recommendations
    if (agent.report.recoveryActions.some(r => r.type === 'fix_phone_format')) {
      agent.report.recommendations.push({
        priority: 'HIGH',
        issue: 'Phone number validation confusing',
        recommendation: 'Show phone input with country code picker or clear format hint (e.g., "9 digits without leading 0")'
      });
    }

    if (observation.analysis.validationMessages.length > 0 && observation.analysis.errors.length > 0) {
      agent.report.recommendations.push({
        priority: 'HIGH',
        issue: 'Validation errors not clear',
        recommendation: 'Highlight the specific field with error and show actionable message'
      });
    }

    if (observation.analysis.success.length === 0 && submitted) {
      agent.report.recommendations.push({
        priority: 'CRITICAL',
        issue: 'No success confirmation visible',
        recommendation: 'Add clear success message: "Account created! Check your phone for OTP"'
      });
    }

    // End observation
    await client.callTool({ name: 'end_observation_session', arguments: {} });

    // Save report
    const reportDir = resolve(__dirname, '../out/intelligent-simulation');
    mkdirSync(reportDir, { recursive: true });
    const reportPath = resolve(reportDir, 'intelligent-report.json');
    writeFileSync(reportPath, JSON.stringify(agent.report, null, 2));

    // Print summary
    console.log('\n' + '═'.repeat(70));
    console.log('📋 INTELLIGENT SIMULATION REPORT');
    console.log('═'.repeat(70));
    console.log(`\n🎯 Final Score: ${agent.report.finalScore}/100`);
    console.log(`🔄 Recovery Actions: ${agent.report.recoveryActions.length}`);
    console.log(`⚠️  Issues Found: ${agent.report.issues.length}`);
    console.log(`💡 Recommendations: ${agent.report.recommendations.length}`);

    if (agent.report.recommendations.length > 0) {
      console.log('\n📝 Key Recommendations:');
      agent.report.recommendations.forEach((rec, i) => {
        console.log(`\n${i + 1}. [${rec.priority}] ${rec.issue}`);
        console.log(`   → ${rec.recommendation}`);
      });
    }

    console.log(`\n📸 Screenshots saved to: ${reportDir}`);
    console.log(`📄 Full report: ${reportPath}\n`);

    await client.close();

  } catch (error) {
    console.error('\n❌ Simulation failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
runIntelligentSimulation().catch(console.error);
