# views/vehicle_validation.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import random
from datetime import datetime, timedelta
import time


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_vehicle_registration(request):
    """
    Simulate AKI/NTSA vehicle validation service
    """
    registration = request.data.get('registration_number', '').upper()
    
    if not registration:
        return Response({'error': 'Registration number required'}, status=400)
    
    # Simulate AKI response with realistic vehicle data
    mock_vehicles = {
        'KDD123A': {
            'registration_number': 'KDD123A',
            'make': 'Toyota',
            'model': 'Hiace',
            'year_of_manufacture': 2018,
            'engine_capacity': 2700,
            'tonnage': 3.5,
            'passenger_capacity': 14,
            'chassis_number': 'JTFSH3P26J3012345',
            'vehicle_type': 'COMMERCIAL',
            'fuel_type': 'Diesel',
            'color': 'White',
            'status': 'ACTIVE',
            'owner_name': 'John Doe Transport Ltd',
            'last_inspection': '2024-06-15'
        },
        'KCA456B': {
            'registration_number': 'KCA456B',
            'make': 'Nissan',
            'model': 'Note',
            'year_of_manufacture': 2019,
            'engine_capacity': 1200,
            'tonnage': None,
            'passenger_capacity': 5,
            'chassis_number': 'SJNFAAJ10U0123456',
            'vehicle_type': 'PRIVATE',
            'fuel_type': 'Petrol',
            'color': 'Silver',
            'status': 'ACTIVE',
            'owner_name': 'Jane Smith',
            'last_inspection': '2024-08-20'
        }
    }
    
    # Simulate network delay
    time.sleep(1)
    
    if registration in mock_vehicles:
        vehicle_data = mock_vehicles[registration]
        
        # Calculate vehicle age
        current_year = datetime.now().year
        vehicle_age = current_year - vehicle_data['year_of_manufacture']
        
        return Response({
            'success': True,
            'vehicle': {
                **vehicle_data,
                'vehicle_age': vehicle_age,
                'validation_status': 'VERIFIED',
                'validation_timestamp': datetime.now().isoformat(),
                'source': 'AKI_SIMULATION'
            }
        })
    else:
        # Generate random vehicle data for unknown registrations
        makes = ['Toyota', 'Nissan', 'Honda', 'Mazda', 'Subaru', 'Mitsubishi']
        models = ['Vitz', 'Note', 'Fit', 'Demio', 'Impreza', 'Lancer']
        
        return Response({
            'success': True,
            'vehicle': {
                'registration_number': registration,
                'make': random.choice(makes),
                'model': random.choice(models),
                'year_of_manufacture': random.randint(2010, 2023),
                'engine_capacity': random.randint(1000, 2000),
                'tonnage': None,
                'passenger_capacity': random.randint(4, 7),
                'chassis_number': f'SIM{random.randint(100000, 999999)}',
                'vehicle_type': 'PRIVATE',
                'fuel_type': random.choice(['Petrol', 'Diesel']),
                'color': random.choice(['White', 'Silver', 'Black', 'Blue']),
                'status': 'ACTIVE',
                'owner_name': 'Simulated Owner',
                'last_inspection': (datetime.now() - timedelta(days=random.randint(30, 365))).strftime('%Y-%m-%d'),
                'vehicle_age': datetime.now().year - random.randint(2010, 2023),
                'validation_status': 'SIMULATED',
                'validation_timestamp': datetime.now().isoformat(),
                'source': 'AKI_SIMULATION'
            }
        })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def validate_vehicle_chassis(request):
    """
    Simulate chassis number validation
    """
    chassis_number = request.data.get('chassis_number', '').upper()
    
    if not chassis_number:
        return Response({'error': 'Chassis number required'}, status=400)
    
    # Simulate chassis validation
    time.sleep(1.5)
    
    return Response({
        'success': True,
        'vehicle': {
            'chassis_number': chassis_number,
            'registration_number': f'K{random.choice(["CA", "DD", "BA"])}{random.randint(100, 999)}{random.choice(["A", "B", "C"])}',
            'make': random.choice(['Toyota', 'Nissan', 'Honda']),
            'model': random.choice(['Vitz', 'Note', 'Fit']),
            'year_of_manufacture': random.randint(2015, 2023),
            'validation_status': 'CHASSIS_VERIFIED',
            'validation_timestamp': datetime.now().isoformat(),
            'source': 'CHASSIS_SIMULATION'
        }
    })