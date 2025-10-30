# Design System Implementation - PataBima Frontend

## 🎯 Objective

Implement a comprehensive design system for the PataBima React Native app to ensure consistent styling, typography, spacing, and component design across all screens, particularly in `frontend/screens/quotations/`.

## 🏗️ Architecture: Hybrid Approach

**Theme Constants** (centralized tokens) + **Shared Components** (reusable UI elements)

## 📋 Implementation Phases

### Phase 1: Audit Current Styles ✅ CRITICAL FIRST STEP

**Goal:** Document all existing styles to identify inconsistencies and create baseline.

**Tasks:**

1. **Run Style Audit Script**

   ```bash
   cd frontend
   # Scan all quotations screens
   grep -r "fontSize:" screens/quotations/ > style-audit-fonts.txt
   grep -r "color:" screens/quotations/ > style-audit-colors.txt
   grep -r "padding\|margin:" screens/quotations/ > style-audit-spacing.txt
   ```

2. **Document Findings in Spreadsheet**
   Create `docs/STYLE_AUDIT.md`:

   - List all unique font sizes used (e.g., 10, 11, 12, 14, 16, 18, 20, 24, etc.)
   - List all colors used (hex codes)
   - List all spacing values (margins, paddings, gaps)
   - List all button styles
   - List all card styles
   - List all input field styles

3. **Identify Inconsistencies**
   - Note where same semantic element has different styles (e.g., H1 is 24px in one screen, 26px in another)
   - Flag redundant/similar values (e.g., fontSize: 13 vs 14 - can be unified)

**Deliverable:** `docs/STYLE_AUDIT.md` with current state analysis

---

### Phase 2: Define Theme Tokens 🎨

**Goal:** Create single source of truth for all design tokens.

**File Structure:**

```
frontend/
└── theme/
    ├── index.js           # Main export
    ├── colors.js          # Color palette
    ├── typography.js      # Font system
    ├── spacing.js         # Spacing scale
    ├── shadows.js         # Shadow presets
    ├── borders.js         # Border radius, widths
    └── README.md          # Usage documentation
```

#### 2.1 Create `frontend/theme/colors.js`

```javascript
// PataBima Brand Colors - DO NOT MODIFY without approval
export const BRAND = {
  primary: "#D5222B", // PataBima Red
  primaryDark: "#B01D24", // Darker red for pressed states
  primaryLight: "#FF4D4D", // Lighter red for backgrounds

  secondary: "#646767", // PataBima Gray
  secondaryDark: "#4A4C4C",
  secondaryLight: "#8A8C8C",
};

// Semantic Colors - Based on usage
export const SEMANTIC = {
  success: "#28a745", // Green for success states
  successLight: "#D4EDDA",

  error: "#DC3545", // Red for errors
  errorLight: "#F8D7DA",

  warning: "#FFC107", // Yellow for warnings
  warningLight: "#FFF3CD",

  info: "#17A2B8", // Blue for info
  infoLight: "#D1ECF1",
};

// UI Colors - Interface elements
export const UI = {
  background: "#F8F9FA", // App background
  surface: "#FFFFFF", // Card/surface background
  border: "#E9ECEF", // Borders
  divider: "#DEE2E6", // Dividers

  textPrimary: "#2C3E50", // Main text
  textSecondary: "#646767", // Secondary text
  textTertiary: "#6C757D", // Disabled/placeholder text
  textLight: "#ADB5BD", // Very light text

  inputBackground: "#FFFFFF",
  inputBorder: "#CED4DA",
  inputBorderFocus: "#D5222B",
  inputBorderError: "#DC3545",
};

// Status Colors - For badges, indicators
export const STATUS = {
  active: "#28A745",
  pending: "#FFC107",
  rejected: "#DC3545",
  completed: "#17A2B8",
};

// Export all
export default {
  BRAND,
  SEMANTIC,
  UI,
  STATUS,
};
```

**⚠️ ERROR PREVENTION:**

- Use UPPERCASE constants to prevent accidental modification
- Add JSDoc comments for each color explaining when to use
- Never use hex codes directly in screens - always import from this file

---

#### 2.2 Create `frontend/theme/typography.js`

