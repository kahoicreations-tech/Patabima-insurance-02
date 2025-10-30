# Extendible Products - Complete Implementation Guide

## Overview

Extendible products (Third-Party EXT and TOR EXT) allow customers to pay for insurance coverage in installments - an initial payment for a short period, followed by a balance payment to extend coverage for the full year.

---

## 1. Product Configuration (Admin Backend) ✅

### A. Identifying Extendible Products

Extendible products are identified by `'EXT'` in their subcategory code:

```python
# Extendible Product Codes
PRIVATE_THIRD_PARTY_EXT = "PRIVATE_THIRD_PARTY_EXT"
PRIVATE_TOR_EXT = "PRIVATE_TOR_EXT"
COMMERCIAL_THIRD_PARTY_EXT = "COMMERCIAL_THIRD_PARTY_EXT"
COMMERCIAL_TOR_EXT = "COMMERCIAL_TOR_EXT"
# ... etc
```

### B. Pricing Structure (Features Field)

**Stored in**: `InsuranceProvider.features` JSON field

```json
{
  "pricing": {
    "PRIVATE_THIRD_PARTY_EXT": {
      "enabled": true,
      "pricing_type": "fixed",
      "base_premium": 6000,
      "extendible_config": {
        "initial_period_days": 30,
        "initial_amount": 3600,
        "balance_amount": 2400,
        "total_annual_premium": 6000,
        "extension_deadline_days": 30,
        "grace_period_days": 7,
        "penalty_for_late_extension": 0,
        "allow_partial_extension": false
      }
    }
  }
}
```

**Key Fields:**

- `initial_period_days`: How many days the initial payment covers (default: 30)
- `initial_amount`: Payment for initial period (e.g., 3600 for 60% of 6000)
- `balance_amount`: Payment for remaining period (e.g., 2400 for 40% of 6000)
- `total_annual_premium`: Total = Initial + Balance (must match base_premium)
- `extension_deadline_days`: Days before initial period ends to pay balance (default: 30)
- `grace_period_days`: Extra days after initial period to pay balance (default: 7)
- `penalty_for_late_extension`: % penalty if paid after deadline (0-15%)
- `allow_partial_extension`: Allow extending for less than full year

### C. Configuration via Visual Pricing Builder ✅

**Location**: `/admin/app/insuranceprovider/{id}/change/`

**Steps**:

1. Enable the EXT product (checkbox)
2. Enter base premium (e.g., 6000) in Rate/Premium column
3. Click "📅 Extension Terms" button
4. Modal opens with:
   - Total Annual Premium: 6000 (read-only, matches base premium)
   - Initial Amount: 3600 (60% default, adjustable)
   - Balance Amount: 2400 (auto-calculates to make total = 6000)
   - Other extension terms fields
5. Adjust Initial Amount → Balance auto-updates
6. Save → Config stored in features.pricing.{CODE}.extendible_config

---

## 2. Frontend Flow - Motor 2 (Complete Implementation)

### A. Category & Subcategory Selection ✅ EXISTING

**Screen**: `MotorCategoryGrid.js` + `MotorSubcategoryList.js`

**Current State**: Already displays all subcategories including EXT variants

- Shows "Private Third-Party" and "Private Third-Party Extendible" as separate options
- User selects the EXT variant to proceed

**No Changes Needed** - Selection logic already working

### B. Vehicle Details ✅ EXISTING

**Screen**: `DynamicVehicleForm.js`

**Current State**: Collects standard vehicle information

- Registration number, make, model, year, etc.
- Same fields for all product types

**No Changes Needed** - Form already universal

### C. Pricing Display ⚠️ NEEDS ENHANCEMENT

**Screen**: `PremiumCalculationDisplay.js` + `PremiumBreakdownCard.js`

**Current State**: Shows single premium amount

**Required Changes**:

