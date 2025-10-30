# 📱 Screens Organization - PataBima App

## 🏗️ **Folder Structure Overview**

```
src/screens/
├── 📁 main/              # Core navigation screens
├── 📁 auth/              # Authentication flow screens
├── 📁 quotations/        # Insurance quotation screens
├── 📁 admin/             # Administrative screens
├── 📁 testing/           # Development and testing screens
├── 📁 receipts/          # Receipt and document screens
└── 📄 index.js           # Organized exports

Note: Unused screens moved to frontend/_archive/ for cleaner codebase
```

---

## 📂 **Detailed Folder Contents**

### 🏠 **Main Screens** (`main/`)

Core navigation screens for the main application flow:

- **`HomeScreen.js`** - Main dashboard and insurance categories
- **`QuotationsScreen.js`** - List of user's quotations
- **`UpcomingScreen.js`** - Upcoming policies and renewals
- **`MyAccountScreen.js`** - User profile and account settings
- **`ClaimsScreen.js`** - Insurance claims management

### 🔐 **Authentication Screens** (`auth/`)

User authentication and onboarding flow:

- **`SplashScreen.js`** - App loading and initialization
- **`InsuranceWelcomeScreen.js`** - Welcome and app introduction
- **`LoginScreen.js`** - User login form
- **`SignupScreen.js`** - User registration form
- **`ForgotPasswordScreen.js`** - Password recovery flow

### 📄 **Quotation Screens** (`quotations/`)

Insurance type-specific quotation forms:

- **`MotorQuotationScreen.js`** - Motor vehicle insurance quotes
- **`MedicalQuotationScreen.js`** - Medical insurance quotes
- **`WIBAQuotationScreen.js`** - Work Injury Benefits Act quotes
- **`TravelQuotationScreen.js`** - Travel insurance quotes
- **`PersonalAccidentQuotationScreen.js`** - Personal accident quotes
- **`LastExpenseQuotationScreen.js`** - Last expense insurance quotes
- **`QuoteComparisonScreen.js`** - Compare multiple quotes

### 👨‍💼 **Admin Screens** (`admin/`)

Administrative functionality and management:

- **`AdminPricingScreen.js`** - Pricing management interface
- **`AdminPricingScreenAWS.js`** - AWS-integrated pricing management

### 🗃️ **Archive** (`_archive/`)

Backup and legacy files (not actively used):

- **`MotorQuotationScreenNew.js`** - Alternative motor quotation implementation
- **`MotorQuotationScreen_backup.js`** - Previous version backup
- **`MotorQuotationScreen_new.js`** - Development version
- **`InsuranceWelcomeScreenV2.js`** - Second version of welcome screen
- **`InsuranceWelcomeScreenV3.js`** - Third version of welcome screen

---

## 📋 **Export Organization**

### **Main Index (`index.js`):**

Provides multiple export patterns for flexibility:

1. **Folder-based exports** - `export * from './main'`
2. **Named exports** - `export { HomeScreen, QuotationsScreen } from './main'`
3. **Backward compatibility** - All original import paths still work

### **Subfolder Indices:**

Each folder has its own `index.js` with clear documentation:

- `main/index.js` - Main app screens
- `auth/index.js` - Authentication screens
- `quotations/index.js` - Quotation screens
- `admin/index.js` - Admin screens

---

## 🔄 **Import Patterns**

### **Recommended (Organized):**

```javascript
// Import by category
import { HomeScreen, QuotationsScreen } from "../screens/main";
import { LoginScreen, SignupScreen } from "../screens/auth";
import { MotorQuotationScreen } from "../screens/quotations";

// Or import all from main index
import { HomeScreen, LoginScreen, MotorQuotationScreen } from "../screens";
```

### **Legacy (Still Supported):**

```javascript
// Original import pattern still works
import { HomeScreen, QuotationsScreen, MotorQuotationScreen } from "../screens";
```

---

## 🎯 **Benefits of This Organization**

### **🔍 Better Navigation:**

- Clear separation of concerns
- Easy to find specific screen types
- Logical folder grouping

### **👥 Team Collaboration:**

- Clear ownership by feature area
- Easier code reviews
- Reduced merge conflicts

### **🔧 Maintenance:**

- Easier to add new screens
- Clear patterns to follow
- Better code organization

### **🚀 Scalability:**

- Room for growth in each category
- Clear structure for new features
- Easy to split into modules later

---

## 📝 **Adding New Screens**

### **1. Choose the Right Folder:**

- **Main screens** → `main/` (core navigation)
- **Auth flows** → `auth/` (login/signup related)
- **Quote forms** → `quotations/` (insurance type forms)
- **Admin tools** → `admin/` (management interfaces)

### **2. Create the Screen:**

```javascript
// NewScreen.js
import React from "react";
import { View, Text } from "react-native";

export default function NewScreen() {
  return (
    <View>
      <Text>New Screen</Text>
    </View>
  );
}
```

### **3. Add to Folder Index:**

```javascript
// folder/index.js
export { default as NewScreen } from "./NewScreen";
```

### **4. Main index updates automatically** (via `export *`)

---

## 🔧 **Maintenance Guidelines**

### **✅ Do:**

- Keep screens in appropriate folders
- Update folder index when adding screens
- Document new screen purposes
- Follow existing naming conventions

### **❌ Don't:**

- Move files without updating imports
- Delete archived files without consideration
- Mix screen types in wrong folders
- Skip updating index files

---

## 🎉 **Migration Notes**

### **What Changed:**

- Files moved to organized folders
- New index file structure
- Archive folder for old files
- Better import patterns

### **What Stayed the Same:**

- All existing imports still work
- No breaking changes to components
- Same screen functionality
- Original file names preserved

---

## 📊 **Screen Statistics**

- **Total Active Screens**: 17
- **Main Navigation**: 5 screens
- **Authentication Flow**: 5 screens
- **Quotation Forms**: 7 screens
- **Admin Interfaces**: 2 screens
- **Archived Files**: 5 files

---

_Last Updated: July 13, 2025_  
_Organization completed during PataBima project cleanup_  
_All imports tested and verified working_
