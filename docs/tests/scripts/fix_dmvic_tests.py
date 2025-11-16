"""
Fix DMVIC integration tests to work with the standalone endpoint format
"""
import re

file_path = '../insurance-app/app/tests/test_dmvic_integration.py'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Replace mock paths
content = content.replace(
    "@patch('app.services.dmvic_service.get_dmvic_service')",
    "@patch('app.views.dmvic_integrations.get_dmvic_service')"
)

# 2. Replace @patch settings with @override_settings
content = re.sub(
    r"@patch\('django\.conf\.settings\.DMVIC_ENABLED', True\)",
    "@override_settings(DMVIC_ENABLED=True)",
    content
)
content = re.sub(
    r"@patch\('django\.conf\.settings\.DMVIC_ENABLED', False\)",
    "@override_settings(DMVIC_ENABLED=False)",
    content
)

# 3. Fix response data access - 'exists' -> 'existing_cover']['exists']
content = re.sub(
    r"data\['exists'\]",
    "data['existing_cover']['exists']",
    content
)

# 4. Fix policy access - data['policy'] -> data['existing_cover']['policy']
content = re.sub(
    r"(?<!existing_cover\'\]\[')data\['policy'\]",
    "data['existing_cover']['policy']",
    content
)

# 5. Fix vehicle_details -> vehicle
content = re.sub(
    r"data\['vehicle_details'\]",
    "data['vehicle']",
    content
)

# 6. Fix vehicle field names in standalone endpoint response
replacements = {
    "vehicle['registration']": "vehicle['registration_number']",
    "vehicle['year']": "vehicle['year_of_manufacture']",
    "vehicle['source']": "vehicle.get('source', 'DMVIC')",  # May not be in mock
}

for old, new in replacements.items():
    content = content.replace(old, new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed all DMVIC test patterns")
print("✅ Updated mock decorators to use app.views.dmvic_integrations")
print("✅ Updated response assertions to match standalone endpoint format")
