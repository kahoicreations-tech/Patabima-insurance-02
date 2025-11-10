import requests
import json

response = requests.post(
    'http://127.0.0.1:8000/api/insurance/dmvic/search-vehicle/',
    json={'registration_number': 'KAC040R', 'proposed_cover_start_date': '2025-11-09'},
    timeout=10
)

data = response.json()
print('=' * 80)
print('DMVIC Response for KAC040R:')
print('=' * 80)
print(json.dumps(data, indent=2))
print('\n' + '=' * 80)
print('KEY FIELDS:')
print('=' * 80)
print(f'has_existing_cover (root): {data.get("has_existing_cover")}')
print(f'existing_cover_expiry (root): {data.get("existing_cover_expiry")}')
vehicle = data.get('vehicle', {})
print(f'vehicle.has_active_cover: {vehicle.get("has_active_cover")}')
current_policy = vehicle.get('current_policy', {})
print(f'vehicle.current_policy.cover_end_date: {current_policy.get("cover_end_date")}')
