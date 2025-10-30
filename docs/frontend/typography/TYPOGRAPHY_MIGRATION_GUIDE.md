# PataBima App - Typography & Design System Migration Guide

## Executive Summary

This guide provides a step-by-step approach to implement uniform Poppins font family and consistent sizing across the entire PataBima application without breaking existing functionality.

---

## Current State Analysis

### Existing Typography System

- **Font Family**: Poppins (already configured)
- **Font Weights**: Regular (400), Medium (500), SemiBold (600), Bold (700)
- **Font Sizes**: Inconsistent usage across screens (12px - 32px)
- **Line Heights**: Partially defined
- **Spacing**: Mixed hardcoded values

### Issues Identified

1. ❌ Inline font size definitions in StyleSheet
2. ❌ Hardcoded padding/margin values
3. ❌ Inconsistent font weight usage
4. ❌ Mixed fontFamily declarations
5. ❌ No standardized text component wrappers

---

## Design System Specification

### 1. Typography Scale (Poppins Font)

```javascript
// constants/Typography.js - Enhanced Version
export const Typography = {
  // Font families - Poppins
  fontFamily: {
    regular: "Poppins_400Regular",
    medium: "Poppins_500Medium",
    semiBold: "Poppins_600SemiBold",
    bold: "Poppins_700Bold",
  },

  // Font sizes - Mobile optimized
  fontSize: {
    xs: 12, // Small labels, captions
    sm: 14, // Body text, descriptions
    md: 16, // Default body text, inputs
    lg: 18, // Section headers, large body
    xl: 20, // Screen titles
    xxl: 24, // Major headings
    xxxl: 28, // Hero text
    xxxxl: 32, // Display text
  },

  // Line heights - Optimal readability
  lineHeight: {
    xs: 16, // 1.33 ratio
    sm: 20, // 1.43 ratio
    md: 22, // 1.375 ratio
    lg: 26, // 1.44 ratio
    xl: 28, // 1.4 ratio
    xxl: 32, // 1.33 ratio
    xxxl: 36, // 1.28 ratio
    xxxxl: 40, // 1.25 ratio
  },

  // Font weights
  fontWeight: {
    regular: "400",
    medium: "500",
    semiBold: "600",
    bold: "700",
  },

  // Pre-defined text styles
  styles: {
    // Headers
    h1: {
      fontFamily: "Poppins_700Bold",
      fontSize: 32,
      lineHeight: 40,
      fontWeight: "700",
      color: "#212121",
    },
    h2: {
      fontFamily: "Poppins_700Bold",
      fontSize: 28,
      lineHeight: 36,
      fontWeight: "700",
      color: "#212121",
    },
    h3: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 24,
      lineHeight: 32,
      fontWeight: "600",
      color: "#212121",
    },
    h4: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 20,
      lineHeight: 28,
      fontWeight: "600",
      color: "#212121",
    },
    h5: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 18,
      lineHeight: 26,
      fontWeight: "600",
      color: "#212121",
    },
    h6: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "600",
      color: "#212121",
    },

    // Body text
    body1: {
      fontFamily: "Poppins_400Regular",
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "400",
      color: "#212121",
    },
    body2: {
      fontFamily: "Poppins_400Regular",
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "400",
      color: "#646767",
    },

    // Special text
    subtitle1: {
      fontFamily: "Poppins_500Medium",
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "500",
      color: "#212121",
    },
    subtitle2: {
      fontFamily: "Poppins_500Medium",
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "500",
      color: "#646767",
    },
    caption: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "400",
      color: "#9E9E9E",
    },
    overline: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "600",
      color: "#646767",
      textTransform: "uppercase",
      letterSpacing: 1,
    },

    // Button text
    button: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "600",
      textAlign: "center",
    },
    buttonSmall: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600",
      textAlign: "center",
    },
    buttonLarge: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 18,
      lineHeight: 26,
      fontWeight: "600",
      textAlign: "center",
    },

    // Input text
    input: {
      fontFamily: "Poppins_400Regular",
      fontSize: 16,
      lineHeight: 22,
      fontWeight: "400",
      color: "#212121",
    },
    inputLabel: {
      fontFamily: "Poppins_600SemiBold",
      fontSize: 14,
      lineHeight: 20,
      fontWeight: "600",
      color: "#212121",
    },
    inputHelper: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "400",
      color: "#646767",
    },
    inputError: {
      fontFamily: "Poppins_400Regular",
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "400",
      color: "#D5222B",
    },
  },
};
```

