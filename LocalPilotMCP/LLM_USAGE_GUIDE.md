# LLM Guide: Using ADB MCP Server for Mobile App Testing

## 🎯 Purpose

This MCP server gives you **EYES** and **HANDS** to interact with Android apps. You can:

- 👁️ **See** what's on screen (screenshots + UI elements)
- 📝 **Read** app logs in real-time
- 🖱️ **Tap** buttons and fields
- ⌨️ **Type** text into inputs
- 🔄 **Navigate** through screens
- 🧠 **Reason** about what you see and adapt your actions

## 🚀 Quick Start Pattern

### **Step 1: Start Observation**

```typescript
// Start watching the Expo app
tool: start_observation_for_package;
arguments: {
} // Auto-detects foreground app

// Or specify a specific app
tool: start_observation_for_package;
arguments: {
  package: "host.exp.exponent";
}
```

### **Step 2: Look at the Screen**

```typescript
// Get screenshot + logs
tool: get_current_view
arguments: {
  includeLogs: true,
  maxLogLines: 150
}

// Returns:
// - screenshot (base64 PNG)
// - logs (text with API calls, errors, etc.)
```

### **Step 3: Analyze UI Structure**

```typescript
// Get all UI elements
tool: get_ui_tree;
arguments: {
}

// Returns text like:
// 1. text=Sign Up contentDesc= id=signup_button clickable=y bounds=[100,200][300,250]
// 2. text=Email contentDesc=Email input id=email_field clickable=y bounds=[50,300][350,350]
```

### **Step 4: Take Action**

```typescript
// Tap a button by text/id
tool: tap_by_query;
arguments: {
  query: "sign up";
}

// Type text
tool: type_text;
arguments: {
  value: "john@example.com";
}

// Dismiss keyboard
tool: dismiss_keyboard;
arguments: {
}
```

### **Step 5: Verify & Repeat**

```typescript
// Always observe after actions!
tool: get_current_view;
arguments: {
  includeLogs: true;
}

// Check for errors, success messages, or next steps
tool: get_ui_tree;
arguments: {
}
```

---

## 🧠 Intelligent Testing Pattern (OBSERVE → THINK → ACT)

### **Pattern: Fill a Form Field**

```
1. OBSERVE: What's on screen?
   → get_current_view (see screenshot)
   → get_ui_tree (find input fields)

2. THINK: What do I see?
   → Input field labeled "Email"
   → Current value: empty
   → Keyboard: not visible

3. ACT: Fill the field
   → tap_by_query({ query: "email" })
   → WAIT 500ms
   → type_text({ value: "test@example.com" })
   → dismiss_keyboard

4. VERIFY: Did it work?
   → get_ui_tree (check if field has value)
   → Look for validation errors
   → If error, RECOVER (fix and retry)
```

### **Pattern: Handle Validation Errors**

```
1. OBSERVE after submission
   → get_current_view
   → get_ui_tree

2. LOOK FOR error indicators:
   - Text containing: "error", "invalid", "required", "must"
   - Red text or error icons
   - Validation messages

3. EXAMPLE - Phone Format Error:
   Observation: "Phone number must be exactly 9 digits"
   Current value: "0712345678" (10 digits)

   REASONING:
   - Leading 0 is causing issue
   - Backend expects 9 digits

   RECOVERY:
   → tap_by_query({ query: "phone" })
   → Clear field (select all + delete)
   → type_text({ value: "712345678" }) // 9 digits, no leading 0
   → dismiss_keyboard
   → Retry submit
```

### **Pattern: Navigate Multi-Step Flow**

```
STEP 1: Initial Screen
→ get_current_view
→ get_ui_tree
→ IDENTIFY: "Sign Up" button
→ tap_by_query({ query: "sign up" })
→ WAIT for screen transition

STEP 2: Registration Form
→ get_current_view (verify new screen loaded)
→ get_ui_tree (find all input fields)
→ IDENTIFY fields: name, email, phone, password
→ FILL each field (observe after each)

STEP 3: Submit
→ dismiss_keyboard (see submit button)
→ get_ui_tree (verify submit button visible)
→ tap_by_query({ query: "submit" })
→ WAIT for API call

STEP 4: Verify Result
→ get_current_view (check for success/error)
→ get_ui_tree (look for confirmation message)
→ CHECK logs for API response (200, 400, 500)
→ REPORT findings
```