```jsx
// PremiumBreakdownCard.js - Detect if extendible
const isExtendible = selectedSubcategory?.subcategory_code?.includes("EXT");
const extendibleConfig = providerPricing?.extendible_config;

// Show TWO payment options for extendible products
{
  isExtendible && extendibleConfig ? (
    <View style={styles.extendiblePricing}>
      <Text style={styles.sectionTitle}>Payment Options</Text>

      {/* Option 1: Pay in Full (Discount) */}
      <TouchableOpacity
        style={[
          styles.paymentOption,
          paymentPlan === "full" && styles.selectedOption,
        ]}
        onPress={() => setPaymentPlan("full")}
      >
        <View style={styles.optionHeader}>
          <Text style={styles.optionTitle}>💰 Pay Full Amount</Text>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>Save 10%</Text>
          </View>
        </View>
        <Text style={styles.optionAmount}>
          KSh {(extendibleConfig.total_annual_premium * 0.9).toLocaleString()}
        </Text>
        <Text style={styles.optionDetails}>
          One-time payment • Full year coverage
        </Text>
      </TouchableOpacity>

      {/* Option 2: Pay in Installments (Initial + Balance) */}
      <TouchableOpacity
        style={[
          styles.paymentOption,
          paymentPlan === "installments" && styles.selectedOption,
        ]}
        onPress={() => setPaymentPlan("installments")}
      >
        <Text style={styles.optionTitle}>📅 Pay in Installments</Text>
        <View style={styles.installmentBreakdown}>
          <View style={styles.installmentRow}>
            <Text style={styles.installmentLabel}>Initial Payment (Now)</Text>
            <Text style={styles.installmentAmount}>
              KSh {extendibleConfig.initial_amount.toLocaleString()}
            </Text>
          </View>
          <Text style={styles.installmentNote}>
            Covers first {extendibleConfig.initial_period_days} days
          </Text>

          <View style={styles.installmentDivider} />

          <View style={styles.installmentRow}>
            <Text style={styles.installmentLabel}>
              Balance Payment (Within {extendibleConfig.extension_deadline_days}{" "}
              days)
            </Text>
            <Text style={styles.installmentAmount}>
              KSh {extendibleConfig.balance_amount.toLocaleString()}
            </Text>
          </View>
          <Text style={styles.installmentNote}>
            Extends coverage for full year
          </Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total Annual Premium:</Text>
          <Text style={styles.totalAmount}>
            KSh {extendibleConfig.total_annual_premium.toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  ) : (
    // Regular premium display for non-extendible products
    <View>
      <Text style={styles.premiumLabel}>Total Premium</Text>
      <Text style={styles.premiumAmount}>
        KSh {calculatedPremium.toLocaleString()}
      </Text>
    </View>
  );
}
```

**State Management**:

```jsx
const [paymentPlan, setPaymentPlan] = useState("installments"); // Default to installments
```

### D. Payment Processing ⚠️ NEEDS ENHANCEMENT

**Screen**: `Payment/PaymentScreen.js`

**Current State**: Single payment flow

**Required Changes**:

```jsx
// Detect extendible and payment plan
const isExtendible = quotationData.subcategory_code?.includes("EXT");
const paymentPlan = quotationData.payment_plan; // 'full' or 'installments'
const extendibleConfig = quotationData.extendible_config;

// Calculate amount to pay
const amountToPay =
  isExtendible && paymentPlan === "installments"
    ? extendibleConfig.initial_amount
    : isExtendible && paymentPlan === "full"
    ? extendibleConfig.total_annual_premium * 0.9 // 10% discount
    : quotationData.total_premium;

// Show payment summary
<View style={styles.paymentSummary}>
  <Text style={styles.summaryTitle}>Payment Summary</Text>

  {isExtendible && paymentPlan === "installments" && (
    <View style={styles.installmentInfo}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Initial Payment</Text>
        <Text style={styles.summaryAmount}>
          KSh {extendibleConfig.initial_amount.toLocaleString()}
        </Text>
      </View>
      <Text style={styles.coveragePeriod}>
        Coverage: {extendibleConfig.initial_period_days} days from today
      </Text>

      <View style={styles.balanceInfo}>
        <Text style={styles.balanceTitle}>⏱️ Balance Payment Due</Text>
        <Text style={styles.balanceAmount}>
          KSh {extendibleConfig.balance_amount.toLocaleString()}
        </Text>
        <Text style={styles.balanceDueDate}>
          Pay within {extendibleConfig.extension_deadline_days} days to extend
          coverage
        </Text>
        <Text style={styles.gracePeriod}>
          Grace period: +{extendibleConfig.grace_period_days} days
        </Text>
      </View>
    </View>
  )}

  {isExtendible && paymentPlan === "full" && (
    <View style={styles.fullPaymentInfo}>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Full Year Premium</Text>
        <Text style={styles.summaryStrike}>
          KSh {extendibleConfig.total_annual_premium.toLocaleString()}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>Discount (10%)</Text>
        <Text style={styles.discountAmount}>
          - KSh {(extendibleConfig.total_annual_premium * 0.1).toLocaleString()}
        </Text>
      </View>
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Amount to Pay</Text>
        <Text style={styles.totalAmount}>
          KSh {(extendibleConfig.total_annual_premium * 0.9).toLocaleString()}
        </Text>
      </View>
    </View>
  )}

  <ActionButton
    title={`Pay KSh ${amountToPay.toLocaleString()}`}
    onPress={handlePayment}
  />
</View>;
```