```javascript
/**
 * Typography System - PataBima
 *
 * Font Family: Poppins (already loaded in app)
 * Scale: Based on 4px baseline grid
 *
 * USAGE:
 * import { FONT_SIZES, FONT_WEIGHTS, LINE_HEIGHTS } from '../theme/typography';
 *
 * style={{
 *   fontSize: FONT_SIZES.h1,
 *   fontWeight: FONT_WEIGHTS.bold
 * }}
 */

// Font Sizes - Based on semantic usage
export const FONT_SIZES = {
  // Headings
  h1: 24, // Page titles
  h2: 20, // Section headings
  h3: 18, // Subsection headings
  h4: 16, // Card titles

  // Body text
  body: 14, // Standard body text
  bodyLarge: 16, // Emphasized body text
  bodySmall: 12, // Small body text

  // UI Elements
  button: 16, // Button text
  buttonSmall: 14, // Small button text
  input: 14, // Input field text
  label: 14, // Form labels
  caption: 12, // Captions, helper text
  badge: 12, // Badge text
  tiny: 10, // Very small text (use sparingly)
};

// Font Weights
export const FONT_WEIGHTS = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
};

// Line Heights - Multipliers of font size
export const LINE_HEIGHTS = {
  tight: 1.2, // Headings
  normal: 1.5, // Body text
  relaxed: 1.7, // Comfortable reading
};

// Letter Spacing
export const LETTER_SPACING = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
};

// Font Families (Poppins loaded via expo-font)
export const FONT_FAMILIES = {
  regular: "Poppins",
  medium: "Poppins-Medium",
  semibold: "Poppins-SemiBold",
  bold: "Poppins-Bold",
};

// Preset Text Styles - Common combinations
export const TEXT_PRESETS = {
  h1: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: FONT_SIZES.h1,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES.h1 * LINE_HEIGHTS.tight,
    color: "#2C3E50",
  },
  h2: {
    fontFamily: FONT_FAMILIES.bold,
    fontSize: FONT_SIZES.h2,
    fontWeight: FONT_WEIGHTS.bold,
    lineHeight: FONT_SIZES.h2 * LINE_HEIGHTS.tight,
    color: "#2C3E50",
  },
  h3: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.h3,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.h3 * LINE_HEIGHTS.tight,
    color: "#2C3E50",
  },
  body: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.body * LINE_HEIGHTS.normal,
    color: "#2C3E50",
  },
  bodyBold: {
    fontFamily: FONT_FAMILIES.semibold,
    fontSize: FONT_SIZES.body,
    fontWeight: FONT_WEIGHTS.semibold,
    lineHeight: FONT_SIZES.body * LINE_HEIGHTS.normal,
    color: "#2C3E50",
  },
  caption: {
    fontFamily: FONT_FAMILIES.regular,
    fontSize: FONT_SIZES.caption,
    fontWeight: FONT_WEIGHTS.regular,
    lineHeight: FONT_SIZES.caption * LINE_HEIGHTS.normal,
    color: "#646767",
  },
};

export default {
  FONT_SIZES,
  FONT_WEIGHTS,
  LINE_HEIGHTS,
  LETTER_SPACING,
  FONT_FAMILIES,
  TEXT_PRESETS,
};
```

**⚠️ ERROR PREVENTION:**

- Never use arbitrary font sizes (e.g., 13, 15, 17) - stick to the scale
- Always use named constants, not magic numbers
- Add comments explaining when to use each size
- Use TEXT_PRESETS for common patterns to reduce repetition

---

#### 2.3 Create `frontend/theme/spacing.js`