---

## 🛠️ Available Tools & When to Use Them

### **Observation Tools** (Use FREQUENTLY)

#### `start_observation_for_package`

**When**: At the beginning of your session
**Purpose**: Start capturing logs for the app

```typescript
arguments: {
  package: "host.exp.exponent", // Optional, auto-detects if omitted
  priority: "I" // Log level: V, D, I, W, E, F
}
```

#### `get_current_view` ⭐ **USE THIS CONSTANTLY**

**When**: After EVERY action, before making decisions
**Purpose**: Get screenshot + logs to see current state

```typescript
arguments: {
  includeLogs: true,    // Always true for context
  maxLogLines: 150      // Enough to see API calls
}
```

#### `get_ui_tree` ⭐ **USE BEFORE TAPPING**

**When**: Before tapping, to find exact elements
**Purpose**: Parse all UI elements with their properties

```typescript
arguments: {
}
```

#### `end_observation_session`

**When**: At the end of your session
**Purpose**: Stop log capture

```typescript
arguments: {
}
```

---

### **Interaction Tools** (Use AFTER Observation)

#### `tap_by_query` ⭐ **PRIMARY INTERACTION**

**When**: Need to tap button/field by label
**Purpose**: Find and tap element by text/id/description

```typescript
arguments: {
  query: "sign up",           // Search term (case-insensitive)
  preferClickable: true       // Only tap clickable elements
}
```

**Examples**:

- `{ query: "submit" }` → Taps "Submit" button
- `{ query: "email" }` → Taps email input field
- `{ query: "password" }` → Taps password field

#### `type_text`

**When**: After tapping an input field
**Purpose**: Type text into focused field

```typescript
arguments: {
  value: "john@example.com";
}
```

#### `dismiss_keyboard` ⭐ **USE OFTEN**

**When**: After typing, before looking for buttons
**Purpose**: Hide keyboard to reveal UI below

```typescript
arguments: {
}
```

#### `tap_percent`

**When**: Need to tap specific coordinates
**Purpose**: Tap by percentage (resolution-independent)

```typescript
arguments: {
  xPct: 50,  // 0-100 (50 = center)
  yPct: 50   // 0-100
}
```

#### `swipe_percent`

**When**: Need to scroll or swipe
**Purpose**: Swipe gesture for scrolling

```typescript
arguments: {
  xPct: 50, yPct: 70,    // Start point
  x2Pct: 50, y2Pct: 30,  // End point
  durationMs: 300        // Swipe speed
}
```

**Common patterns**:

- Scroll down: `{ xPct: 50, yPct: 70, x2Pct: 50, y2Pct: 30 }`
- Scroll up: `{ xPct: 50, yPct: 30, x2Pct: 50, y2Pct: 70 }`

#### `wait_for_element`

**When**: Waiting for async UI updates
**Purpose**: Wait until element appears

```typescript
arguments: {
  query: "success",
  timeoutMs: 8000,
  preferClickable: true
}
```

---

### **Advanced Tools**

#### `act_and_view` ⭐ **MACRO TOOL**

**When**: Need multiple actions + final view
**Purpose**: Execute sequence, return final screenshot + logs

```typescript
arguments: {
  actions: [
    { tool: "tap_by_query", args: { query: "email" } },
    { tool: "type_text", args: { value: "test@example.com" } },
    { tool: "dismiss_keyboard", args: {} },
    { tool: "tap_by_query", args: { query: "password" } },
    { tool: "type_text", args: { value: "Pass123!" } },
    { tool: "dismiss_keyboard", args: {} }
  ],
  includeLogs: true,
  maxLogLines: 150
}
```

#### `toggle_expert_mode`