### 2. Spacing Scale

```javascript
// constants/Spacing.js - Create this file
export const Spacing = {
  xs: 4, // Tight spacing
  sm: 8, // Small spacing
  md: 16, // Default spacing
  lg: 24, // Large spacing
  xl: 32, // Extra large spacing
  xxl: 40, // Section spacing
  xxxl: 48, // Major section spacing

  // Semantic spacing
  padding: {
    screen: 16, // Screen edge padding
    card: 20, // Card internal padding
    section: 24, // Section padding
    component: 12, // Component padding
  },
  margin: {
    small: 8, // Small gaps
    medium: 16, // Standard gaps
    large: 24, // Large gaps
    section: 32, // Between major sections
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999, // Fully rounded
  },
};
```

---

## Migration Strategy

### Phase 1: Foundation Setup (Week 1)

#### Step 1.1: Update Typography Constants

```bash
# File: constants/Typography.js
```

✅ Add the enhanced typography styles shown above
✅ Keep backward compatibility with existing fontSize/lineHeight properties
✅ Test that constants export correctly

#### Step 1.2: Create Spacing Constants

```bash
# File: constants/Spacing.js
```

✅ Create new Spacing.js file with spacing scale
✅ Export from constants/index.js

#### Step 1.3: Update Index Exports

```javascript
// constants/index.js
export { default as Colors } from "./Colors";
export { Typography } from "./Typography";
export { Spacing } from "./Spacing";
export { default as Layout } from "./Layout";
```

#### Step 1.4: Install Poppins Fonts (if not already)

```bash
npm install @expo-google-fonts/poppins
# OR
expo install expo-font @expo-google-fonts/poppins
```

```javascript
// App.js - Font loading
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from "@expo-google-fonts/poppins";
```

---

### Phase 2: Create Reusable Text Components (Week 2)

#### Step 2.1: Create Typography Components

```bash
# File: components/typography/Text.js
```

```javascript
import React from "react";
import { Text as RNText, StyleSheet } from "react-native";
import { Typography, Colors } from "../../constants";

// Base Text Component
export const Text = ({
  variant = "body1",
  color,
  style,
  children,
  ...props
}) => {
  const textStyle = Typography.styles[variant] || Typography.styles.body1;

  return (
    <RNText style={[textStyle, color && { color }, style]} {...props}>
      {children}
    </RNText>
  );
};

// Specialized Components
export const Heading1 = ({ children, style, ...props }) => (
  <Text variant="h1" style={style} {...props}>
    {children}
  </Text>
);

export const Heading2 = ({ children, style, ...props }) => (
  <Text variant="h2" style={style} {...props}>
    {children}
  </Text>
);

export const Heading3 = ({ children, style, ...props }) => (
  <Text variant="h3" style={style} {...props}>
    {children}
  </Text>
);

export const Heading4 = ({ children, style, ...props }) => (
  <Text variant="h4" style={style} {...props}>
    {children}
  </Text>
);

export const Heading5 = ({ children, style, ...props }) => (
  <Text variant="h5" style={style} {...props}>
    {children}
  </Text>
);

export const Heading6 = ({ children, style, ...props }) => (
  <Text variant="h6" style={style} {...props}>
    {children}
  </Text>
);

export const Body1 = ({ children, style, ...props }) => (
  <Text variant="body1" style={style} {...props}>
    {children}
  </Text>
);

export const Body2 = ({ children, style, ...props }) => (
  <Text variant="body2" style={style} {...props}>
    {children}
  </Text>
);

export const Subtitle1 = ({ children, style, ...props }) => (
  <Text variant="subtitle1" style={style} {...props}>
    {children}
  </Text>
);

export const Subtitle2 = ({ children, style, ...props }) => (
  <Text variant="subtitle2" style={style} {...props}>
    {children}
  </Text>
);

export const Caption = ({ children, style, ...props }) => (
  <Text variant="caption" style={style} {...props}>
    {children}
  </Text>
);

export const Overline = ({ children, style, ...props }) => (
  <Text variant="overline" style={style} {...props}>
    {children}
  </Text>
);
```

