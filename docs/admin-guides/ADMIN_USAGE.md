# PataBima Admin Usage (Quick Guide)

- Login: http://localhost:8000/admin (create with `python manage.py createsuperuser` if needed)
- Key sections:
  - Motor Categories/Subcategories: Create products; toggle `is_extendible`; link `extendible_variant`.
  - Underwriters: Manage insurers. Ensure they’re active to assign pricing.
  - Motor Pricing: Per-underwriter rates. Actions:
    - Activate/Deactivate selected
    - Clone pricing to another underwriter (with % adjustment)
    - Bulk update a pricing field by %
  - Extendible Pricing: Configure partial-period (initial days, initial amount), balance, grace, templates.
  - Policy Extensions: Track extension status, send reminders.
  - Extension Reminders: View scheduled/sent reminders.

## Typical Workflow

1. Create Categories/Subcategories. Mark extendible products with `is_extendible`.
2. Add Underwriters.
3. Add Motor Pricing per subcategory and underwriter.
4. For extendible products, add Extendible Pricing entries.
5. Use actions to clone pricing or bulk update rates.
6. Monitor Policy Extensions and send reminders when needed.

## Tips

- Use filters/search in each admin list to narrow results.
- For bulk price changes, start with small filtered sets; verify results.
- Document templates are plain text; variables can be introduced later.
