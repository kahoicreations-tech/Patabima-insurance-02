#!/usr/bin/env python
"""Calculate correct extendible config values with mandatory levies"""

from decimal import Decimal

# Base premium from admin
base_premium = Decimal('7000')

# Calculate mandatory levies
itl = (base_premium * Decimal('0.0025')).quantize(Decimal('1.00'))
pcf = (base_premium * Decimal('0.0025')).quantize(Decimal('1.00'))
stamp = Decimal('40.00')

total_with_levies = base_premium + itl + pcf + stamp

print("\n" + "="*80)
print("EXTENDIBLE CONFIG CALCULATION WITH MANDATORY LEVIES")
print("="*80)
print(f"\nBase Premium: KSh {base_premium:,}")
print(f"  + ITL (0.25%): KSh {itl:,}")
print(f"  + PCF (0.25%): KSh {pcf:,}")
print(f"  + Stamp Duty: KSh {stamp:,}")
print(f"  = Total Annual Premium: KSh {total_with_levies:,}")

print("\n" + "-"*80)
print("OPTION 1: 60/40 Split (Recommended)")
print("-"*80)

# 60% upfront, 40% balance
initial_pct = Decimal('0.60')
balance_pct = Decimal('0.40')

initial_amount = (total_with_levies * initial_pct).quantize(Decimal('1.00'))
balance_amount = (total_with_levies * balance_pct).quantize(Decimal('1.00'))

# Adjust for rounding to ensure sum equals total
actual_sum = initial_amount + balance_amount
if actual_sum != total_with_levies:
    diff = total_with_levies - actual_sum
    balance_amount += diff

print(f"Initial Amount (60%): KSh {initial_amount:,}")
print(f"Balance Amount (40%): KSh {balance_amount:,}")
print(f"Total: KSh {initial_amount + balance_amount:,}")

print("\n" + "-"*80)
print("OPTION 2: Fixed 4200/2800 (Requested by Admin)")
print("-"*80)

fixed_initial = Decimal('4200')
fixed_balance = Decimal('2800')
fixed_total = fixed_initial + fixed_balance

shortfall = total_with_levies - fixed_total

print(f"Initial Amount: KSh {fixed_initial:,}")
print(f"Balance Amount: KSh {fixed_balance:,}")
print(f"Subtotal: KSh {fixed_total:,}")
if shortfall > 0:
    print(f"⚠️ Shortfall (levies not covered): KSh {shortfall:,}")
    print(f"   This means the customer pays KSh {fixed_total:,} but actual cost is KSh {total_with_levies:,}")
else:
    print(f"✅ Covers full premium")

print("\n" + "-"*80)
print("OPTION 3: Apply Levies Proportionally to Each Payment")
print("-"*80)

# Base amounts
base_initial = Decimal('4200')
base_balance = Decimal('2800')
base_total = base_initial + base_balance

# Calculate what percentage each payment is of the base
initial_base_pct = base_initial / base_total
balance_base_pct = base_balance / base_total

# Apply levies proportionally
total_levies = itl + pcf + stamp
initial_levies = (total_levies * initial_base_pct).quantize(Decimal('1.00'))
balance_levies = total_levies - initial_levies  # Remainder to avoid rounding issues

initial_with_levies = base_initial + initial_levies
balance_with_levies = base_balance + balance_levies

print(f"Initial Payment:")
print(f"  Base: KSh {base_initial:,}")
print(f"  Levies ({initial_base_pct*100:.1f}%): KSh {initial_levies:,}")
print(f"  Total: KSh {initial_with_levies:,}")
print(f"\nBalance Payment:")
print(f"  Base: KSh {base_balance:,}")
print(f"  Levies ({balance_base_pct*100:.1f}%): KSh {balance_levies:,}")
print(f"  Total: KSh {balance_with_levies:,}")
print(f"\nGrand Total: KSh {initial_with_levies + balance_with_levies:,}")

print("\n" + "="*80)
print("RECOMMENDATION")
print("="*80)
print("\nUse OPTION 3 (Proportional Levies) because:")
print("  1. Initial payment clearly shows base + levies breakdown")
print("  2. Total equals actual premium with all mandatory levies")
print("  3. Maintains the desired 60/40 base split (4200/2800)")
print("  4. Transparent for customers")

print("\n📝 Update extendible_config to:")
print(f"""
{{
  "initial_amount": {float(initial_with_levies)},
  "balance_amount": {float(balance_with_levies)},
  "total_annual_premium": {float(total_with_levies)},
  "initial_period_days": 30,
  "extension_deadline_days": 30,
  "grace_period_days": 7,
  "penalty_for_late_extension": 0,
  "allow_partial_extension": false
}}
""")

print("="*80 + "\n")