#### Step 2.2: Export Typography Components

```javascript
// components/typography/index.js
export {
  Text,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Body1,
  Body2,
  Subtitle1,
  Subtitle2,
  Caption,
  Overline,
} from "./Text";
```

```javascript
// components/index.js - Add to existing exports
export * from "./typography";
```

---

### Phase 3: Screen-by-Screen Migration (Weeks 3-6)

#### Migration Priority Order:

1. **High Priority** - User-facing screens:
   - Authentication screens (Login, Register, ForgotPassword)
   - Main Dashboard/Home screen
   - Motor Insurance quotation screens
   - Medical Insurance screens
2. **Medium Priority** - Secondary screens:
   - Profile/Account screens
   - Quotations listing
   - Renewals & Extensions
   - Claims screens
3. **Low Priority** - Admin/Internal screens:
   - Admin panels
   - Testing screens
   - Legacy/archived screens

#### Migration Process Per Screen:

**BEFORE:**

```javascript
// OLD CODE - Don't use
const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

// In component
<Text style={styles.title}>Medical Insurance</Text>
<Text style={styles.description}>Choose your plan</Text>
```

**AFTER:**

```javascript
// NEW CODE - Recommended approach
import { Heading3, Body2 } from '../../../components/typography';
import { Spacing } from '../../../constants';

const styles = StyleSheet.create({
  titleContainer: {
    marginBottom: Spacing.sm,
  },
});

// In component - Option 1: Using specialized components
<Heading3 style={styles.titleContainer}>Medical Insurance</Heading3>
<Body2>Choose your plan</Body2>

// OR Option 2: Using variant prop
import { Text } from '../../../components/typography';
<Text variant="h3" style={styles.titleContainer}>Medical Insurance</Text>
<Text variant="body2">Choose your plan</Text>
```

#### Step-by-Step Migration for Each Screen:

1. **Import typography components**

   ```javascript
   import {
     Text,
     Heading3,
     Body1,
     Body2,
     Caption,
   } from "../../../components/typography";
   import { Typography, Spacing } from "../../../constants";
   ```

2. **Replace <Text> with typography components**

   - Find all `<Text>` usages
   - Replace with appropriate variant (Heading1-6, Body1-2, etc.)
   - Remove fontSize, fontWeight, fontFamily from styles

3. **Update StyleSheet**

   - Remove typography-related properties
   - Replace hardcoded spacing with Spacing constants
   - Keep layout and color properties

4. **Test the screen**
   - Visual inspection
   - Different screen sizes
   - Both iOS and Android

---

### Phase 4: Component Library Migration (Week 7)

#### Update Existing Components:

**EnhancedFormComponents.js:**

```javascript
// Update input styles to use Typography
import { Typography, Spacing } from "../constants";

const styles = StyleSheet.create({
  label: {
    ...Typography.styles.inputLabel,
    marginBottom: Spacing.xs,
  },
  input: {
    ...Typography.styles.input,
    padding: Spacing.md,
    borderRadius: Spacing.borderRadius.md,
  },
  helperText: {
    ...Typography.styles.inputHelper,
    marginTop: Spacing.xs,
  },
  errorText: {
    ...Typography.styles.inputError,
    marginTop: Spacing.xs,
  },
});
```

**Button Components:**

```javascript
const styles = StyleSheet.create({
  buttonText: {
    ...Typography.styles.button,
    color: Colors.white,
  },
  buttonTextSmall: {
    ...Typography.styles.buttonSmall,
  },
});
```