**When**: Want human-like delays and auto-screenshots
**Purpose**: Add delays between actions, auto-capture views

```typescript
arguments: {
  enabled: true,
  autoView: true  // Auto-screenshot after each action
}
```

#### `adb_input`

**When**: Need low-level input (tap coordinates, keyevents)
**Purpose**: Direct ADB input commands

```typescript
arguments: {
  action: "keyevent",
  keycode: "BACK"  // or "ENTER", "HOME", etc.
}
```

---

## 📋 Common Scenarios & Solutions

### **Scenario 1: Element Not Found**

**Problem**: `tap_by_query` fails with "No element matching"

**Solution**:

```
1. get_ui_tree → See what's actually on screen
2. Look for similar labels:
   - "Sign Up" vs "sign up" vs "SignUp"
   - "Continue" vs "Next" vs "Submit"
3. Try alternate queries:
   - query: "sign" (partial match)
   - query: "register"
4. If keyboard is visible:
   → dismiss_keyboard
   → swipe_percent (scroll to reveal element)
   → get_ui_tree (check again)
```

### **Scenario 2: Form Field Won't Fill**

**Problem**: Text not appearing in field

**Solution**:

```
1. Check if field is focused:
   → get_ui_tree (look for focused=true)

2. Tap field explicitly:
   → tap_by_query({ query: "email" })
   → WAIT 500ms
   → type_text({ value: "..." })

3. If still fails:
   → adb_input({ action: "tap", x: X, y: Y })
   → Use tap_percent with coordinates from UI tree
```

### **Scenario 3: Keyboard Blocking UI**

**Problem**: Can't see submit button

**Solution**:

```
1. dismiss_keyboard
2. WAIT 500ms
3. get_ui_tree (verify button now visible)
4. tap_by_query({ query: "submit" })
```

### **Scenario 4: API Validation Error**

**Problem**: Form submits but shows validation error

**Solution**:

```
1. OBSERVE error:
   → get_current_view (read logs for API response)
   → get_ui_tree (read error message on screen)

2. ANALYZE:
   Example: "Phone number must be exactly 9 digits"
   Current input: "0712345678" (10 digits)
   Root cause: Leading 0

3. FIX:
   → tap_by_query({ query: "phone" })
   → Clear field:
     - adb_input({ action: "keyevent", keycode: "MOVE_END" })
     - Multiple: adb_input({ action: "keyevent", keycode: "DEL" })
   → type_text({ value: "712345678" }) // Correct format
   → dismiss_keyboard

4. RETRY:
   → tap_by_query({ query: "submit" })
   → get_current_view (verify success)
```

### **Scenario 5: Stuck/Loading State**

**Problem**: App seems frozen or loading

**Solution**:

```
1. WAIT:
   → Wait 3-5 seconds for API response

2. CHECK LOGS:
   → get_current_view({ includeLogs: true })
   → Look for:
     - API calls: "POST /api/..."
     - Responses: "200 OK" or "400 Bad Request"
     - Errors: "Network error", "Timeout"

3. LOOK FOR INDICATORS:
   → get_ui_tree
   → Find: "Loading", "Please wait", Spinner elements

4. IF TRULY STUCK:
   → adb_input({ action: "keyevent", keycode: "BACK" })
   → Retry flow
```

---

## 🎯 Best Practices for LLMs

### **1. Always Observe Before Acting**

```
❌ BAD:
tap_by_query({ query: "submit" })
tap_by_query({ query: "next" })

✅ GOOD:
get_current_view()
→ Analyze what's on screen
→ Decide next action
→ tap_by_query({ query: "submit" })
→ get_current_view() // Verify it worked
```

### **2. Verify After Every Action**

```
✅ PATTERN:
1. ACTION: tap_by_query({ query: "email" })
2. VERIFY: get_ui_tree() // Is field focused?
3. ACTION: type_text({ value: "..." })
4. VERIFY: get_current_view() // Did text appear?
```

### **3. Read Error Messages Carefully**

