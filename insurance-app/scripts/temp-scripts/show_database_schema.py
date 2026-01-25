import django
import os

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from django.db import connection

print('=' * 80)
print('📊 PATABIMA DATABASE SCHEMA')
print('=' * 80)
print(f'Database: patabima_insurance')
print(f'PostgreSQL Version: 17.6')
print('=' * 80)

# Get all tables
cursor = connection.cursor()
cursor.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema='public' 
    AND table_type='BASE TABLE' 
    ORDER BY table_name
""")
tables = cursor.fetchall()

print(f'\n📋 TOTAL TABLES: {len(tables)}\n')

# Get detailed schema for each table
for table in tables:
    table_name = table[0]
    
    # Get columns
    cursor.execute(f"""
        SELECT 
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = '{table_name}'
        ORDER BY ordinal_position
    """)
    columns = cursor.fetchall()
    
    # Get row count
    try:
        cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
        row_count = cursor.fetchone()[0]
    except:
        row_count = 'N/A'
    
    print(f'\n{"─" * 80}')
    print(f'📁 TABLE: {table_name.upper()}')
    print(f'{"─" * 80}')
    print(f'Rows: {row_count}')
    print(f'\nColumns ({len(columns)}):')
    
    for col in columns:
        col_name = col[0]
        data_type = col[1]
        max_length = col[2] if col[2] else ''
        nullable = 'NULL' if col[3] == 'YES' else 'NOT NULL'
        default = col[4] if col[4] else ''
        
        type_display = f'{data_type}'
        if max_length:
            type_display += f'({max_length})'
        
        print(f'  • {col_name:<40} {type_display:<30} {nullable:<10} {default}')

print('\n' + '=' * 80)
print('✅ SCHEMA EXTRACTION COMPLETE')
print('=' * 80)

# Key tables summary
print('\n📊 KEY TABLES SUMMARY:\n')

key_tables = [
    'app_manualquote',
    'app_motorpolicy', 
    'app_agentcommission',
    'app_insuranceprovider',
    'app_motorpricing',
    'app_motorcategory',
    'app_motorsubcategory',
    'auth_user'
]

for key_table in key_tables:
    cursor.execute(f"""
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_name = '{key_table}'
    """)
    exists = cursor.fetchone()[0]
    
    if exists:
        cursor.execute(f'SELECT COUNT(*) FROM "{key_table}"')
        count = cursor.fetchone()[0]
        print(f'✅ {key_table:<40} {count:>10} rows')
    else:
        print(f'❌ {key_table:<40} NOT FOUND')

print('\n' + '=' * 80)
