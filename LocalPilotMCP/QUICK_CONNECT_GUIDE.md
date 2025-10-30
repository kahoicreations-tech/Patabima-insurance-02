# Quick Connect Guide - ADB MCP Server for VS Code Copilot

## ✅ Your MCP Server is Already Set Up!

Your ADB MCP server is already configured in `.vscode/settings.json` and built in the `dist/` folder.

## 🔧 How to Enable MCP Tools in VS Code Copilot

### Step 1: Configure Tools in VS Code

1. Open **Command Palette** (Press `Ctrl+Shift+P` on Windows or `Cmd+Shift+P` on Mac)
2. Type and select: **"Copilot: Configure Tools"**
3. In the dialog that appears, you should see **"adb-android"** listed
4. **Check the box** next to "adb-android" to enable it
5. Click **OK**

### Step 2: Verify Configuration

The MCP server is configured to run with:

- **Command**: `node`
- **Path**: `LocalPilotMCP/dist/index.js`
- **Server Name**: `adb-android`

This is already set in your `.vscode/settings.json`:

```json
{
  "mcp.servers": {
    "adb-android": {
      "command": "node",
      "args": ["LocalPilotMCP/dist/index.js"]
    }
  }
}
```

### Step 3: Ensure Prerequisites

Make sure you have:

1. ✅ **Android Emulator Running** (e.g., Expo Go app with your PataBima app)
2. ✅ **ADB in PATH** - Test with: `adb devices` in terminal
3. ✅ **Node.js 18+** - Test with: `node --version`

## 🎯 How to Use MCP Tools in Copilot Chat

Once enabled, you can ask Copilot to interact with your Android emulator:

### Available Tools:

1. **List Devices**

   ```
   @workspace Show me connected Android devices
   ```

2. **Take Screenshot**

   ```
   @workspace Take a screenshot of the emulator
   ```

   Or:

   ```
   @workspace What's currently on the emulator screen?
   ```

3. **Start Observation Session** (with live logs)

   ```
   @workspace Start observing the Android emulator
   ```

4. **Get Recent Logs**

   ```
   @workspace Show me recent Android logs
   ```

5. **Stop Observation**
   ```
   @workspace Stop observing the emulator
   ```

### Example Workflows:

**Debug a Screen Issue:**

```
@workspace Take a screenshot of the emulator and analyze the Domestic Package Insurance screen layout
```

**Monitor App Logs:**

```
@workspace Start observing the emulator and show me any errors in the logs
```

**Check Current State:**

```
@workspace What's the current state of the app on the emulator?
```

## 🚀 Manual Testing (Optional)

If you want to test the MCP server manually before using it with Copilot:

### Test ADB Connection:

```powershell
cd LocalPilotMCP
npm run adb:devices
```

### Take a Screenshot:

```powershell
npm run observe:screenshot
```

### Get Logs:

```powershell
npm run observe:logs
```

### Start Live Observation:

```powershell
npm run observe:live
```

## 🐛 Troubleshooting

### If MCP Tools Don't Appear in Copilot:

1. **Reload VS Code**

   - Press `Ctrl+Shift+P` → "Developer: Reload Window"

2. **Check MCP Server Status**

   - Open Output panel (View → Output)
   - Select "MCP" from the dropdown
   - Look for any error messages

3. **Verify Build**

   ```powershell
   cd LocalPilotMCP
   npm run build
   ```

4. **Test ADB Manually**
   ```powershell
   adb devices
   ```
   Should show your emulator (e.g., `emulator-5554`)

### If Screenshot/Logs Don't Work:

1. **Ensure Emulator is Running**

   ```powershell
   adb devices
   ```

2. **Check ADB Connection**

   ```powershell
   adb shell "echo test"
   ```

3. **Restart ADB Server**
   ```powershell
   adb kill-server
   adb start-server
   ```

## 📱 Best Practices for PataBima Development

1. **Start Observation Before Testing**

   - Before testing a feature, ask Copilot to start observing
   - This captures logs in real-time

2. **Take Screenshots for UI Issues**

   - When you see a layout issue, immediately ask for a screenshot
   - Copilot can analyze the visual state

3. **Monitor Logs During Navigation**

   - Ask Copilot to show logs when navigating between screens
   - Helps catch navigation errors

4. **Use for Debugging Crashes**
   - If app crashes, ask Copilot to show recent logs
   - The MCP server buffers logcat output

## 🎨 Integration with Your Current Workflow

Since you're working on the Domestic Package Insurance screen, you could:

1. Start the emulator with your app
2. Ask Copilot: `@workspace Take a screenshot of the current screen`
3. Ask: `@workspace Analyze the header spacing on the Domestic Package Insurance screen`
4. Copilot will use the MCP tools to capture and analyze the actual rendered screen!

## 📚 Additional Resources

- Full API docs: `PRD_ADB_MCP_SERVER.md`
- Setup details: `SETUP_GUIDE.md`
- Usage guide: `LLM_USAGE_GUIDE.md`
- Copilot examples: `COPILOT_USAGE.md`

---

**Next Steps:**

1. Open Command Palette (`Ctrl+Shift+P`)
2. Run "Copilot: Configure Tools"
3. Enable "adb-android"
4. Start using MCP tools in Copilot Chat! 🚀
