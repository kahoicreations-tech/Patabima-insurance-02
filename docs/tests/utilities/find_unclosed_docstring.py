import os

candidates = [
    os.path.join('insurance-app', 'app', 'services', 'dmvic_service.py'),
    os.path.join('app', 'services', 'dmvic_service.py'),
]

target = None
for p in candidates:
    if os.path.exists(p):
        target = p
        break

if not target:
    raise SystemExit(f"Could not find dmvic_service.py. Tried: {candidates}")

with open(target, 'r', encoding='utf-8') as f:
    lines = f.readlines()
    
state_dq = False  # within """
state_sq = False  # within '''

print('Scanning for triple-quote balance...')
for i, line in enumerate(lines, 1):
    parts = []
    idx = 0
    s = line
    # scan left-to-right for tokens without overlapping
    while True:
        j = s.find('"""', idx)
        k = s.find("'''", idx)
        if j == -1 and k == -1:
            break
        if j != -1 and (k == -1 or j < k):
            parts.append(('dq', j))
            idx = j + 3
        else:
            parts.append(('sq', k))
            idx = k + 3
    if parts:
        before = (state_dq, state_sq)
        for typ, _ in parts:
            if typ == 'dq':
                state_dq = not state_dq
            else:
                state_sq = not state_sq
        after = (state_dq, state_sq)
        print(f"Line {i}: tokens={','.join(t for t,_ in parts)} before={before} after={after} -> {line.strip()}")

print(f"\nFinal states -> dq={state_dq} sq={state_sq}")
if state_dq or state_sq:
    print("ERROR: File ends with unclosed triple-quoted string (\"\"\" or ''')")