---

### Phase 5: Validation & Testing (Week 8)

#### Automated Checks:

1. **Create validation script:**

```bash
# File: scripts/validate-typography.js
```

```javascript
const fs = require("fs");
const path = require("path");

// Find hardcoded font sizes in StyleSheets
function findHardcodedTypography(dir) {
  const warnings = [];

  function scanFile(filePath) {
    const content = fs.readFileSync(filePath, "utf8");

    // Check for hardcoded fontSize
    if (content.match(/fontSize:\s*\d+/g)) {
      warnings.push({
        file: filePath,
        issue: "Hardcoded fontSize found",
        line: content
          .split("\n")
          .findIndex((line) => line.includes("fontSize:")),
      });
    }

    // Check for hardcoded fontFamily
    if (content.match(/fontFamily:\s*['"][^'"]*['"]/g)) {
      const match = content.match(/fontFamily:\s*['"]([^'"]*)['"]/);
      if (match && !match[1].includes("Poppins")) {
        warnings.push({
          file: filePath,
          issue: "Non-Poppins font found",
          font: match[1],
        });
      }
    }
  }

  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory() && !file.includes("node_modules")) {
        walkDir(filePath);
      } else if (file.endsWith(".js") || file.endsWith(".jsx")) {
        scanFile(filePath);
      }
    });
  }

  walkDir(dir);
  return warnings;
}

const warnings = findHardcodedTypography("./screens");
console.log(`Found ${warnings.length} typography issues`);
warnings.forEach((w) => console.log(w));
```

#### Manual Testing Checklist:

- [ ] All screen headers use Poppins font
- [ ] All body text uses consistent sizes
- [ ] All buttons have uniform styling
- [ ] All form inputs use standard typography
- [ ] No font rendering issues on iOS
- [ ] No font rendering issues on Android
- [ ] Text is readable on all screen sizes
- [ ] Line heights provide good readability
- [ ] Spacing is consistent across screens

---

## Quick Reference Guide

### Common Text Replacements

| Old Pattern                       | New Pattern                             | Use Case          |
| --------------------------------- | --------------------------------------- | ----------------- |
| `fontSize: 24, fontWeight: '700'` | `<Heading3>` or `variant="h3"`          | Section titles    |
| `fontSize: 18, fontWeight: '600'` | `<Heading5>` or `variant="h5"`          | Subsection titles |
| `fontSize: 16`                    | `<Body1>` or `variant="body1"`          | Default body text |
| `fontSize: 14`                    | `<Body2>` or `variant="body2"`          | Secondary text    |
| `fontSize: 12`                    | `<Caption>` or `variant="caption"`      | Small labels      |
| `marginBottom: 20`                | `marginBottom: Spacing.lg`              | Large gaps        |
| `marginBottom: 16`                | `marginBottom: Spacing.md`              | Standard gaps     |
| `padding: 16`                     | `padding: Spacing.md`                   | Standard padding  |
| `borderRadius: 8`                 | `borderRadius: Spacing.borderRadius.md` | Rounded corners   |

### Typography Variant Selection Guide

```
Choose variant based on content hierarchy:

h1 (32px) - App title, major screen headers
h2 (28px) - Screen section headers
h3 (24px) - Card headers, panel titles
h4 (20px) - Large subsection headers
h5 (18px) - Medium subsection headers
h6 (16px) - Small subsection headers

body1 (16px) - Primary body text, paragraphs
body2 (14px) - Secondary descriptions, details

subtitle1 (16px) - Emphasized body text
subtitle2 (14px) - Secondary emphasized text

caption (12px) - Timestamps, metadata, footnotes
overline (12px uppercase) - Category labels, tags

button (16px semibold) - Button labels
input (16px) - Form input text
inputLabel (14px semibold) - Form field labels
```

---

## Breaking Change Prevention

### Backward Compatibility Strategy:

