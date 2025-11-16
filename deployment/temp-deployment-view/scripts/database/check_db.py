#!/usr/bin/env python
"""
Check PostgreSQL database configuration and structure
"""
import os
import sys
import django

# Add the project root to the Python path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from django.conf import settings
from django.db import connection

def main():
    print('=' * 80)
    print('POSTGRESQL DATABASE VERIFICATION')
    print('=' * 80)
    
    # Check database configuration
    print('\n1. DATABASE CONFIGURATION:')
    print('-' * 40)
    db_config = settings.DATABASES['default']
    print(f'Engine: {db_config["ENGINE"]}')
    print(f'Database: {db_config["NAME"]}')
    print(f'Host: {db_config["HOST"]}')
    print(f'Port: {db_config["PORT"]}')
    print(f'User: {db_config["USER"]}')
    
    # Test connection
    print('\n2. CONNECTION TEST:')
    print('-' * 40)
    try:
        with connection.cursor() as cursor:
            cursor.execute('SELECT version();')
            version = cursor.fetchone()[0]
            print(f'✅ Connected to PostgreSQL')
            print(f'Version: {version[:50]}...')
            
            # Check motor tables
            print('\n3. MOTOR TABLES:')
            print('-' * 40)
            cursor.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name LIKE 'app_%motor%'
                ORDER BY table_name;
            """)
            
            motor_tables = cursor.fetchall()
            for table in motor_tables:
                print(f'  ✅ {table[0]}')
            
            # Check specific table structure
            print('\n4. MOTORSUBCATEGORY TABLE STRUCTURE:')
            print('-' * 40)
            cursor.execute("""
                SELECT column_name, data_type, is_nullable 
                FROM information_schema.columns
                WHERE table_name = 'app_motorsubcategory'
                ORDER BY ordinal_position;
            """)
            
            columns = cursor.fetchall()
            for col in columns:
                nullable = "NULL" if col[2] == "YES" else "NOT NULL"
                print(f'  {col[0]:25} {col[1]:15} {nullable}')
            
            # Check for foreign key constraints on motorsubcategory
            print('\n5. FOREIGN KEY CONSTRAINTS:')
            print('-' * 40)
            cursor.execute("""
                SELECT 
                    tc.table_name,
                    kcu.column_name,
                    ccu.table_name AS referenced_table,
                    ccu.column_name AS referenced_column
                FROM information_schema.table_constraints tc
                JOIN information_schema.key_column_usage kcu 
                    ON tc.constraint_name = kcu.constraint_name
                JOIN information_schema.constraint_column_usage ccu 
                    ON ccu.constraint_name = tc.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY' 
                    AND ccu.table_name = 'app_motorsubcategory'
                ORDER BY tc.table_name;
            """)
            
            foreign_keys = cursor.fetchall()
            if foreign_keys:
                for fk in foreign_keys:
                    print(f'  {fk[0]}.{fk[1]} -> {fk[2]}.{fk[3]}')
            else:
                print('  No foreign key constraints found referencing motorsubcategory')
            
    except Exception as e:
        print(f'❌ Database connection failed: {e}')
        return False
    
    print('\n' + '=' * 80)
    return True

if __name__ == '__main__':
    main()