### E. Policy Success Screen ⚠️ NEEDS ENHANCEMENT

**Screen**: `Success/PolicySuccess.js`

**Current State**: Shows policy number and basic details

**Required Changes**:

```jsx
// Show extension reminder for installment payments
{
  isExtendible && paymentPlan === "installments" && (
    <View style={styles.extensionReminder}>
      <View style={styles.reminderHeader}>
        <Text style={styles.reminderIcon}>⏰</Text>
        <Text style={styles.reminderTitle}>Balance Payment Reminder</Text>
      </View>

      <View style={styles.reminderContent}>
        <Text style={styles.reminderText}>
          Your coverage is active for the next{" "}
          {extendibleConfig.initial_period_days} days.
        </Text>

        <View style={styles.deadlineBox}>
          <Text style={styles.deadlineLabel}>Balance Payment Deadline</Text>
          <Text style={styles.deadlineDate}>
            {calculateDeadlineDate(
              policyData.cover_start,
              extendibleConfig.extension_deadline_days
            )}
          </Text>
          <Text style={styles.balanceAmount}>
            KSh {extendibleConfig.balance_amount.toLocaleString()}
          </Text>
        </View>

        <Text style={styles.gracePeriodNote}>
          Grace period: {extendibleConfig.grace_period_days} days after deadline
        </Text>

        <ActionButton
          title="Set Reminder"
          variant="secondary"
          onPress={() => setBalancePaymentReminder(policyData)}
        />
      </View>
    </View>
  );
}
```

---

## 3. Home Screen - Upcoming Section ⚠️ NEEDS IMPLEMENTATION

### A. Current State

**File**: `frontend/screens/main/HomeScreen.js`

**Existing**: Shows preview of upcoming renewals and extensions

**Required**: Distinguish between:

- **Renewals**: Active policies approaching expiry (all product types)
- **Extensions**: Expired extendible policies within grace period

### B. Extension Logic

**Add to HomeScreen.js**:

```jsx
// Get extension-eligible policies (expired extendible within grace period)
const getExtensionEligiblePolicies = () => {
  const today = new Date();

  return (extensionData || []).filter((policy) => {
    // Must be extendible product
    if (!policy.subcategory_code?.includes("EXT")) return false;

    // Must be expired
    const expiryDate = new Date(policy.cover_end);
    if (expiryDate >= today) return false;

    // Must be within grace period
    const daysSinceExpiry = Math.floor(
      (today - expiryDate) / (1000 * 60 * 60 * 24)
    );
    const graceEndDays = policy.extension_grace_days || 90; // Default based on product type

    return daysSinceExpiry <= graceEndDays;
  });
};

const extensionEligiblePolicies = getExtensionEligiblePolicies();
```

### C. Preview Card Enhancement

**Update preview card** to show extension info:

```jsx
{
  extensionEligiblePolicies.length > 0 && (
    <EnhancedCard style={[styles.previewCard, styles.extensionPreviewCard]}>
      <View style={styles.previewHeader}>
        <Text style={styles.previewTitle}>⏱️ Extension Available</Text>
        <StatusBadge status="Grace Period" color={Colors.warning} />
      </View>

      <Text style={styles.previewPolicy}>
        Policy: {extensionEligiblePolicies[0].policy_number}
      </Text>
      <Text style={styles.previewVehicle}>
        {extensionEligiblePolicies[0].vehicle_reg}
      </Text>

      <Text style={styles.previewExtensionInfo}>
        Expired {calculateDaysSince(extensionEligiblePolicies[0].cover_end)}{" "}
        days ago •{extensionEligiblePolicies[0].grace_remaining_days} days left
        in grace period
      </Text>

      <View style={styles.extensionPayment}>
        <Text style={styles.paymentLabel}>Balance Amount</Text>
        <Text style={styles.paymentAmount}>
          KSh {extensionEligiblePolicies[0].balance_amount.toLocaleString()}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.previewButton}
        onPress={() => handleExtendPolicy(extensionEligiblePolicies[0])}
      >
        <Text style={[styles.renewButtonText, styles.extensionButtonText]}>
          Extend Now →
        </Text>
      </TouchableOpacity>
    </EnhancedCard>
  );
}
```

---

## 4. Upcoming Screen - Extensions Tab ⚠️ NEEDS IMPLEMENTATION

### A. Current State

**File**: `frontend/screens/main/UpcomingScreen.js`

**Existing**: Has Extensions tab but needs full implementation

### B. Extension Card Implementation

**Update `renderExtensionCard`**:

```jsx
const renderExtensionCard = ({ item }) => {
  // Calculate grace period status
  const today = new Date();
  const expiredDate = new Date(item.cover_end);
  const daysSinceExpiry = Math.floor(
    (today - expiredDate) / (1000 * 60 * 60 * 24)
  );
  const graceRemainingDays = item.grace_total_days - daysSinceExpiry;
  const isUrgent = graceRemainingDays <= 7;

  // Calculate late fee if applicable
  const lateFeePercentage = calculateLateFee(daysSinceExpiry);
  const balanceWithFee = item.balance_amount * (1 + lateFeePercentage / 100);

  return (
    <EnhancedCard style={styles.itemCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardInfo}>
          <Text style={styles.policyNo}>Policy: {item.policy_number}</Text>
          <Text style={styles.vehicleReg}>Vehicle: {item.vehicle_reg}</Text>
          <Text style={styles.productType}>{item.product_name}</Text>
        </View>
        <StatusBadge
          status={isUrgent ? "Urgent" : "Grace Period"}
          color={isUrgent ? Colors.error : Colors.warning}
        />
      </View>

      <View style={styles.cardDetails}>
        {/* Expiry Information */}
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Initial Period Ended</Text>
            <Text style={styles.detailValue}>
              {new Date(expiredDate).toLocaleDateString()}
            </Text>
            <Text style={styles.detailSubtext}>{daysSinceExpiry} days ago</Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Grace Remaining</Text>
            <Text
              style={[
                styles.detailValue,
                { color: isUrgent ? Colors.error : Colors.warning },
              ]}
            >
              {graceRemainingDays} days
            </Text>
            <Text style={styles.detailSubtext}>
              Until {calculateGraceEndDate(expiredDate, item.grace_total_days)}
            </Text>
          </View>
        </View>

        {/* Payment Information */}
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Balance Amount</Text>
            <Text style={styles.detailValue}>
              KSh {item.balance_amount.toLocaleString()}
            </Text>
          </View>
          {lateFeePercentage > 0 && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>
                Late Fee ({lateFeePercentage}%)
              </Text>
              <Text style={[styles.detailValue, { color: Colors.error }]}>
                + KSh{" "}
                {(
                  (item.balance_amount * lateFeePercentage) /
                  100
                ).toLocaleString()}
              </Text>
            </View>
          )}
        </View>

        {/* Total with Late Fee */}
        {lateFeePercentage > 0 && (
          <View style={styles.totalPaymentRow}>
            <Text style={styles.totalLabel}>Total to Pay:</Text>
            <Text style={styles.totalAmount}>
              KSh {balanceWithFee.toLocaleString()}
            </Text>
          </View>
        )}

        {/* Extension Info */}
        <View style={styles.extensionInfo}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Payment extends your coverage for the remaining{" "}
            {365 - item.initial_period_days} days
          </Text>
        </View>

        {/* Action Button */}
        <ActionButton
          title={`Pay Balance & Extend (KSh ${balanceWithFee.toLocaleString()})`}
          icon="💰"
          size="medium"
          variant={isUrgent ? "primary" : "secondary"}
          onPress={() => handleExtendPolicy(item, lateFeePercentage)}
          style={styles.actionButton}
        />

        {/* Warning for urgent cases */}
        {isUrgent && (
          <View style={styles.urgentWarning}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Only {graceRemainingDays} days left! Late fees increase after
              grace period.
            </Text>
          </View>
        )}
      </View>
    </EnhancedCard>
  );
};

// Helper function to calculate late fee
const calculateLateFee = (daysSinceExpiry) => {
  if (daysSinceExpiry <= 30) return 0; // No fee within 30 days
  if (daysSinceExpiry <= 60) return 5; // 5% fee 31-60 days
  if (daysSinceExpiry <= 90) return 10; // 10% fee 61-90 days
  return 15; // 15% fee after 90 days
};
```