```
get_ui_tree() returns:
"5. text=Phone number must be exactly 9 digits contentDesc= ..."

REASONING:
- Validation error is visible
- User entered wrong format
- Need to fix and retry
```

### **4. Use Logs to Understand API Calls**

```
get_current_view({ includeLogs: true }) shows:
"POST /api/v1/public_app/auth/validate_phone HTTP/1.1" 200 38

REASONING:
- API was called successfully (200)
- Phone validation endpoint
- 38 bytes response (likely JSON)
- Check UI for next step (OTP input?)
```

### **5. Be Patient with Animations**

```
✅ GOOD:
tap_by_query({ query: "sign up" })
→ WAIT 1500ms (screen transition)
→ get_current_view() // New screen loaded
→ get_ui_tree() // Parse new UI
→ Continue flow
```

### **6. Handle Multiple Possibilities**

```
// Try multiple button labels
const submitQueries = ["submit", "register", "sign up", "continue", "next"];

for (const query of submitQueries) {
  tap_by_query({ query })
  → get_ui_tree()
  → If new screen appeared, break
}
```

---

## 🧪 Example: Complete Registration Flow

```typescript
// STEP 1: Initialize
start_observation_for_package({ package: "host.exp.exponent" });
toggle_expert_mode({ enabled: true });

// STEP 2: Observe initial state
get_current_view({ includeLogs: false });
get_ui_tree();

// ANALYSIS:
// - Login screen visible
// - "Sign Up" button found
// - Decision: Navigate to registration

// STEP 3: Navigate to registration
tap_by_query({ query: "sign up" });
// WAIT for screen transition (1.5s)
get_current_view({ includeLogs: false });
get_ui_tree();

// ANALYSIS:
// - Registration form visible
// - Fields: name, email, phone, password
// - Decision: Fill each field

// STEP 4: Fill name
tap_by_query({ query: "name" });
type_text({ value: "John Agent" });
dismiss_keyboard();
get_ui_tree(); // Verify name filled

// STEP 5: Fill email
tap_by_query({ query: "email" });
type_text({ value: "john.agent@test.com" });
dismiss_keyboard();
get_ui_tree(); // Verify email filled

// STEP 6: Fill phone
tap_by_query({ query: "phone" });
type_text({ value: "712345678" }); // 9 digits, no leading 0
dismiss_keyboard();
get_ui_tree(); // Check for validation errors

// ANALYSIS OF UI TREE:
// - Error message: "Phone number must be exactly 9 digits"
// - Wait, I entered 9 digits...
// - Check logs for API response

get_current_view({ includeLogs: true });

// LOGS SHOW:
// "POST /api/v1/public_app/auth/validate_phone HTTP/1.1" 400
// Backend rejected it

// REASONING:
// - Phone format might need country code
// - Or different validation rule
// - For now, note this as an issue

// STEP 7: Fill password
tap_by_query({ query: "password" });
type_text({ value: "TestUser123#" });
dismiss_keyboard();

// STEP 8: Submit
get_ui_tree(); // Verify submit button visible
tap_by_query({ query: "submit" });

// STEP 9: Wait and verify
// WAIT 3000ms for API call
get_current_view({ includeLogs: true, maxLogLines: 150 });
get_ui_tree();

// ANALYSIS:
// - Check for success message
// - Check for error messages
// - Check logs for API response
// - Decide next step (OTP screen? Dashboard? Error?)

// STEP 10: Cleanup
end_observation_session();

// STEP 11: Report Findings
// Generate UX report with:
// - Issues found (phone validation)
// - Screenshots captured
// - API responses logged
// - Recommendations for fixes
```

---

## 🎓 Learning Pattern: How to Explore Unknown App