```javascript
/**
 * Spacing System - PataBima
 *
 * Based on 4px baseline grid
 * All spacing values are multiples of 4
 *
 * USAGE:
 * import { SPACING } from '../theme/spacing';
 *
 * style={{ padding: SPACING.md, marginBottom: SPACING.lg }}
 */

// Spacing Scale - Multiples of 4
export const SPACING = {
  xxs: 2, // 2px - Very tight spacing
  xs: 4, // 4px - Tight spacing
  sm: 8, // 8px - Small spacing
  md: 12, // 12px - Medium spacing (default)
  lg: 16, // 16px - Large spacing
  xl: 20, // 20px - Extra large spacing
  xxl: 24, // 24px - Double extra large
  xxxl: 32, // 32px - Huge spacing
  huge: 40, // 40px - Very large gaps
};

// Border Radius Scale
export const BORDER_RADIUS = {
  none: 0,
  sm: 4, // Small radius
  md: 8, // Medium radius (default for inputs)
  lg: 12, // Large radius (default for cards)
  xl: 16, // Extra large radius
  full: 9999, // Fully rounded (pills, circles)
};

// Border Width
export const BORDER_WIDTH = {
  thin: 1,
  medium: 2,
  thick: 3,
};

// Safe Area Insets (for device notches, home indicators)
export const SAFE_AREA = {
  top: 16,
  bottom: 20,
  horizontal: 16,
};

export default {
  SPACING,
  BORDER_RADIUS,
  BORDER_WIDTH,
  SAFE_AREA,
};
```

**⚠️ ERROR PREVENTION:**

- Never use spacing values not in the scale (e.g., 6px, 10px, 15px)
- Use semantic names (sm, md, lg) instead of pixel values in code
- Document when to use each spacing size

---

#### 2.4 Create `frontend/theme/shadows.js`

```javascript
/**
 * Shadow System - PataBima
 *
 * Consistent shadows for cards, buttons, modals
 * Separate values for iOS (shadowColor, shadowOffset, etc.) and Android (elevation)
 */

export const SHADOWS = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },

  sm: {
    // Subtle shadow for small cards
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },

  md: {
    // Default shadow for cards
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  lg: {
    // Elevated cards, modals
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },

  // Colored shadows for brand elements
  brandShadow: {
    shadowColor: "#D5222B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
};

export default SHADOWS;
```

---

#### 2.5 Create `frontend/theme/index.js`

```javascript
/**
 * PataBima Theme System
 *
 * Central export for all design tokens
 *
 * USAGE:
 * import { colors, typography, spacing, shadows } from '../theme';
 *
 * OR import specific modules:
 * import { BRAND, SEMANTIC } from '../theme/colors';
 */

import colors from "./colors";
import typography from "./typography";
import spacing from "./spacing";
import shadows from "./shadows";

// Export individual modules
export { colors, typography, spacing, shadows };

// Export specific constants for convenience
export { BRAND, SEMANTIC, UI, STATUS } from "./colors";
export {
  FONT_SIZES,
  FONT_WEIGHTS,
  TEXT_PRESETS,
  FONT_FAMILIES,
} from "./typography";
export { SPACING, BORDER_RADIUS, BORDER_WIDTH } from "./spacing";
export { SHADOWS } from "./shadows";

// Default export
export default {
  colors,
  typography,
  spacing,
  shadows,
};
```

---

### Phase 3: Build Shared Components 🧩

**Goal:** Create reusable, consistently styled components.

**File Structure:**

```
frontend/components/common/
├── index.js
├── Button.js
├── Card.js
├── Text.js
├── Heading.js
├── Input.js
├── Badge.js
├── Divider.js
└── StepIndicator.js
```

#### 3.1 Create `frontend/components/common/Text.js`

```javascript
import React from "react";
import { Text as RNText, StyleSheet } from "react-native";
import { TEXT_PRESETS } from "../../theme/typography";

/**
 * Text Component - PataBima Design System
 *
 * Ensures consistent typography across the app
 *
 * USAGE:
 * <Text variant="body">Regular text</Text>
 * <Text variant="bodyBold" color="#D5222B">Bold red text</Text>
 * <Text variant="caption">Small caption</Text>
 */

const Text = ({
  variant = "body", // body, bodyBold, caption, etc.
  color,
  style,
  children,
  ...props
}) => {
  const textStyle = [
    TEXT_PRESETS[variant] || TEXT_PRESETS.body,
    color && { color },
    style,
  ];

  return (
    <RNText style={textStyle} {...props}>
      {children}
    </RNText>
  );
};

export default Text;
```

**⚠️ ERROR PREVENTION:**

- Always use variant prop instead of inline fontSize
- Color prop is optional - defaults to preset color
- Warn if invalid variant is used (add PropTypes or TypeScript)

---

#### 3.2 Create `frontend/components/common/Heading.js`

