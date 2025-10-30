# DB Schema: Observation Cache

Purpose: Cache recent screenshots, UI hierarchy, logs, and state for short-term history and analysis.

For simplicity in v1, we recommend a lightweight SQLite DB using better-sqlite3. This doc specifies tables.

## Tables

### sessions

- id (TEXT, PK)
- device_id (TEXT)
- started_at (DATETIME)
- ended_at (DATETIME NULL)

### screenshots

- id (TEXT, PK)
- session_id (TEXT, FK -> sessions.id)
- captured_at (DATETIME)
- width (INTEGER)
- height (INTEGER)
- png_base64 (TEXT) -- store base64 (small history window)
- screen_hash (TEXT) -- perceptual hash for change detection
- current_screen (TEXT NULL)

INDEX: session_id, captured_at

### ui_hierarchies

- id (TEXT, PK)
- session_id (TEXT, FK)
- captured_at (DATETIME)
- json (TEXT)
- hierarchy_hash (TEXT)

INDEX: session_id, captured_at

### logs

- id (INTEGER, PK AUTOINCREMENT)
- session_id (TEXT, FK)
- timestamp (DATETIME)
- priority (TEXT)
- tag (TEXT)
- message (TEXT)

INDEX: session_id, timestamp

### app_states

- id (TEXT, PK)
- session_id (TEXT, FK)
- captured_at (DATETIME)
- current_activity (TEXT)
- navigation_json (TEXT)
- memory_mb (INTEGER)
- cpu_percent (REAL NULL)

INDEX: session_id, captured_at

## Retention Policy

- Keep last 200 screenshots per session
- Keep last 1000 logs per session
- Purge session data 48h after session end

## Notes

- For v1, DB usage is optional; if not configured, in-memory buffers will be used
- Future: switch to filesystem blobs for screenshots if size grows
