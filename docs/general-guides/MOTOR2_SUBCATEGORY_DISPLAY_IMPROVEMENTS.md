# Motor 2 UI Improvements - Subcategory Display & Button Sizing

## Overview

Enhanced the Motor 2 flow with global subcategory display and improved button sizing for better user experience.

## Changes Implemented

### 1. Global Subcategory Header Display

**Location**: `MotorInsuranceScreen.js`

- **Added**: Global subcategory/product name display above progress indicators
- **Positioning**: Appears on all Motor 2 steps between main title and progress steps
- **Display Logic**: Shows `selectedProductMemo.name` (display name) or falls back to `selectedProductMemo.code`
- **Examples**: "Private Third-Party", "TOR", "Comprehensive", etc.

**Visual Design**:

```javascript
subcategoryHeader: {
  backgroundColor: '#f8f9fa',
  marginHorizontal: -16,
  paddingHorizontal: 16,
  paddingVertical: 12,
  marginBottom: 16,
  borderRadius: 8,
  borderLeftWidth: 4,
  borderLeftColor: '#D5222B'  // Brand color accent
}
```

### 2. Documents Section Cleanup

**Location**: `DocumentsUpload.js`

- **Removed**: "Required Documents" title and subtitle text
- **Removed**: "Upload the following documents to complete your application" description
- **Kept**: Progress counter showing "X of Y documents uploaded"
- **Reason**: Subcategory name now shows globally, eliminating redundancy

### 3. Medium-Sized Next Button

**Location**: `MotorInsuranceScreen.js` NavigationButtons component

- **Reduced**: Button padding from `paddingVertical: 12` to `paddingVertical: 10`
- **Added**: Horizontal padding `paddingHorizontal: 24`
- **Added**: Maximum width constraint `maxWidth: 200`
- **Added**: Center alignment `alignSelf: 'center'`
- **Added**: `fullWidthNext` style for full-width scenarios

## UI Flow Improvements

### Before:

```
Motor Insurance
[Progress Indicators]
Required Documents
Upload the following documents...
[Large Next Button]
```

### After:

```
Motor Insurance
Private Third-Party      [Highlighted with brand accent]
[Progress Indicators]
3 of 3 documents uploaded
[Medium Next Button - Centered]
```

## Technical Benefits

### 1. **Consistent Product Context**

- Users always see which insurance product they're quoting
- Reduces confusion when switching between different products
- Maintains context throughout the multi-step flow

### 2. **Cleaner UI Design**

- Removed redundant "Required Documents" header
- More focused document upload section
- Better visual hierarchy with global product display

### 3. **Improved Button Ergonomics**

- Medium-sized button is less overwhelming
- Better tap target for mobile users
- Centered positioning improves visual balance

### 4. **Display Name Priority**

- Shows user-friendly names: "Private Third-Party" vs "PRIVATE_THIRD_PARTY"
- Fallback to code ensures something always displays
- Consistent with business terminology

## Code Structure

### Subcategory Display Logic

```javascript
{
  (selectedProductMemo?.name || selectedProductMemo?.code) && (
    <View style={styles.subcategoryHeader}>
      <Text style={styles.subcategoryTitle}>
        {selectedProductMemo.name || selectedProductMemo.code}
      </Text>
    </View>
  );
}
```

### Button Sizing Update

```javascript
nextButton: {
  flex: 1,
  backgroundColor: '#D5222B',
  paddingVertical: 10,        // Reduced from 12
  paddingHorizontal: 24,      // Added horizontal padding
  borderRadius: 8,
  alignItems: 'center',
  maxWidth: 200,             // Medium size constraint
  alignSelf: 'center'        // Center alignment
}
```

## User Experience Impact

### 1. **Better Navigation Context**

- Users always know which product they're configuring
- Reduced cognitive load during multi-step process
- Clear visual separation between different insurance types

### 2. **Streamlined Document Flow**

- Focus on actual document upload rather than redundant headers
- Progress indicator is primary feedback mechanism
- Cleaner, more professional appearance

### 3. **Improved Mobile Usability**

- Medium button size prevents accidental taps
- Better finger reach on various screen sizes
- More balanced visual weight in the interface

## Files Modified

1. **MotorInsuranceScreen.js**

   - Added global subcategory header
   - Updated button styling
   - Added fullWidthNext style

2. **DocumentsUpload.js**
   - Removed "Required Documents" section
   - Kept progress tracking
   - Added productTitle style (unused but available)

## Status: ✅ COMPLETE

All requested changes have been implemented:

- ✅ Subcategory name displays globally across all Motor 2 steps
- ✅ Shows display name (not code) with fallback handling
- ✅ Removed redundant "Required Documents" section
- ✅ Next button reduced to medium size with improved styling
- ✅ No compilation errors, ready for production use