```javascript
import React from "react";
import { Text, StyleSheet } from "react-native";
import { TEXT_PRESETS } from "../../theme/typography";
import { UI } from "../../theme/colors";

/**
 * Heading Component - PataBima Design System
 *
 * Semantic heading components for consistent hierarchy
 *
 * USAGE:
 * <Heading level={1}>Page Title</Heading>
 * <Heading level={2}>Section Heading</Heading>
 * <Heading level={3} color="#D5222B">Custom Color</Heading>
 */

const Heading = ({
  level = 1, // 1, 2, 3, 4
  color,
  style,
  children,
  ...props
}) => {
  const presetKey = `h${level}`;
  const headingStyle = [
    TEXT_PRESETS[presetKey] || TEXT_PRESETS.h1,
    color && { color },
    style,
  ];

  return (
    <Text style={headingStyle} {...props}>
      {children}
    </Text>
  );
};

export default Heading;
```

---

#### 3.3 Create `frontend/components/common/Button.js`

```javascript
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { BRAND, UI } from "../../theme/colors";
import { FONT_SIZES, FONT_WEIGHTS } from "../../theme/typography";
import { SPACING, BORDER_RADIUS } from "../../theme/spacing";
import { SHADOWS } from "../../theme/shadows";

/**
 * Button Component - PataBima Design System
 *
 * Consistent button styles with variants
 *
 * USAGE:
 * <Button onPress={handleSubmit}>Submit</Button>
 * <Button variant="secondary" onPress={handleCancel}>Cancel</Button>
 * <Button variant="outline" onPress={handleBack}>Back</Button>
 * <Button loading disabled>Processing...</Button>
 */

const Button = ({
  variant = "primary", // primary, secondary, outline, ghost
  size = "medium", // small, medium, large
  loading = false,
  disabled = false,
  onPress,
  children,
  style,
  textStyle,
  ...props
}) => {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[size],
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    (disabled || loading) && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#FFF" : BRAND.primary}
          size="small"
        />
      ) : (
        <Text style={textStyles}>{children}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },

  // Variants
  primary: {
    backgroundColor: BRAND.primary,
    ...SHADOWS.sm,
  },
  secondary: {
    backgroundColor: UI.surface,
    borderWidth: 1,
    borderColor: UI.border,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: UI.inputBorder,
  },
  ghost: {
    backgroundColor: "transparent",
  },

  // Sizes
  small: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  medium: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  large: {
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
  },

  // Disabled state
  disabled: {
    opacity: 0.5,
    backgroundColor: UI.border,
  },

  // Text styles
  text: {
    fontSize: FONT_SIZES.button,
    fontWeight: FONT_WEIGHTS.semibold,
  },
  primaryText: {
    color: "#FFFFFF",
  },
  secondaryText: {
    color: UI.textPrimary,
  },
  outlineText: {
    color: UI.textPrimary,
  },
  ghostText: {
    color: BRAND.primary,
  },
  disabledText: {
    color: UI.textTertiary,
  },

  // Size-specific text
  smallText: {
    fontSize: FONT_SIZES.buttonSmall,
  },
  mediumText: {
    fontSize: FONT_SIZES.button,
  },
  largeText: {
    fontSize: FONT_SIZES.button,
  },
});

export default Button;
```

**⚠️ ERROR PREVENTION:**

- Always use variant prop, never create custom button styles inline
- Disabled and loading states are handled automatically
- Add PropTypes to catch invalid variant/size values

---

#### 3.4 Create `frontend/components/common/Card.js`

```javascript
import React from "react";
import { View, StyleSheet } from "react-native";
import { UI } from "../../theme/colors";
import { SPACING, BORDER_RADIUS } from "../../theme/spacing";
import { SHADOWS } from "../../theme/shadows";

/**
 * Card Component - PataBima Design System
 *
 * Consistent card container with optional shadow
 *
 * USAGE:
 * <Card>
 *   <Text>Card content</Text>
 * </Card>
 *
 * <Card shadow="lg" padding="lg">
 *   <Text>Elevated card with large padding</Text>
 * </Card>
 */

const Card = ({
  children,
  shadow = "md", // none, sm, md, lg
  padding = "md", // sm, md, lg, xl, none
  style,
  ...props
}) => {
  const cardStyles = [
    styles.base,
    shadow && SHADOWS[shadow],
    padding !== "none" && { padding: SPACING[padding] },
    style,
  ];

  return (
    <View style={cardStyles} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: UI.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: UI.border,
  },
});

export default Card;
```

