# Setup Guide: ADB MCP Server

This guide helps you install and run the ADB MCP server to let an LLM observe your Android emulator in real-time.

## Prerequisites

- Node.js 18+
- Android SDK Platform Tools installed (adb)
- An Android emulator (e.g., Pixel 5 API 30) or a physical device

## Install

1. Open a terminal in `LocalPilotMCP`
2. Install dependencies

```pwsh
npm install
```

3. Build the project

```pwsh
npm run build
```

## Run (stdio mode)

Start the MCP server (it communicates over stdio):

```pwsh
npm start
```

Then configure your MCP client (Claude Desktop / VS Code) to launch this server via stdio.

## Verify ADB

Ensure `adb` is accessible:

```pwsh
adb version
adb devices
```

If not, add Android SDK platform-tools to PATH.

## Usage (MVP)

From your MCP client:

- Call tool `adb_list_devices` to see connected devices
- Call tool `start_observation_session` to start log monitoring
- Read resource `adb://current-screen` to capture a PNG
- Read resource `adb://logcat` to get recent logs
- Call tool `end_observation_session` to stop

## Troubleshooting

- If no devices are found, start your emulator from Android Studio (AVD Manager)
- If screenshots fail, check that the screen is unlocked and the app is visible
- If logs are empty, ensure the app is running and log level is adequate

---

For advanced features and roadmap, see `PRD_ADB_MCP_SERVER.md`.
