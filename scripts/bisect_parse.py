from pathlib import Path
import ast
p = Path('insurance-app/app/services/dmvic_service.py')
text = p.read_text(encoding='utf-8')
lines = text.splitlines()
low, high = 1, len(lines)
# Find smallest prefix that fails to parse
fail_line = None
while low <= high:
    mid = (low + high) // 2
    snippet = '\n'.join(lines[:mid])
    try:
        ast.parse(snippet)
        low = mid + 1
    except SyntaxError as e:
        fail_line = mid
        high = mid - 1

print(f"First failing prefix line ~ {fail_line}")
if fail_line:
    # Show surrounding context
    start = max(1, fail_line - 10)
    end = min(len(lines), fail_line + 10)
    for i in range(start, end+1):
        print(f"{i:5d}: {lines[i-1]}")
