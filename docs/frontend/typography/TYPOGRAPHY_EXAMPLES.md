# Typography Migration - Before & After Examples

## Complete Working Examples for PataBima Screens

---

## Example 1: Medical Category Selection Screen

### BEFORE (Old Pattern)

```javascript
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const MedicalCategoryScreen = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.header}>Medical Insurance</Text>
      <Text style={styles.subtitle}>Choose your coverage type</Text>

      <TouchableOpacity style={styles.card}>
        <Ionicons name="people" size={40} color="#D5222B" />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Individual & Family</Text>
          <Text style={styles.cardDescription}>
            Coverage for you and your loved ones
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#646767" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.card}>
        <Ionicons name="business" size={40} color="#D5222B" />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Corporate</Text>
          <Text style={styles.cardDescription}>
            Group coverage for employees
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#646767" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f5f5",
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#646767",
    marginBottom: 24,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#646767",
  },
});

export default MedicalCategoryScreen;
```

### AFTER (New Pattern with Typography Components)

```javascript
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Heading2, Body1, Heading5, Body2 } from "../components";
import { Spacing, Colors } from "../constants";

const MedicalCategoryScreen = () => {
  return (
    <View style={styles.container}>
      <Heading2 style={styles.header}>Medical Insurance</Heading2>
      <Body1 color={Colors.textSecondary} style={styles.subtitle}>
        Choose your coverage type
      </Body1>

      <TouchableOpacity style={styles.card}>
        <Ionicons name="people" size={40} color={Colors.primary} />
        <View style={styles.cardContent}>
          <Heading5 style={styles.cardTitle}>Individual & Family</Heading5>
          <Body2>Coverage for you and your loved ones</Body2>
        </View>
        <Ionicons
          name="chevron-forward"
          size={24}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.card}>
        <Ionicons name="business" size={40} color={Colors.primary} />
        <View style={styles.cardContent}>
          <Heading5 style={styles.cardTitle}>Corporate</Heading5>
          <Body2>Group coverage for employees</Body2>
        </View>
        <Ionicons
          name="chevron-forward"
          size={24}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.padding.screen,
    backgroundColor: Colors.backgroundLight,
  },
  header: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginBottom: Spacing.lg,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: Spacing.padding.card,
    borderRadius: Spacing.borderRadius.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  cardTitle: {
    marginBottom: Spacing.xs,
  },
});

export default MedicalCategoryScreen;
```

**Key Changes:**

- ✅ Removed all hardcoded `fontSize`, `fontWeight`, `color` from text styles
- ✅ Used `<Heading2>`, `<Body1>`, `<Heading5>`, `<Body2>` components
- ✅ Used `Spacing` constants instead of hardcoded numbers
- ✅ Used `Colors` constants for all colors
- ✅ Cleaner, more maintainable code
- ✅ Consistent with PataBima design system

---

## Example 2: Quotation Form Screen

### BEFORE (Old Pattern)

```javascript
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

const QuotationFormScreen = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Get Your Quote</Text>
      <Text style={styles.description}>
        Fill in your details to receive a personalized quote
      </Text>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={formData.fullName}
          onChangeText={(text) => setFormData({ ...formData, fullName: text })}
          placeholder="Enter your full name"
        />
        <Text style={styles.helperText}>
          Enter your legal name as it appears on your ID
        </Text>
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          placeholder="your.email@example.com"
          keyboardType="email-address"
        />
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Submit Quote Request</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        By submitting, you agree to our Terms & Conditions
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#646767",
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#212121",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#212121",
  },
  helperText: {
    fontSize: 12,
    color: "#9E9E9E",
    marginTop: 4,
  },
  button: {
    backgroundColor: "#D5222B",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  footerText: {
    fontSize: 12,
    color: "#9E9E9E",
    textAlign: "center",
    marginTop: 16,
  },
});

export default QuotationFormScreen;
```

### AFTER (New Pattern with Typography Components)

```javascript
import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import {
  Heading3,
  Body1,
  InputLabel,
  InputHelper,
  ButtonText,
  Caption,
} from "../components";
import { Spacing, Colors } from "../constants";

const QuotationFormScreen = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  return (
    <View style={styles.container}>
      <Heading3 style={styles.title}>Get Your Quote</Heading3>
      <Body1 color={Colors.textSecondary} style={styles.description}>
        Fill in your details to receive a personalized quote
      </Body1>

      <View style={styles.fieldContainer}>
        <InputLabel>Full Name</InputLabel>
        <TextInput
          style={styles.input}
          value={formData.fullName}
          onChangeText={(text) => setFormData({ ...formData, fullName: text })}
          placeholder="Enter your full name"
          placeholderTextColor={Colors.textLight}
        />
        <InputHelper>
          Enter your legal name as it appears on your ID
        </InputHelper>
      </View>

      <View style={styles.fieldContainer}>
        <InputLabel>Email Address</InputLabel>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          placeholder="your.email@example.com"
          placeholderTextColor={Colors.textLight}
          keyboardType="email-address"
        />
      </View>

      <TouchableOpacity style={styles.button}>
        <ButtonText color={Colors.white}>Submit Quote Request</ButtonText>
      </TouchableOpacity>

      <Caption style={styles.footerText}>
        By submitting, you agree to our Terms & Conditions
      </Caption>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.padding.card,
    backgroundColor: Colors.white,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  description: {
    marginBottom: Spacing.lg,
  },
  fieldContainer: {
    marginBottom: Spacing.padding.card,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Spacing.borderRadius.md,
    padding: Spacing.md,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: Colors.text,
    marginTop: Spacing.xs,
  },
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.borderRadius.md,
    alignItems: "center",
    marginTop: Spacing.md,
  },
  footerText: {
    textAlign: "center",
    marginTop: Spacing.md,
  },
});

export default QuotationFormScreen;
```

