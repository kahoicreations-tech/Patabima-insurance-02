# ADB MCP Server (PataBima)

Real-time Android emulator observation for LLMs via Model Context Protocol.

Features (MVP):

- List/select devices
- Live screenshots (polling)
- Logcat streaming
- Observation sessions (start/stop)

See `PRD_ADB_MCP_SERVER.md` for the full product spec.

## Quick Start

1. Prerequisites

- Node.js 18+
- Android SDK Platform Tools (adb) on PATH

2. Install

- Run `npm install` in this directory
- Build with `npm run build`

3. The server is already configured in `.vscode/settings.json` and available as `adb-mcp` in VS Code Copilot Chat tools.

## VS Code Copilot Integration

### Enable the Tool

1. Open VS Code Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Run `Copilot: Configure Tools`
3. Check `adb-mcp` in the tools list
4. Click OK

### Using the Tools in Copilot Chat

Once enabled, you can ask Copilot to:

**List connected devices:**

```
@workspace Show me what Android devices are connected
```

**Start observing the emulator:**

```
@workspace Start observing the Android emulator
```

**Take a screenshot:**

```
@workspace Take a screenshot of the emulator screen
```

**Check recent logs:**

```
@workspace Show me recent Android logs from the emulator
```

**Stop observation:**

```
@workspace Stop observing the emulator
```

Copilot will automatically use the appropriate tools:

- `adb_list_devices` - Lists connected devices/emulators
- `start_observation_session` - Begins logcat streaming
- `end_observation_session` - Stops observation
- `adb://current-screen` - Captures PNG screenshot
- `adb://logcat` - Retrieves buffered logs

## Manual Usage (CLI)

You can also use the npm scripts directly:

```bash
# List devices
npm run adb:devices

# Start observation (auto-selects emulator)
npm run observe:start

# View recent logs
npm run observe:logs

# Take screenshot (saves to out/screen.png)
npm run observe:screenshot

# Stop observation
npm run observe:stop

# Live observation (logs streaming + screenshots every 30s)
npm run observe:live

# Live observation filtered to Expo app only (replace package if needed)
node scripts/observe-live.mjs --pkg=host.exp.exponent --screenshot-interval=30 --logs-every=2000
```

## Notes

- On Windows, ensure `adb.exe` is installed and accessible in PATH (Android SDK platform-tools).
- The server will attempt to locate `adb` via PATH and common install locations.

## What’s implemented in MVP

- Tools: `adb_list_devices`, `start_observation_session`, `end_observation_session`
- Resources: `adb://current-screen` (PNG), `adb://logcat` (text)

## Next steps

- Add UI hierarchy resource and app state
- Add polling/streaming orchestration for continuous observation
- Optional: wire up SQLite caching from `DB_SCHEMA.md`

## License

MIT