---

#### 3.5 Create `frontend/components/common/Input.js`

```javascript
import React from "react";
import { TextInput, View, Text, StyleSheet } from "react-native";
import { UI } from "../../theme/colors";
import { FONT_SIZES, FONT_WEIGHTS } from "../../theme/typography";
import { SPACING, BORDER_RADIUS, BORDER_WIDTH } from "../../theme/spacing";

/**
 * Input Component - PataBima Design System
 *
 * Consistent form input with label and error states
 *
 * USAGE:
 * <Input
 *   label="Email Address"
 *   value={email}
 *   onChangeText={setEmail}
 *   placeholder="Enter your email"
 *   error="Invalid email format"
 * />
 */

const Input = ({
  label,
  error,
  value,
  onChangeText,
  placeholder,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.input, error && styles.inputError, style]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={UI.textTertiary}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.label,
    fontWeight: FONT_WEIGHTS.semibold,
    color: UI.textPrimary,
    marginBottom: SPACING.xs,
  },
  input: {
    backgroundColor: UI.inputBackground,
    borderWidth: BORDER_WIDTH.thin,
    borderColor: UI.inputBorder,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    fontSize: FONT_SIZES.input,
    color: UI.textPrimary,
  },
  inputError: {
    borderColor: UI.inputBorderError,
    borderWidth: BORDER_WIDTH.medium,
  },
  errorText: {
    fontSize: FONT_SIZES.caption,
    color: UI.inputBorderError,
    marginTop: SPACING.xs,
  },
});

export default Input;
```

---

#### 3.6 Create `frontend/components/common/Badge.js`

```javascript
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { STATUS, SEMANTIC, UI } from "../../theme/colors";
import { FONT_SIZES, FONT_WEIGHTS } from "../../theme/typography";
import { SPACING, BORDER_RADIUS } from "../../theme/spacing";

/**
 * Badge Component - PataBima Design System
 *
 * Status badges for various states
 *
 * USAGE:
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning">Pending</Badge>
 * <Badge variant="error">Rejected</Badge>
 */

const Badge = ({
  variant = "default", // success, warning, error, info, default
  children,
  style,
  textStyle,
  ...props
}) => {
  return (
    <View style={[styles.badge, styles[variant], style]} {...props}>
      <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xxs,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: FONT_SIZES.badge,
    fontWeight: FONT_WEIGHTS.medium,
  },

  // Variants
  default: {
    backgroundColor: UI.border,
  },
  defaultText: {
    color: UI.textSecondary,
  },

  success: {
    backgroundColor: SEMANTIC.successLight,
  },
  successText: {
    color: SEMANTIC.success,
  },

  warning: {
    backgroundColor: SEMANTIC.warningLight,
  },
  warningText: {
    color: "#856404",
  },

  error: {
    backgroundColor: SEMANTIC.errorLight,
  },
  errorText: {
    color: SEMANTIC.error,
  },

  info: {
    backgroundColor: SEMANTIC.infoLight,
  },
  infoText: {
    color: SEMANTIC.info,
  },
});

export default Badge;
```

---

#### 3.7 Create `frontend/components/common/index.js`

```javascript
/**
 * Common Components - PataBima Design System
 *
 * Centralized export for all shared components
 */

export { default as Button } from "./Button";
export { default as Card } from "./Card";
export { default as Text } from "./Text";
export { default as Heading } from "./Heading";
export { default as Input } from "./Input";
export { default as Badge } from "./Badge";
```

---

### Phase 4: Refactor Screens Iteratively 🔄

**Goal:** Replace inline styles with theme + components.

**Strategy:** One screen at a time, test thoroughly, then move to next.

#### 4.1 Start with Motor Insurance Screen

**Before:**

```javascript
<Text style={{ fontSize: 24, fontWeight: "700", color: "#D5222B" }}>
  Motor Insurance
</Text>
```

**After:**

```javascript
import { Heading } from "../../components/common";
import { BRAND } from "../../theme/colors";

<Heading level={1} color={BRAND.primary}>
  Motor Insurance
</Heading>;
```

