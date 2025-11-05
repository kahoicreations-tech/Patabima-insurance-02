import re
from pathlib import Path

p = Path(__file__).parent.parent / 'insurance-app' / 'app' / 'tests' / 'test_dmvic_integration.py'
with open(p, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace all instances of the old URL pattern
content = re.sub(
    r"url = '/api/v1/public_app/integrations/vehicle_check'",
    "url = VEHICLE_CHECK_URL",
    content
)

with open(p, 'w', encoding='utf-8') as f:
    f.write(content)

print('URLs updated successfully')
