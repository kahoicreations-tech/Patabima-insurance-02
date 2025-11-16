"""
Generate a comprehensive database schema report for PataBima Insurance App
Exports schema to JSON and markdown formats
"""
import django
import os
import json
from datetime import datetime

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'insurance.settings')
django.setup()

from django.db import connection
from django.apps import apps

print('=' * 100)
print('📊 PATABIMA DATABASE SCHEMA REPORT')
print('=' * 100)
print(f'Generated: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}')
print(f'Database: patabima_insurance')
print('=' * 100)

# Get all tables with detailed information
cursor = connection.cursor()

# Get database statistics
cursor.execute("""
    SELECT 
        schemaname,
        COUNT(DISTINCT tablename) as table_count
    FROM pg_tables
    WHERE schemaname = 'public'
    GROUP BY schemaname
""")
db_stats = cursor.fetchone()

print(f'\n📈 Database Statistics:')
print(f'Schema: {db_stats[0]}')
print(f'Total Tables: {db_stats[1]}')

# Get all tables
cursor.execute("""
    SELECT 
        table_name,
        (SELECT COUNT(*) 
         FROM information_schema.columns c 
         WHERE c.table_name = t.table_name 
         AND c.table_schema = 'public') as column_count
    FROM information_schema.tables t
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE'
    ORDER BY table_name
""")
tables = cursor.fetchall()

schema_data = {
    'database': 'patabima_insurance',
    'generated_at': datetime.now().isoformat(),
    'total_tables': len(tables),
    'tables': []
}

print(f'\n{"=" * 100}')
print('📋 DETAILED TABLE SCHEMAS')
print(f'{"=" * 100}\n')

for table_info in tables:
    table_name = table_info[0]
    column_count = table_info[1]
    
    # Get row count
    try:
        cursor.execute(f'SELECT COUNT(*) FROM "{table_name}"')
        row_count = cursor.fetchone()[0]
    except Exception as e:
        row_count = 0
    
    # Get columns
    cursor.execute(f"""
        SELECT 
            column_name,
            data_type,
            character_maximum_length,
            is_nullable,
            column_default,
            ordinal_position
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = '{table_name}'
        ORDER BY ordinal_position
    """)
    columns = cursor.fetchall()
    
    # Get primary keys
    cursor.execute(f"""
        SELECT a.attname
        FROM pg_index i
        JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
        WHERE i.indrelid = '{table_name}'::regclass
        AND i.indisprimary
    """)
    primary_keys = [row[0] for row in cursor.fetchall()]
    
    # Get foreign keys
    cursor.execute(f"""
        SELECT
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_name = '{table_name}'
    """)
    foreign_keys = cursor.fetchall()
    
    # Get indexes
    cursor.execute(f"""
        SELECT 
            indexname,
            indexdef
        FROM pg_indexes
        WHERE tablename = '{table_name}'
        AND schemaname = 'public'
    """)
    indexes = cursor.fetchall()
    
    # Print table header
    print(f'┌{"─" * 98}┐')
    print(f'│ 📁 {table_name.upper():<94} │')
    print(f'├{"─" * 98}┤')
    print(f'│ Rows: {row_count:<20} Columns: {column_count:<20} Primary Keys: {len(primary_keys):<18} │')
    print(f'└{"─" * 98}┘')
    
    # Print columns
    print(f'\n  🔹 COLUMNS ({len(columns)}):')
    print(f'  {"─" * 96}')
    
    columns_data = []
    for col in columns:
        col_name = col[0]
        data_type = col[1]
        max_length = col[2]
        nullable = col[3]
        default = col[4]
        position = col[5]
        
        # Format data type
        type_display = data_type
        if max_length:
            type_display += f'({max_length})'
        
        # Mark primary key
        pk_marker = ' 🔑' if col_name in primary_keys else ''
        nullable_display = '✓' if nullable == 'YES' else '✗'
        
        print(f'  {position:2}. {col_name:<35} {type_display:<25} NULL:{nullable_display} {pk_marker}')
        
        columns_data.append({
            'name': col_name,
            'type': data_type,
            'max_length': max_length,
            'nullable': nullable == 'YES',
            'default': default,
            'is_primary_key': col_name in primary_keys
        })
    
    # Print foreign keys
    if foreign_keys:
        print(f'\n  🔗 FOREIGN KEYS ({len(foreign_keys)}):')
        print(f'  {"─" * 96}')
        fk_data = []
        for fk in foreign_keys:
            print(f'  • {fk[0]} → {fk[1]}.{fk[2]}')
            fk_data.append({
                'column': fk[0],
                'references_table': fk[1],
                'references_column': fk[2]
            })
    else:
        fk_data = []
    
    # Print indexes
    if indexes:
        print(f'\n  📇 INDEXES ({len(indexes)}):')
        print(f'  {"─" * 96}')
        index_data = []
        for idx in indexes:
            print(f'  • {idx[0]}')
            index_data.append({
                'name': idx[0],
                'definition': idx[1]
            })
    else:
        index_data = []
    
    print(f'\n')
    
    # Add to schema data
    schema_data['tables'].append({
        'name': table_name,
        'row_count': row_count,
        'column_count': column_count,
        'columns': columns_data,
        'primary_keys': primary_keys,
        'foreign_keys': fk_data,
        'indexes': index_data
    })

# Export to JSON
json_file = 'database_schema.json'
with open(json_file, 'w', encoding='utf-8') as f:
    json.dump(schema_data, f, indent=2, default=str)

print(f'{"=" * 100}')
print(f'✅ SCHEMA REPORT COMPLETE')
print(f'{"=" * 100}')
print(f'\n📄 Exported to: {json_file}')
print(f'📊 Total Tables: {len(tables)}')
print(f'📝 Total Records Across All Tables: {sum(t["row_count"] for t in schema_data["tables"])}')

# Print key tables summary
print(f'\n{"=" * 100}')
print('🏆 KEY TABLES WITH DATA')
print(f'{"=" * 100}\n')

# Filter tables with data and sort by row count
tables_with_data = sorted(
    [t for t in schema_data['tables'] if t['row_count'] > 0],
    key=lambda x: x['row_count'],
    reverse=True
)

for table in tables_with_data[:20]:  # Top 20 tables
    print(f'  • {table["name"]:<50} {table["row_count"]:>10} rows')

print(f'\n{"=" * 100}')
print('✅ Schema extraction completed successfully!')
print(f'{"=" * 100}')