1. **Keep old properties for 2 release cycles**

   ```javascript
   // Typography.js - Maintain old exports
   export const Typography = {
     // New system
     styles: {
       /* ... */
     },

     // Old system (deprecated but functional)
     fontSize: {
       /* ... */
     },
     lineHeight: {
       /* ... */
     },
     fontWeight: {
       /* ... */
     },
   };
   ```

2. **Gradual migration approach**

   - Don't force all screens to migrate at once
   - Allow both old and new patterns to coexist
   - Add deprecation warnings in console

3. **Create migration helper**
   ```javascript
   // utils/typographyMigration.js
   export function getTextStyle(oldStyle) {
     // Convert old inline styles to new variant
     const fontSize = oldStyle.fontSize;
     const fontWeight = oldStyle.fontWeight;

     if (fontSize >= 24 && fontWeight === "700") return Typography.styles.h3;
     if (fontSize >= 18 && fontWeight === "600") return Typography.styles.h5;
     if (fontSize === 16) return Typography.styles.body1;
     if (fontSize === 14) return Typography.styles.body2;

     return Typography.styles.body1; // Default fallback
   }
   ```

---

## Migration Timeline

### 8-Week Plan

**Week 1: Foundation**

- ✅ Update Typography.js
- ✅ Create Spacing.js
- ✅ Verify font loading
- ✅ Update index exports

**Week 2: Components**

- ✅ Create Text components
- ✅ Create typography components
- ✅ Test component library
- ✅ Update documentation

**Week 3-4: High Priority Screens**

- ✅ Auth screens (Login, Register)
- ✅ Main Dashboard
- ✅ Motor quotation screens
- ✅ Medical quotation screens

**Week 5-6: Medium Priority Screens**

- ✅ Profile/Account
- ✅ Quotations list
- ✅ Renewals/Extensions
- ✅ Claims screens

**Week 7: Component Library**

- ✅ Update EnhancedFormComponents
- ✅ Update buttons
- ✅ Update cards
- ✅ Update navigation components

**Week 8: Testing & Cleanup**

- ✅ Visual regression testing
- ✅ Performance testing
- ✅ Remove deprecated code
- ✅ Final documentation

---

## Success Metrics

- [ ] 100% of screens use Poppins font
- [ ] 0 hardcoded font sizes in new code
- [ ] 95%+ usage of Spacing constants
- [ ] All Typography variants documented
- [ ] No visual regressions reported
- [ ] App bundle size not increased significantly
- [ ] Performance metrics maintained

---

## Rollback Plan

If issues arise:

1. **Revert Typography.js** to previous version
2. **Remove Text components** import statements
3. **Keep old StyleSheet** definitions
4. **Document issues** for future resolution
5. **Schedule retro** to understand problems

---

## Additional Resources

### Files to Update:

```
✅ constants/Typography.js
✅ constants/Spacing.js (new)
✅ constants/index.js
✅ components/typography/Text.js (new)
✅ components/typography/index.js (new)
✅ components/index.js
✅ App.js (font loading)

📝 All screen files (gradual migration)
📝 All component files (gradual migration)
```

### Testing Screens:

- Medical Insurance (Individual & Corporate)
- Motor Insurance (all categories)
- Dashboard/Home
- Login/Register
- Profile/Account

---

## FAQ

**Q: Will this break existing screens?**
A: No, we maintain backward compatibility by keeping old properties alongside new ones.

**Q: Do I need to migrate all screens at once?**
A: No, migrate gradually screen-by-screen following the priority order.

**Q: What if a screen needs custom typography?**
A: You can still add custom styles on top of variant styles using the `style` prop.

**Q: How do I handle third-party components?**
A: Wrap them or extend them to apply our typography system.

**Q: What about performance?**
A: Typography components add minimal overhead. Using StyleSheet.create and spreading styles is optimized by React Native.

---

## Contact & Support

For questions or issues during migration:

- Create GitHub issue with `[Typography Migration]` tag
- Reference this guide in your PR descriptions
- Update this guide with learnings

---

**Last Updated:** October 6, 2025
**Version:** 1.0.0
**Status:** Ready for Implementation