### C. Extension Payment Flow

**Add handler**:

```jsx
const handleExtendPolicy = async (policy, lateFeePercentage = 0) => {
  const balanceAmount = policy.balance_amount;
  const lateFee = balanceAmount * (lateFeePercentage / 100);
  const totalAmount = balanceAmount + lateFee;

  Alert.alert(
    "Extend Policy Coverage",
    `Policy: ${policy.policy_number}\n` +
      `Balance Amount: KSh ${balanceAmount.toLocaleString()}\n` +
      (lateFeePercentage > 0
        ? `Late Fee (${lateFeePercentage}%): KSh ${lateFee.toLocaleString()}\n`
        : "") +
      `Total to Pay: KSh ${totalAmount.toLocaleString()}\n\n` +
      `This will extend your coverage for ${
        365 - policy.initial_period_days
      } more days.`,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Pay & Extend",
        onPress: () => {
          // Navigate to payment screen with extension data
          navigation.navigate("ExtensionPayment", {
            policyId: policy.id,
            policyNumber: policy.policy_number,
            balanceAmount,
            lateFeePercentage,
            totalAmount,
            vehicleReg: policy.vehicle_reg,
            productName: policy.product_name,
            extensionDays: 365 - policy.initial_period_days,
          });
        },
      },
    ]
  );
};
```

---

## 5. Extension Payment Screen ⚠️ NEW SCREEN NEEDED

### A. Create New Screen

**File**: `frontend/screens/payments/ExtensionPayment.js`