```
1. START BLIND:
   start_observation_for_package({})
   get_current_view({ includeLogs: false })

2. UNDERSTAND SCREEN:
   get_ui_tree()
   → Read all elements
   → Identify: buttons, inputs, labels
   → Build mental model

3. EXPLORE CAUTIOUSLY:
   → Tap obvious CTA buttons
   → After each tap:
     - get_current_view()
     - get_ui_tree()
     - Understand new state

4. BUILD KNOWLEDGE:
   → Map out flow: Screen A → Screen B → Screen C
   → Note patterns: "Sign Up" leads to form
   → Document errors: Phone validation at 9 digits

5. TEST THOROUGHLY:
   → Fill forms with valid data
   → Fill forms with invalid data
   → Observe error handling
   → Check loading states
   → Verify success states
```

---

## 📊 Generating Test Reports

After testing, generate a structured report:

```typescript
{
  "timestamp": "2025-10-19T18:00:00Z",
  "testUser": { /* test data used */ },
  "score": 75, // 0-100
  "issues": [
    {
      "severity": "CRITICAL",
      "screen": "Registration",
      "issue": "Phone validation mismatch",
      "observed": "User enters 0712345678 (10 digits)",
      "error": "Phone number must be exactly 9 digits",
      "fix": "Strip leading 0 before validation OR accept 10-digit format"
    }
  ],
  "recommendations": [
    {
      "priority": "HIGH",
      "issue": "No loading indicator during API calls",
      "recommendation": "Add spinner with 'Creating account...' message"
    }
  ],
  "screenshots": [ /* paths to captured screenshots */ ]
}
```

---

## ⚠️ Common Mistakes to Avoid

### ❌ DON'T: Act Without Observing

```typescript
// Bad: Blind scripting
tap_by_query({ query: "submit" });
tap_by_query({ query: "next" });
tap_by_query({ query: "done" });
// You have no idea what's happening!
```

### ✅ DO: Observe → Think → Act → Verify

```typescript
// Good: Intelligent testing
get_current_view(); // What do I see?
get_ui_tree(); // What can I interact with?
tap_by_query({ query: "submit" }); // Action
get_current_view(); // Did it work? Any errors?
```

### ❌ DON'T: Assume Fixed UI

```typescript
// Bad: Hardcoded coordinates
tap_percent({ xPct: 50, yPct: 80 });
// Breaks if UI changes!
```

### ✅ DO: Use Query-Based Interaction

```typescript
// Good: Semantic targeting
tap_by_query({ query: "submit" });
// Works even if button moves
```

### ❌ DON'T: Ignore Errors

```typescript
// Bad: Continue blindly after error
tap_by_query({ query: "submit" });
tap_by_query({ query: "next" }); // Might not exist if error occurred!
```

### ✅ DO: Handle Errors Intelligently

```typescript
// Good: Check for errors
tap_by_query({ query: "submit" });
const view = get_current_view({ includeLogs: true });
const ui = get_ui_tree();

if (ui.includes("error") || ui.includes("invalid")) {
  // STOP and analyze error
  // Fix the issue
  // Retry
}
```

---

## 🎯 Remember

1. **You have VISION** - Always use `get_current_view` and `get_ui_tree`
2. **Be ADAPTIVE** - Don't follow rigid scripts, react to what you see
3. **Verify EVERYTHING** - After every action, check if it worked
4. **Read ERROR MESSAGES** - They tell you exactly what's wrong
5. **Check LOGS** - API responses reveal backend validation
6. **Be PATIENT** - Wait for animations and API calls
7. **Report CLEARLY** - Document issues with severity and fixes

---

## 🚀 Quick Reference Card

```
START SESSION:
→ start_observation_for_package({})

LOOK:
→ get_current_view({ includeLogs: true })
→ get_ui_tree()

TAP:
→ tap_by_query({ query: "button text" })

TYPE:
→ type_text({ value: "text to enter" })

CLEANUP:
→ dismiss_keyboard()

SCROLL:
→ swipe_percent({ xPct: 50, yPct: 70, x2Pct: 50, y2Pct: 30 })

WAIT:
→ wait_for_element({ query: "text", timeoutMs: 8000 })

END:
→ end_observation_session()
```

---

**Happy Testing! 🎉**

Now go forth and intelligently test mobile apps using your eyes (MCP tools) and brain (reasoning)!