**Key Changes:**

- ✅ `<Heading3>`, `<Body1>`, `<InputLabel>`, `<InputHelper>`, `<ButtonText>`, `<Caption>`
- ✅ All spacing uses `Spacing` constants
- ✅ All colors use `Colors` constants
- ✅ Input uses Typography.styles.input font
- ✅ Cleaner, more semantic code

---

## Example 3: Dashboard Card Component

### BEFORE (Old Pattern)

```javascript
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const StatsCard = ({ title, value, icon, trend, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={28} color="#D5222B" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
        {trend && <Text style={styles.trend}>{trend}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9E9E9E" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFEBEE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    color: "#646767",
    marginBottom: 4,
  },
  value: {
    fontSize: 20,
    fontWeight: "700",
    color: "#212121",
    marginBottom: 2,
  },
  trend: {
    fontSize: 12,
    color: "#4CAF50",
  },
});

export default StatsCard;
```

### AFTER (New Pattern with Typography Components)

```javascript
import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Body2, Heading4, Caption } from "../components";
import { Spacing, Colors } from "../constants";

const StatsCard = ({ title, value, icon, trend, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={28} color={Colors.primary} />
      </View>
      <View style={styles.content}>
        <Body2 color={Colors.textSecondary} style={styles.title}>
          {title}
        </Body2>
        <Heading4 style={styles.value}>{value}</Heading4>
        {trend && <Caption color={Colors.success}>{trend}</Caption>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderRadius: Spacing.borderRadius.lg,
    marginBottom: Spacing.md,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  value: {
    marginBottom: 2,
  },
});

export default StatsCard;
```

**Key Changes:**

- ✅ `<Body2>`, `<Heading4>`, `<Caption>` instead of raw `<Text>`
- ✅ Spacing constants throughout
- ✅ Colors constants for all colors
- ✅ More semantic component names
- ✅ Easier to maintain and update

---

## Example 4: Button Component

### BEFORE (Old Pattern)

```javascript
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

const Button = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === "primary" && styles.primaryButton,
        variant === "secondary" && styles.secondaryButton,
        (disabled || loading) && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === "secondary" && styles.secondaryButtonText,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: "#D5222B",
  },
  secondaryButton: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#D5222B",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  secondaryButtonText: {
    color: "#D5222B",
  },
});

export default Button;
```

### AFTER (New Pattern with Typography Components)

```javascript
import React from "react";
import { TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { ButtonText } from "../components";
import { Spacing, Colors } from "../constants";

const Button = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === "primary" && styles.primaryButton,
        variant === "secondary" && styles.secondaryButton,
        (disabled || loading) && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
        <ButtonText
          color={variant === "secondary" ? Colors.primary : Colors.white}
        >
          {title}
        </ButtonText>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: Spacing.md - 2, // 14px
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  secondaryButton: {
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
});

export default Button;
```

**Key Changes:**

- ✅ `<ButtonText>` component instead of styled `<Text>`
- ✅ Removed all hardcoded typography styles
- ✅ Used Spacing and Colors constants
- ✅ Cleaner, more maintainable
- ✅ Consistent button text styling

---

## Key Takeaways

### What Changed:

1. **Text Components**: `<Text>` → `<Heading3>`, `<Body1>`, `<ButtonText>`, etc.
2. **Typography Styles**: Removed `fontSize`, `fontWeight`, `color` from StyleSheet
3. **Spacing**: Hardcoded numbers → `Spacing.md`, `Spacing.lg`, etc.
4. **Colors**: Hex values → `Colors.primary`, `Colors.textSecondary`, etc.

### Benefits:

✅ **Consistency**: All text looks uniform across the app
✅ **Maintainability**: Change once in Typography.js, updates everywhere
✅ **Productivity**: Faster development with pre-built components
✅ **Clarity**: Code is more semantic and readable
✅ **Flexibility**: Easy to override when needed

### Usage Summary:

```javascript
// Import what you need
import { Heading3, Body1, Caption, ButtonText } from '../components';
import { Spacing, Colors } from '../constants';

// Use in JSX
<Heading3>Title</Heading3>
<Body1>Description text</Body1>
<ButtonText color={Colors.white}>Click Me</ButtonText>
<Caption>Small print</Caption>

// Override when necessary
<Heading3 color={Colors.primary} style={styles.centered}>
  Custom Styled Title
</Heading3>
```

---

**Ready to use in production!** 🚀
