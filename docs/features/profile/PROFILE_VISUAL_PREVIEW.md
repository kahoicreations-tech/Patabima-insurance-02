# Profile Section - Visual Preview

## Before & After Comparison

### BEFORE:
```
┌─────────────────────────────────────────┐
│ Good Morning                       👋   │
│ John Doe 🎉                             │
│ Welcome back! Ready to help customers...│
│                                         │
│ [Agent Code: PBA001]                    │
│                                         │
│                           View Profile →│
└─────────────────────────────────────────┘
```

### AFTER:
```
┌─────────────────────────────────────────┐
│ Good Morning              [🟢 Online]   │
│ John Doe 🎉                             │
│ Welcome back! Ready to help customers...│
│                                         │
│ [Agent Code: PBA001]                    │
│ ⏰ Last: 2h ago • 💰 Next Commission: in 5 days (Nov 15) │
│                                         │
│                           View Profile →│
└─────────────────────────────────────────┘
```

## Detailed Component Breakdown

### 1. Online Status Badge
```
┌─────────────┐
│ 🟢 Online   │  ← Green background (#E8F5E9)
└─────────────┘    Green dot (6px) + Text (#2E7D32)
                   Font: 10px medium
```

### 2. Activity Row (Last Login + Commission)
```
⏰ Last: 2h ago • 💰 Next Commission: in 5 days (Nov 15)
└──────────────┘ └─┘ └─────────────────────────────────┘
    Icon+Text    Dot           Icon+Text
    (#646767)          (#646767 for last, #D5222B for commission)
    Font: 12px regular (xs)
```

## Layout Structure

```
┌─────────────────────────────────────────────────────────┐
│ <greetingRow>                                           │
│   Good Morning                      [🟢 Online]         │
│ </greetingRow>                                          │
│                                                         │
│ <welcomeName>                                           │
│   John Doe 🎉                                           │
│ </welcomeName>                                          │
│                                                         │
│ <welcomeDescription>                                    │
│   Welcome back! Ready to help customers...              │
│ </welcomeDescription>                                   │
│                                                         │
│ <agentInfoRow>                                          │
│   [Agent Code: PBA001]                                  │
│ </agentInfoRow>                                         │
│                                                         │
│ <activityRow>                                           │
│   ⏰ Last: 2h ago • 💰 Next Commission: in 5 days...   │
│ </activityRow>                                          │
└─────────────────────────────────────────────────────────┘
```

## Time-Based Display Examples

### Last Login Formatting:
| Actual Time Difference | Display Text        |
|------------------------|---------------------|
| < 1 minute             | Just now            |
| 5 minutes              | 5m ago              |
| 30 minutes             | 30m ago             |
| 2 hours                | 2h ago              |
| 1 day                  | 1d ago              |
| 5 days                 | 5d ago              |
| 10 days                | Jan 5, 2025         |
| 60 days                | Nov 15, 2024        |

### Commission Date Formatting:
| Days Until Payout | Display Text                |
|-------------------|-----------------------------|
| 0 (today)         | Today                       |
| 1 (tomorrow)      | Tomorrow                    |
| 3 days            | in 3 days (Nov 15)         |
| 7 days            | in 7 days (Nov 15)         |
| 15 days           | Nov 15                      |
| 30 days           | Dec 15                      |

## Color Palette Reference

### Online Badge:
- Background: `#E8F5E9` (Light Green)
- Dot: `#4CAF50` (Material Green 500)
- Text: `#2E7D32` (Material Green 800)

### Activity Row:
- Text Color: `#646767` (Medium Gray)
- Clock Icon: `#646767` (Medium Gray)
- Wallet Icon: `#D5222B` (PataBima Red)
- Dot Separator: `#646767` (Medium Gray)
- No background (transparent)

## Responsive Behavior

### Large Screens (Tablets):
```
┌─────────────────────────────────────────────────────────┐
│ Good Morning                            [🟢 Online]     │
│ John Doe 🎉                                             │
│ Welcome back! Ready to help customers...                │
│                                                         │
│ [Agent Code: PBA001]                                    │
│ ⏰ Last: 2h ago • 💰 Next Commission: in 5 days...     │
└─────────────────────────────────────────────────────────┘
```

### Small Screens (Mobile):
```
┌───────────────────────────────┐
│ Good Morning    [🟢 Online]   │
│ John Doe 🎉                   │
│ Welcome back! Ready to...     │
│                               │
│ [Agent Code: PBA001]          │
│ ⏰ Last: 2h ago •             │
│ 💰 Next Commission: ...       │
└───────────────────────────────┘
```
(Activity row wraps when needed using flexWrap)

## Conditional Display Logic

### Online Badge:
✅ **Always shown** when user is logged in

### Activity Row:
✅ Shown if either `lastLogin` OR `nextPayout` exists
❌ Hidden if both are null/undefined
- Shows only last login if commission not available
- Shows only commission if last login not available
- Shows both with dot separator when both available

## Icon Usage

### From Ionicons:
- `time-outline` - Clock icon for last login
- `wallet-outline` - Wallet icon for commission

### Custom:
- Green dot (View component) - Online indicator

## Spacing & Padding

```
Component              Padding (V x H)    Border Radius
─────────────────────  ─────────────────  ─────────────
onlineBadge            4px x 8px          12px
agentCodeBadge         8px x 12px         8px
activityRow            None (text flow)   -
dotSeparator           4x4 circle         2px
activityText spacing   4px left margin    -
```

## Accessibility Notes

✅ Color contrast meets WCAG AA standards
✅ Icons paired with descriptive text
✅ Touch targets properly sized (min 44x44)
✅ Readable font sizes (min 10px for labels)
✅ Semantic color usage (green=online, orange=money)

## Dark Mode Ready (Future)

While not implemented yet, the design uses semantic colors that can easily adapt:

```
Light Mode              Dark Mode
──────────────────────  ──────────────────────
#E8F5E9 (Light Green)   #1B5E20 (Dark Green)
#F5F5F5 (Light Gray)    #424242 (Dark Gray)
#FFF3E0 (Light Orange)  #E65100 (Keep Orange)
```