#### 4.2 Refactor Buttons

**Before:**

```javascript
<TouchableOpacity
  style={{
    backgroundColor: "#D5222B",
    padding: 12,
    borderRadius: 8,
  }}
>
  <Text style={{ color: "#fff", fontWeight: "600" }}>Next</Text>
</TouchableOpacity>
```

**After:**

```javascript
import { Button } from "../../components/common";

<Button variant="primary" onPress={onNext}>
  Next
</Button>;
```

#### 4.3 Refactor Cards

**Before:**

```javascript
<View
  style={{
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    elevation: 3,
  }}
>
  {/* Content */}
</View>
```

**After:**

```javascript
import { Card } from "../../components/common";

<Card shadow="md" padding="lg">
  {/* Content */}
</Card>;
```

---

### Phase 5: Documentation 📚

Create `frontend/theme/README.md` with:

````markdown
# PataBima Design System

## Quick Start

### Using Theme Tokens

\`\`\`javascript
import { BRAND, SPACING, FONT_SIZES } from '../theme';

const styles = StyleSheet.create({
container: {
padding: SPACING.md,
backgroundColor: BRAND.primary,
},
title: {
fontSize: FONT_SIZES.h1,
},
});
\`\`\`

### Using Shared Components

\`\`\`javascript
import { Button, Card, Heading, Text } from '../components/common';

<Card>
  <Heading level={1}>Welcome</Heading>
  <Text variant="body">This is consistent text</Text>
  <Button onPress={handleSubmit}>Submit</Button>
</Card>
\`\`\`

## Color System

- **Primary Brand:** `BRAND.primary` (#D5222B)
- **Text:** `UI.textPrimary` (#2C3E50)
- **Success:** `SEMANTIC.success` (#28a745)

## Typography Scale

- **H1:** 24px - Page titles
- **H2:** 20px - Section headings
- **Body:** 14px - Standard text
- **Caption:** 12px - Helper text

## Spacing Scale

- **sm:** 8px
- **md:** 12px
- **lg:** 16px
- **xl:** 20px

## Component Library

### Button

- Variants: primary, secondary, outline, ghost
- Sizes: small, medium, large
- Auto-handles loading and disabled states

### Card

- Consistent elevation and borders
- Customizable shadow and padding

### Input

- Built-in label and error handling
- Consistent styling across all forms

## Rules

1. ✅ **DO** use theme constants
2. ✅ **DO** use shared components
3. ❌ **DON'T** use inline magic numbers for fonts/spacing
4. ❌ **DON'T** use hex codes directly in screens
5. ❌ **DON'T** create custom button styles inline
   \`\`\`

---

## ⚠️ Common Errors & Prevention

### Error 1: Mixing Old and New Styles

**Problem:**

```javascript
<View style={{ padding: 15 }}>
  {" "}
  // Old: magic number
  <Text>Hello</Text>
</View>
```
````

**Solution:**

```javascript
import { SPACING } from "../theme";

<View style={{ padding: SPACING.lg }}>
  <Text>Hello</Text>
