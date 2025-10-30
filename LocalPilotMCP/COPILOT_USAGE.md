# Using ADB MCP Server with VS Code Copilot

This guide shows you how to enable and use the ADB MCP server with GitHub Copilot in VS Code to observe and interact with your Android emulator during development.

## Prerequisites

1. **Built MCP Server**: Run `npm install && npm run build` in the `LocalPilotMCP` directory
2. **Android Emulator Running**: Ensure your Android emulator (e.g., emulator-5554) is running
3. **ADB Available**: Android SDK Platform Tools must be installed and `adb` in your PATH

## Setup Steps

### 1. Enable the Tool in VS Code

The server is already configured in `.vscode/settings.json`. To enable it:

1. Open **Command Palette** (`Ctrl+Shift+P` on Windows/Linux, `Cmd+Shift+P` on Mac)
2. Type and select: `Copilot: Configure Tools`
3. Find and check **`adb-mcp`** in the tools list
4. Click **OK**

### 2. Verify Tool is Available

Open Copilot Chat and ask:

```
What tools do you have access to?
```

You should see `adb-mcp` tools listed including:

- `adb_list_devices`
- `start_observation_session`
- `end_observation_session`
- Resources: `adb://current-screen`, `adb://logcat`

## Usage Examples

### Check Connected Devices

Ask Copilot:

```
@workspace What Android devices are connected?
```

Copilot will call `adb_list_devices` and show you all connected emulators/devices.

---

### Start Monitoring the Emulator

Ask Copilot:

```
@workspace Start observing the Android emulator and show me the current screen
```

Copilot will:

1. Call `start_observation_session` to begin logcat streaming
2. Read `adb://current-screen` resource to capture a screenshot
3. Display the screenshot inline in the chat

---

### View Recent Logs

Ask Copilot:

```
@workspace Show me recent Android logs, filter for errors
```

Copilot will:

1. Read `adb://logcat` resource
2. Analyze the logs and highlight errors/warnings

---

### Debug App Behavior

Ask Copilot:

```
@workspace I'm testing the PataBima app. Take a screenshot and check the logs for any ReactNative errors
```

Copilot will:

1. Capture the current screen
2. Read logcat output
3. Identify ReactNative-specific issues
4. Suggest fixes based on the visual state and logs

---

### Continuous Observation Workflow

Ask Copilot:

```
@workspace Start observing the emulator. I'll tell you when to take screenshots and check logs.
```

Then interact naturally:

- "Take a screenshot now"
- "What errors appeared in the last 30 seconds?"
- "Show me the current screen and any warnings"

When done:

```
@workspace Stop observing the emulator
```

---

## Advanced Usage

### Filter Logs by Priority

Ask Copilot:

```
@workspace Start observation with priority level E (errors only)
```

Copilot will call:

```json
{
  "name": "start_observation_session",
  "arguments": {
    "priority": "E"
  }
}
```

Priority levels:

- `V` - Verbose
- `D` - Debug
- `I` - Info (default)
- `W` - Warning
- `E` - Error
- `F` - Fatal

---

### Filter by Tags

Ask Copilot:

```
@workspace Start observation for ReactNativeJS and Expo tags only
```

Copilot will call:

```json
{
  "name": "start_observation_session",
  "arguments": {
    "tags": ["ReactNativeJS", "Expo"]
  }
}
```

---

### Specific Device Selection

If you have multiple devices/emulators:

```
@workspace List devices, then start observation on emulator-5556
```

Copilot will:

1. Call `adb_list_devices` to show options
2. Call `start_observation_session` with `deviceId: "emulator-5556"`

---

## Workflow Integration Examples

### Testing a New Feature

```
@workspace I'm testing the Motor Insurance flow in PataBima.
Start observing the emulator, take a screenshot every time I ask,
and monitor logs for any errors related to pricing calculations.
```

Then navigate through your app and ask:

- "Screenshot"
- "Any errors?"
- "What's happening in the logs?"

---

### Debugging a Crash

```
@workspace The app just crashed. Show me the last 50 lines of logs
and highlight the crash stack trace
```

Copilot will read `adb://logcat` and analyze the crash.

---

### UI Verification

```
@workspace Take a screenshot and verify that:
1. The PataBima logo is visible
2. The bottom navigation has 5 tabs
3. The Dashboard card is showing the correct layout
```

Copilot will capture the screen and perform visual analysis based on your criteria.

---

## Troubleshooting

### Tool Not Showing Up

1. Ensure you've run `npm run build` in `LocalPilotMCP`
2. Check that `dist/index.js` exists
3. Reload VS Code window (`Ctrl+Shift+P` → `Reload Window`)
4. Re-run `Copilot: Configure Tools` and enable `adb-mcp`

### "No devices found" Error

1. Verify emulator is running: Open a terminal and run `adb devices`
2. If no devices listed, start your Android emulator
3. If multiple offline devices, run `adb kill-server && adb start-server`

### Screenshots Not Working

1. Ensure the emulator screen is unlocked
2. Check that `adb exec-out screencap -p` works manually
3. On Windows, ensure adb.exe is in PATH

### Logs Empty

1. Start observation first: `@workspace start observing`
2. Wait a few seconds for logcat buffer to fill
3. Check that logcat is running: `adb logcat` in terminal

---

## Manual CLI (Alternative)

If you prefer direct CLI usage over Copilot:

```bash
cd LocalPilotMCP

# List devices
npm run adb:devices

# Start observation
npm run observe:start

# View logs
npm run observe:logs

# Take screenshot (saves to out/screen.png)
npm run observe:screenshot

# Stop observation
npm run observe:stop
```

---

## Tips for Best Results

1. **Always start observation** before asking for logs (gives time to buffer)
2. **Be specific** about what you're looking for in logs or screenshots
3. **Mention your app name** (PataBima) to get context-aware analysis
4. **Stop observation** when done to free resources
5. **Use natural language** - Copilot understands intent and will chain tool calls

---

## What's Next

The current MVP provides:

- ✅ Device listing and selection
- ✅ Screenshot capture (PNG)
- ✅ Logcat streaming and buffering
- ✅ Observation session lifecycle

Coming soon:

- 🔄 UI hierarchy resource (`adb://ui-tree`) via uiautomator
- 🔄 App state detection (current activity, orientation, etc.)
- 🔄 Continuous polling for real-time updates
- 🔄 Optional SQLite caching for session history

See `PRD_ADB_MCP_SERVER.md` for the full roadmap.