```jsx
import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Alert } from "react-native";
import { SafeScreen } from "../../components/layout/SafeScreen";
import { CompactCurvedHeader } from "../../components/layout/CompactCurvedHeader";
import { EnhancedCard } from "../../components/common/EnhancedCard";
import { ActionButton } from "../../components/common/ActionButton";
import { Colors, Spacing, Typography } from "../../theme";
import { DjangoAPIService } from "../../services/djangoAPIService";

export default function ExtensionPaymentScreen({ route, navigation }) {
  const {
    policyId,
    policyNumber,
    balanceAmount,
    lateFeePercentage,
    totalAmount,
    vehicleReg,
    productName,
    extensionDays,
  } = route.params;

  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("mpesa");

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Call extension payment API
      const response = await DjangoAPIService.post(
        "/api/v1/motor2/policies/extend/",
        {
          policy_id: policyId,
          payment_method: paymentMethod,
          amount: totalAmount,
          late_fee_percentage: lateFeePercentage,
        }
      );

      if (response.success) {
        // Navigate to success screen
        navigation.replace("ExtensionSuccess", {
          policyNumber,
          newCoverEnd: response.new_cover_end,
          amountPaid: totalAmount,
        });
      } else {
        Alert.alert(
          "Payment Failed",
          response.message || "Unable to process extension payment"
        );
      }
    } catch (error) {
      Alert.alert("Error", "An error occurred during payment processing");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeScreen disableTopPadding>
      <CompactCurvedHeader
        title="Extend Policy Coverage"
        subtitle={`Policy ${policyNumber}`}
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.container}>
        {/* Policy Information */}
        <EnhancedCard style={styles.policyCard}>
          <Text style={styles.cardTitle}>Policy Details</Text>
          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Vehicle</Text>
            <Text style={styles.policyValue}>{vehicleReg}</Text>
          </View>
          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Product</Text>
            <Text style={styles.policyValue}>{productName}</Text>
          </View>
          <View style={styles.policyRow}>
            <Text style={styles.policyLabel}>Extension Period</Text>
            <Text style={styles.policyValue}>{extensionDays} days</Text>
          </View>
        </EnhancedCard>

        {/* Payment Breakdown */}
        <EnhancedCard style={styles.breakdownCard}>
          <Text style={styles.cardTitle}>Payment Breakdown</Text>

          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Balance Amount</Text>
            <Text style={styles.breakdownValue}>
              KSh {balanceAmount.toLocaleString()}
            </Text>
          </View>

          {lateFeePercentage > 0 && (
            <>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>
                  Late Payment Fee ({lateFeePercentage}%)
                </Text>
                <Text style={[styles.breakdownValue, { color: Colors.error }]}>
                  + KSh{" "}
                  {((balanceAmount * lateFeePercentage) / 100).toLocaleString()}
                </Text>
              </View>

              <View style={styles.lateFeNote}>
                <Text style={styles.noteIcon}>ℹ️</Text>
                <Text style={styles.noteText}>
                  Late payment fees are applied based on days past deadline
                </Text>
              </View>
            </>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalAmount}>
              KSh {totalAmount.toLocaleString()}
            </Text>
          </View>
        </EnhancedCard>

        {/* Payment Method Selection */}
        <EnhancedCard style={styles.paymentMethodCard}>
          <Text style={styles.cardTitle}>Payment Method</Text>

          <TouchableOpacity
            style={[
              styles.methodOption,
              paymentMethod === "mpesa" && styles.selectedMethod,
            ]}
            onPress={() => setPaymentMethod("mpesa")}
          >
            <Text style={styles.methodIcon}>📱</Text>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>M-PESA</Text>
              <Text style={styles.methodDesc}>Pay via M-PESA STK Push</Text>
            </View>
            {paymentMethod === "mpesa" && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.methodOption,
              paymentMethod === "bank" && styles.selectedMethod,
            ]}
            onPress={() => setPaymentMethod("bank")}
          >
            <Text style={styles.methodIcon}>🏦</Text>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>Bank Transfer</Text>
              <Text style={styles.methodDesc}>Direct bank payment</Text>
            </View>
            {paymentMethod === "bank" && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        </EnhancedCard>

        {/* Action Button */}
        <ActionButton
          title={`Pay KSh ${totalAmount.toLocaleString()}`}
          onPress={handlePayment}
          loading={loading}
          style={styles.payButton}
        />
      </ScrollView>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
  },
  policyCard: {
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  policyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  policyLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  policyValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  breakdownCard: {
    marginBottom: Spacing.md,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  breakdownLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  breakdownValue: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  lateFeNote: {
    flexDirection: "row",
    backgroundColor: Colors.warning + "15",
    padding: Spacing.sm,
    borderRadius: 8,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  noteIcon: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  noteText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.warning,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
  },
  totalAmount: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.primary,
  },
  paymentMethodCard: {
    marginBottom: Spacing.lg,
  },
  methodOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    marginBottom: Spacing.sm,
  },
  selectedMethod: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + "10",
  },
  methodIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: Typography.fontSize.md,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs / 2,
  },
  methodDesc: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  checkmark: {
    fontSize: 20,
    color: Colors.primary,
  },
  payButton: {
    marginBottom: Spacing.xl,
  },
});
```

---

## 6. Backend API Requirements ⚠️ NEEDS IMPLEMENTATION

### A. Extension Eligibility Check

**Endpoint**: `GET /api/v1/motor2/policies/{id}/extension-eligibility/`

**Response**:

```json
{
  "is_extendable": true,
  "reason": "Within grace period",
  "days_since_expiry": 15,
  "grace_remaining_days": 75,
  "balance_amount": 2400,
  "late_fee_percentage": 0,
  "total_amount": 2400,
  "extension_deadline": "2025-02-15",
  "grace_end_date": "2025-04-01"
}
```

### B. Extension Payment Processing

**Endpoint**: `POST /api/v1/motor2/policies/extend/`

**Request**:

```json
{
  "policy_id": 123,
  "payment_method": "mpesa",
  "amount": 2400,
  "late_fee_percentage": 0
}
```

**Response**:

```json
{
  "success": true,
  "policy_number": "POL-2025-123456-EXT1",
  "new_cover_end": "2026-01-15",
  "amount_paid": 2400,
  "payment_reference": "MPE987654321",
  "message": "Policy extended successfully"
}
```

### C. Extension History

**Endpoint**: `GET /api/v1/motor2/policies/{id}/extension-history/`

**Response**:

```json
{
  "extensions": [
    {
      "extension_number": 1,
      "payment_date": "2025-02-01",
      "amount_paid": 2400,
      "late_fee": 0,
      "previous_cover_end": "2025-02-01",
      "new_cover_end": "2026-01-15",
      "payment_method": "mpesa"
    }
  ]
}
```

---

## 7. Implementation Checklist

### Phase 1: Admin Configuration ✅

- [x] Visual Pricing Builder with Extension Terms modal
- [x] Data stored in features.extendible_config
- [x] Auto-sync base premium with total annual premium
- [x] Validation: Initial + Balance = Total

### Phase 2: Frontend - Motor 2 Flow ⚠️

- [ ] Enhance PremiumBreakdownCard with payment plan selection
- [ ] Add full vs installments payment options
- [ ] Update PaymentScreen to handle initial payment
- [ ] Show balance payment reminder on success screen
- [ ] Pass extendible config through quotation flow

### Phase 3: Frontend - Upcoming Screen ⚠️

- [ ] Implement extension eligibility logic in HomeScreen
- [ ] Add extension preview card to home
- [ ] Complete renderExtensionCard in UpcomingScreen
- [ ] Add late fee calculation helper
- [ ] Create handleExtendPolicy function

### Phase 4: Extension Payment ⚠️

- [ ] Create ExtensionPayment screen
- [ ] Create ExtensionSuccess screen
- [ ] Add navigation routes
- [ ] Integrate with payment gateways

### Phase 5: Backend APIs ⚠️

- [ ] Create extension-eligibility endpoint
- [ ] Create extend policy endpoint
- [ ] Add extension history endpoint
- [ ] Update policy model with extension fields
- [ ] Implement late fee calculation logic

---

## 8. User Journey Summary

### A. New Policy with Installments

1. Agent selects "Private Third-Party Extendible"
2. Fills vehicle & client details
3. Sees payment options: Full (10% discount) vs Installments
4. Chooses Installments
5. Pays initial amount (e.g., KSh 3,600 for 30 days)
6. Policy active for 30 days
7. Receives reminder to pay balance before deadline
8. Extension appears in Upcoming > Extensions tab

### B. Extension Payment (On Time)

1. Agent sees policy in Extensions tab (within deadline)
2. Clicks "Pay Balance & Extend"
3. Sees balance amount: KSh 2,400
4. No late fees (0% penalty)
5. Pays balance
6. Coverage extended for remaining 335 days
7. Policy now active for full year

### C. Extension Payment (Late)

1. Agent misses deadline, policy expired
2. Policy shows in Extensions with grace period countdown
3. Late fee applied (5%, 10%, or 15% based on days)
4. Clicks "Pay Balance & Extend"
5. Sees balance + late fee (e.g., KSh 2,400 + KSh 120 = KSh 2,520)
6. Pays total amount
7. Coverage extended despite late payment

### D. Failed to Extend

1. Grace period expires (90 days for Third-Party, 60 for TOR)
2. Policy no longer extendable
3. Removed from Extensions tab
4. Agent must create new policy for coverage

---

## 9. Next Steps

1. **Update Motor 2 Pricing Display** - Add payment plan selection UI
2. **Update Payment Screen** - Handle initial payment for extendible products
3. **Complete Upcoming Screen** - Implement extension card and logic
4. **Create Extension Payment Screen** - New dedicated screen for balance payments
5. **Build Backend APIs** - Extension eligibility, payment processing, history
6. **Testing** - End-to-end flow for extendible products
7. **Deployment** - Roll out to production

---

**Last Updated**: 2025-01-15  
**Status**: Ready for Frontend Implementation  
**Next Action**: Start with Motor 2 pricing display enhancements