</View>;
```

**Prevention:**

- Use ESLint rule to flag magic numbers
- Code review checklist includes theme usage

---

### Error 2: Inconsistent Font Sizes

**Problem:**
Different screens using 13, 14, 15px for "body text"

**Solution:**
Always use `FONT_SIZES.body` (14px) or `<Text variant="body">`

**Prevention:**

- Audit phase documents all current sizes
- Create migration checklist per screen
- Use shared Text component

---

### Error 3: Copy-Paste Styling

**Problem:**
Duplicating button styles across 10 screens

**Solution:**
Use `<Button variant="primary">` component

**Prevention:**

- Document all shared components
- Easy-to-find examples in README
- Encourage component usage in code reviews

---

### Error 4: Forgetting to Import Theme

**Problem:**

```javascript
style={{ color: '#D5222B' }}  // Hardcoded!
```

**Solution:**

```javascript
import { BRAND } from '../theme/colors';
style={{ color: BRAND.primary }}
```

**Prevention:**

- Add import snippet to VS Code
- ESLint rule to warn on hex codes outside theme folder

---

### Error 5: Breaking Changes to Theme

**Problem:**
Changing `BRAND.primary` from red to blue breaks entire app

**Solution:**

- Theme constants are frozen (Object.freeze)
- Major color changes require approval
- Use semantic color names (not "red", "blue")

**Prevention:**

- Document "DO NOT MODIFY" in theme files
- Version control with change log
- Test suite validates color contrast ratios

---

## 📋 Implementation Checklist

### Phase 1: Audit

- [ ] Scan all quotations screens
- [ ] Document font sizes used
- [ ] Document colors used
- [ ] Document spacing values
- [ ] Create `docs/STYLE_AUDIT.md`

### Phase 2: Theme Tokens

- [ ] Create `frontend/theme/` folder
- [ ] Create `colors.js`
- [ ] Create `typography.js`
- [ ] Create `spacing.js`
- [ ] Create `shadows.js`
- [ ] Create `index.js`
- [ ] Add JSDoc comments
- [ ] Verify imports work

### Phase 3: Shared Components

- [ ] Create `frontend/components/common/` folder
- [ ] Create `Button.js`
- [ ] Create `Card.js`
- [ ] Create `Text.js`
- [ ] Create `Heading.js`
- [ ] Create `Input.js`
- [ ] Create `Badge.js`
- [ ] Create `index.js`
- [ ] Test each component in isolation
- [ ] Add PropTypes or TypeScript types

### Phase 4: Screen Refactoring

- [ ] Identify pilot screen (Motor Insurance recommended)
- [ ] Replace heading styles with `<Heading>` component
- [ ] Replace text styles with `<Text>` component
- [ ] Replace buttons with `<Button>` component
- [ ] Replace cards with `<Card>` component
- [ ] Replace inputs with `<Input>` component
- [ ] Test screen thoroughly
- [ ] Document changes in commit message
- [ ] Move to next screen
- [ ] Repeat for all quotations screens

### Phase 5: Documentation

- [ ] Create `frontend/theme/README.md`
- [ ] Add usage examples
- [ ] Add dos and don'ts
- [ ] Add component screenshots
- [ ] Update main project README
- [ ] Share with team

### Phase 6: Quality Assurance

- [ ] Visual regression test all refactored screens
- [ ] Test on iOS and Android
- [ ] Test on different screen sizes
- [ ] Verify accessibility (color contrast, font sizes)
- [ ] Performance test (ensure no slowdowns)
- [ ] Code review with team

---

## 🎯 Success Criteria

- [ ] All quotations screens use theme constants
- [ ] Zero inline magic numbers for fonts/spacing/colors
- [ ] All buttons use `<Button>` component
- [ ] All cards use `<Card>` component
- [ ] All headings use `<Heading>` component
- [ ] Visual consistency across all screens
- [ ] Documentation complete and shared
- [ ] Team trained on design system usage

---

## 🚀 Quick Commands

```bash
# Create theme folder structure
mkdir -p frontend/theme
mkdir -p frontend/components/common

# Run style audit
cd frontend
grep -r "fontSize:" screens/quotations/ > ../docs/style-audit-fonts.txt
grep -r "color:" screens/quotations/ > ../docs/style-audit-colors.txt

# Test imports after creating theme
# In any screen file:
import { BRAND, SPACING, FONT_SIZES } from '../theme';
console.log(BRAND.primary); // Should log #D5222B
```

---

## 📖 Additional Resources

- [React Native StyleSheet Best Practices](https://reactnative.dev/docs/stylesheet)
- [Design Systems 101](https://www.designsystems.com/open-design-systems/)
- [Material Design Color System](https://material.io/design/color/the-color-system.html)
- [Typography Scale Calculator](https://type-scale.com/)

---

## 🤝 Contributing

When adding new screens or components:

1. **Always** use theme constants
2. **Check** if shared component exists before creating custom styles
3. **Document** any new patterns or variations needed
4. **Test** on multiple devices
5. **Review** with design system maintainer

---

## Version History

- **v1.0.0** - Initial design system implementation
- Defined color palette, typography scale, spacing system
- Created Button, Card, Text, Heading, Input, Badge components
- Refactored Motor Insurance screen as pilot

---

**Questions or Issues?**
Contact: [Your Team Lead] or open an issue in the repo.
