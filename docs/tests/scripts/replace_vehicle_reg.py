with open('../insurance-app/app/tests/test_dmvic_integration.py', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("'vehicle_registration':", "'registration_number':")

with open('../insurance-app/app/tests/test_dmvic_integration.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Replaced all vehicle_registration with registration_number")
