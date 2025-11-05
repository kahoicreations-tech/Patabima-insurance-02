import sys, re
from pathlib import Path
p = Path('insurance-app/app/services/dmvic_service.py')
s = p.read_text(encoding='utf-8')
lines = s.splitlines()

def show_line(i):
    line = lines[i-1]
    print(f"L{i}: {line}")
    for idx, ch in enumerate(line):
        if ch in ('"', "'", '“', '”', '‘', '’'):
            print(f"  idx {idx}: U+{ord(ch):04X} {repr(ch)}")

def show_func(name):
    for i, line in enumerate(lines, 1):
        if line.strip().startswith(f'def {name}'):
            start = i
            break
    else:
        print(f'{name} not found')
        return
    print(f"\n--- Context around {name} at L{start} ---")
    for j in range(start, start+30):
        show_line(j)

show_func('get_certificate_pdf')
show_func('validate_certificate')
show_func('issue_type_d_certificate')

print('\n--- Scan entire file for smart quotes ---')
for i, line in enumerate(lines, 1):
    if any(ch in line for ch in ('“', '”', '‘', '’')):
        print(f"L{i}: contains smart quotes")
        show_line(i)
