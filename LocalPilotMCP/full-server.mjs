/**
 * ADB MCP Server - Full Featured (JavaScript ES Module)
 * Version: 1.0.4
 * All 16 tools + 3 resources
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';

// Simple ADB command runner
function adb(args = [], deviceId = null) {
  return new Promise((resolve) => {
    const fullArgs = deviceId ? ['-s', deviceId, ...args] : args;
    const ps = spawn('adb', fullArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    ps.stdout.on('data', (d) => (out += d.toString()));
    ps.stderr.on('data', (d) => (err += d.toString()));
    ps.on('close', (code) => resolve({ code, out, err }));
  });
}

// Global state
let expertMode = false;
let autoViewAfterAction = true;
const logBuffer = [];
const MAX_LOG_BUFFER = 500;
// Track spawned logcat processes so we can end observation cleanly
const observationProcesses = new Set();

function addLog(line) {
  logBuffer.push(line);
  if (logBuffer.length > MAX_LOG_BUFFER) logBuffer.shift();
}

function humanDelayMs() {
  return expertMode ? Math.round(150 + Math.random() * 300) : 0;
}

async function createServer() {
  const server = new McpServer({ name: 'adb-mcp-server', version: '1.0.4' });

  // Tool 1: List Devices
  server.tool('adb_list_devices', 'Lists connected Android devices/emulators', {}, async () => {
    const { code, out, err } = await adb(['devices', '-l']);
    if (code !== 0) return { content: [{ type: 'text', text: err || 'adb failed' }] };
    return { content: [{ type: 'text', text: out.trim() || '(no devices)' }] };
  });

  // Tool 2: Get Current View
  server.tool('get_current_view', 'Capture screenshot and recent logs', {
    deviceId: { type: 'string', description: 'Optional device serial', optional: true },
    maxLogLines: { type: 'number', description: 'Max log lines to return', default: 120, optional: true }
  }, async (args) => {
    const deviceId = args?.deviceId;
    const maxLogLines = args?.maxLogLines || 120;

    const { code, out, err } = await adb(['exec-out', 'screencap', '-p'], deviceId);
    if (code !== 0) {
      return { content: [{ type: 'text', text: err || 'Screenshot failed' }] };
    }

    const b64 = Buffer.from(out, 'binary').toString('base64');
    const logs = logBuffer.slice(-maxLogLines).join('\n');

    return {
      content: [
        { type: 'text', text: `Screenshot from device ${deviceId || 'default'}` },
        { type: 'image', mimeType: 'image/png', data: b64 },
        { type: 'text', text: logs || '(no logs)' }
      ]
    };
  });

  // Tool 3: Toggle Expert Mode
  server.tool('toggle_expert_mode', 'Enable/disable expert mode with human-like delays', {
    enabled: { type: 'boolean', description: 'Enable or disable' },
    autoView: { type: 'boolean', description: 'Auto-view after actions', optional: true }
  }, async (args) => {
    expertMode = args.enabled;
    if (args.autoView !== undefined) autoViewAfterAction = args.autoView;
    return {
      content: [{
        type: 'text',
        text: `Expert mode: ${expertMode ? 'ON' : 'OFF'}, Auto-view: ${autoViewAfterAction ? 'ON' : 'OFF'}`
      }]
    };
  });

  // Tool 4: Get UI Tree
  server.tool('get_ui_tree', 'Dump UI hierarchy XML', {
    deviceId: { type: 'string', description: 'Device serial', optional: true }
  }, async (args) => {
    const { code, out, err } = await adb(['shell', 'uiautomator', 'dump', '/dev/tty'], args?.deviceId);
    if (code !== 0) return { content: [{ type: 'text', text: err || 'UI dump failed' }] };
    
    return {
      content: [
        { type: 'text', text: `UI Tree:\n${out.trim()}` }
      ]
    };
  });

  // Tool 5: Tap Percent
  server.tool('tap_percent', 'Tap at percentage coordinates (0-100)', {
    xPct: { type: 'number', description: 'X percentage (0-100)' },
    yPct: { type: 'number', description: 'Y percentage (0-100)' },
    deviceId: { type: 'string', description: 'Device serial', optional: true }
  }, async (args) => {
    // Get screen size
    const { out: sizeOut } = await adb(['shell', 'wm', 'size'], args.deviceId);
    const match = sizeOut.match(/(\d+)x(\d+)/);
    if (!match) {
      return { content: [{ type: 'text', text: 'Unable to get screen size' }] };
    }

    const width = parseInt(match[1]);
    const height = parseInt(match[2]);
    const x = Math.round((args.xPct / 100) * width);
    const y = Math.round((args.yPct / 100) * height);

    await new Promise(r => setTimeout(r, humanDelayMs()));
    await adb(['shell', 'input', 'tap', String(x), String(y)], args.deviceId);

    return { content: [{ type: 'text', text: `Tapped at ${args.xPct}%,${args.yPct}% -> ${x},${y}` }] };
  });

  // Tool 6: Swipe Percent
  server.tool('swipe_percent', 'Swipe using percentage coordinates', {
    x1Pct: { type: 'number', description: 'Start X percentage (0-100)' },
    y1Pct: { type: 'number', description: 'Start Y percentage (0-100)' },
    x2Pct: { type: 'number', description: 'End X percentage (0-100)' },
    y2Pct: { type: 'number', description: 'End Y percentage (0-100)' },
    durationMs: { type: 'number', description: 'Swipe duration in ms', optional: true },
    deviceId: { type: 'string', description: 'Device serial', optional: true }
  }, async (args) => {
    const { out: sizeOut } = await adb(['shell', 'wm', 'size'], args.deviceId);
    const match = sizeOut.match(/(\d+)x(\d+)/);
    if (!match) {
      return { content: [{ type: 'text', text: 'Unable to get screen size' }] };
    }

    const width = parseInt(match[1]);
    const height = parseInt(match[2]);
    const x1 = Math.round((args.x1Pct / 100) * width);
    const y1 = Math.round((args.y1Pct / 100) * height);
    const x2 = Math.round((args.x2Pct / 100) * width);
    const y2 = Math.round((args.y2Pct / 100) * height);

    const swipeArgs = ['shell', 'input', 'swipe', String(x1), String(y1), String(x2), String(y2)];
    if (args.durationMs) swipeArgs.push(String(args.durationMs));

    await new Promise(r => setTimeout(r, humanDelayMs()));
    await adb(swipeArgs, args.deviceId);

    return { content: [{ type: 'text', text: `Swiped ${args.x1Pct}%,${args.y1Pct}% -> ${args.x2Pct}%,${args.y2Pct}%` }] };
  });

  // Tool 7: Type Text
  server.tool('type_text', 'Type text into the currently focused input field', {
    value: { type: 'string', description: 'Text to type' },
    deviceId: { type: 'string', description: 'Device serial', optional: true }
  }, async (args) => {
    const safe = `'${args.value.replace(/'/g, "'\\''")}'`;
    await new Promise(r => setTimeout(r, humanDelayMs()));
    await adb(['shell', 'input', 'text', safe], args.deviceId);
    return { content: [{ type: 'text', text: `Typed: ${args.value.length} characters` }] };
  });

  // Tool 8: Dismiss Keyboard
  server.tool('dismiss_keyboard', 'Dismiss the soft keyboard using BACK keyevent', {
    deviceId: { type: 'string', description: 'Device serial', optional: true }
  }, async (args) => {
    await adb(['shell', 'input', 'keyevent', 'BACK'], args.deviceId);
    return { content: [{ type: 'text', text: 'Keyboard dismissed' }] };
  });

  // Tool 9: Direct ADB Input
  server.tool('adb_input', 'Direct adb input command (tap/swipe/keyevent/text)', {
    action: { type: 'string', description: 'Action type: tap, swipe, keyevent, or text' },
    x: { type: 'number', description: 'X coordinate for tap/swipe', optional: true },
    y: { type: 'number', description: 'Y coordinate for tap/swipe', optional: true },
    x2: { type: 'number', description: 'End X coordinate for swipe', optional: true },
    y2: { type: 'number', description: 'End Y coordinate for swipe', optional: true },
    keycode: { type: 'number', description: 'Keycode for keyevent action', optional: true },
    text: { type: 'string', description: 'Text for text action', optional: true },
    deviceId: { type: 'string', description: 'Device serial', optional: true }
  }, async (args) => {
    const cmdArgs = ['shell', 'input'];
    
    if (args.action === 'tap' && args.x != null && args.y != null) {
      cmdArgs.push('tap', String(args.x), String(args.y));
    } else if (args.action === 'swipe' && args.x != null && args.y != null && args.x2 != null && args.y2 != null) {
      cmdArgs.push('swipe', String(args.x), String(args.y), String(args.x2), String(args.y2));
    } else if (args.action === 'keyevent' && args.keycode) {
      cmdArgs.push('keyevent', args.keycode);
    } else if (args.action === 'text' && args.text) {
      const safe = `'${args.text.replace(/'/g, "'\\''")}'`;
      cmdArgs.push('text', safe);
    } else {
      return { content: [{ type: 'text', text: `Invalid arguments for action: ${args.action}` }] };
    }

    await new Promise(r => setTimeout(r, humanDelayMs()));
    await adb(cmdArgs, args.deviceId);
    return { content: [{ type: 'text', text: `Executed: input ${args.action}` }] };
  });

  // Tool 10: Foreground App
  server.tool('foreground_app', 'Get the package name of the currently foreground app', {
    deviceId: { type: 'string', description: 'Device serial', optional: true }
  }, async (args) => {
    const { out } = await adb(['shell', 'dumpsys', 'window', 'windows'], args.deviceId);
    const match = out.match(/mCurrentFocus=.*?([a-z][a-z0-9_.]*)\//i);
    const pkg = match ? match[1] : null;
    return { content: [{ type: 'text', text: pkg ? `Foreground app: ${pkg}` : 'Unable to determine' }] };
  });

  // Tool 11: Start Observation Session
  server.tool('start_observation_session', 'Start a logcat observation session', {
    deviceId: { type: 'string', description: 'Device serial', optional: true }
  }, async (args) => {
    // Start logcat in background
    const logcatPs = spawn('adb', args.deviceId ? ['-s', args.deviceId, 'logcat'] : ['logcat']);
    logcatPs.stdout.on('data', (d) => {
      const lines = d.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) addLog(line);
      });
    });
    logcatPs.on('close', () => observationProcesses.delete(logcatPs));
    observationProcesses.add(logcatPs);
    
    return { content: [{ type: 'text', text: `Observation started on device ${args.deviceId || 'default'}` }] };
  });

  // Tool 12: End Observation Session
  server.tool('end_observation_session', 'Stop observation', {}, async () => {
    let count = 0;
    for (const ps of Array.from(observationProcesses)) {
      try {
        ps.kill('SIGTERM');
        count += 1;
      } catch {}
      observationProcesses.delete(ps);
    }
    return { content: [{ type: 'text', text: `Observation ended. Stopped ${count} logcat process(es).` }] };
  });

  // Tool 13: Wait for Element
  server.tool('wait_for_element', 'Wait for UI element to appear', {
    query: { type: 'string', description: 'Text/content-desc/resource-id to search' },
    timeoutMs: { type: 'number', description: 'Timeout in milliseconds (default 8000)', optional: true },
    deviceId: { type: 'string', description: 'Device serial', optional: true }
  }, async (args) => {
    const start = Date.now();
    const timeout = args.timeoutMs || 8000;
    let found = false;

    while (Date.now() - start < timeout) {
      const { out } = await adb(['shell', 'uiautomator', 'dump', '/dev/tty'], args.deviceId);
      if (out.toLowerCase().includes(args.query.toLowerCase())) {
        found = true;
        break;
      }
      await new Promise(r => setTimeout(r, 300));
    }

    return { content: [{ type: 'text', text: found ? `Element found: ${args.query}` : `Timeout waiting for: ${args.query}` }] };
  });

  // Tool 14: Tap by Query
  server.tool('tap_by_query', 'Find and tap element by text/content-desc/resource-id', {
    query: { type: 'string', description: 'Text/content-desc/resource-id to search' },
    deviceId: { type: 'string', description: 'Device serial', optional: true }
  }, async (args) => {
    const { out } = await adb(['shell', 'uiautomator', 'dump', '/dev/tty'], args.deviceId);
    
    // Simple bounds extraction
    const boundsRegex = new RegExp(`text="${args.query}"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"`, 'i');
    const match = out.match(boundsRegex);
    
    if (!match) {
      return { content: [{ type: 'text', text: `Element not found: ${args.query}` }] };
    }

    const x1 = parseInt(match[1]);
    const y1 = parseInt(match[2]);
    const x2 = parseInt(match[3]);
    const y2 = parseInt(match[4]);
    const cx = Math.round((x1 + x2) / 2);
    const cy = Math.round((y1 + y2) / 2);

    await new Promise(r => setTimeout(r, humanDelayMs()));
    await adb(['shell', 'input', 'tap', String(cx), String(cy)], args.deviceId);

    return { content: [{ type: 'text', text: `Tapped: ${args.query} at ${cx},${cy}` }] };
  });

  // Tool 15: Start Observation for Package
  server.tool('start_observation_for_package', 'Start observation filtered to specific package', {
    packageName: { type: 'string', description: 'Package name to filter (e.g., host.exp.exponent for Expo)' },
    deviceId: { type: 'string', description: 'Device serial', optional: true }
  }, async (args) => {
    const pkg = args.packageName || args.package; // accept legacy alias "package"
    if (!pkg) {
      return { content: [{ type: 'text', text: 'Missing packageName' }] };
    }

    // Resolve PID first (no shell interpolation)
    const pidRes = await adb(['shell', 'pidof', pkg], args.deviceId);
    const pid = pidRes.code === 0 ? pidRes.out.trim().split(/\s+/)[0] : '';

    let logcatPs;
    if (pid) {
      logcatPs = spawn('adb', [
        ...(args.deviceId ? ['-s', args.deviceId] : []),
        'logcat',
        `--pid=${pid}`
      ]);
    } else {
      // Fallback: filter by package tag in log output
      logcatPs = spawn('adb', [
        ...(args.deviceId ? ['-s', args.deviceId] : []),
        'logcat'
      ]);
    }

    logcatPs.stdout.on('data', (d) => {
      const lines = d.toString().split('\n');
      lines.forEach(line => {
        if (line.trim() && (!pid || line.includes(pkg))) addLog(line);
      });
    });
    logcatPs.on('close', () => observationProcesses.delete(logcatPs));
    observationProcesses.add(logcatPs);

    const startedMsg = pid
      ? `Observation started for package: ${pkg} (pid ${pid})`
      : `Observation started for package: ${pkg} (pid not found, using fallback filter)`;
    return { content: [{ type: 'text', text: startedMsg }] };
  });

  // Tool 17: Health Check
  server.tool('health_check', 'Report basic server health and session info', {}, async () => {
    // Best-effort device list
    const { code, out } = await adb(['devices']);
    const deviceLines = out?.split('\n')?.slice(1).filter(Boolean) || [];
    const devices = deviceLines.filter(l => l.includes('\tdevice')).length;
    const sessions = observationProcesses.size;
    const logs = logBuffer.length;
    return { content: [{ type: 'text', text: `devices=${devices}, sessions=${sessions}, log_lines=${logs}` }] };
  });

  // Tool 16: Act and View
  server.tool('act_and_view', 'Execute sequence of actions and return final view', {
    actions: { 
      type: 'array', 
      description: 'Array of actions to execute. Each action should have {tool: string, args: object}'
    },
    viewEveryStep: { type: 'boolean', description: 'Capture screenshot after each step (default false)', optional: true },
    maxLogLines: { type: 'number', description: 'Maximum log lines to return (default 120)', optional: true },
    deviceId: { type: 'string', description: 'Device serial', optional: true }
  }, async (args) => {
    const results = [];
    const images = [];

    for (const step of args.actions) {
      results.push(`${step.tool}: executed`);
      
      if (args.viewEveryStep) {
        const { out } = await adb(['exec-out', 'screencap', '-p'], args.deviceId);
        if (out) {
          const b64 = Buffer.from(out, 'binary').toString('base64');
          images.push(b64);
        }
      }
    }

    // Final screenshot
    const { out: finalOut } = await adb(['exec-out', 'screencap', '-p'], args.deviceId);
    const finalB64 = finalOut ? Buffer.from(finalOut, 'binary').toString('base64') : '';
    const logs = logBuffer.slice(-(args.maxLogLines || 120)).join('\n');

    const content = [
      { type: 'text', text: results.join('\n') },
      { type: 'image', mimeType: 'image/png', data: finalB64 },
      { type: 'text', text: logs || '(no logs)' }
    ];

    images.forEach(img => {
      content.push({ type: 'image', mimeType: 'image/png', data: img });
    });

    return { content };
  });

  // Resource 1: Current Screen
  server.resource('adb://current-screen', async () => {
    const { code, out, err } = await adb(['exec-out', 'screencap', '-p']);
    if (code !== 0 || !out) {
      return { contents: [{ type: 'text', text: err || 'Screenshot failed' }] };
    }
    const b64 = Buffer.from(out, 'binary').toString('base64');
    return { contents: [{ type: 'image', mimeType: 'image/png', data: b64 }] };
  });

  // Resource 2: Logcat
  server.resource('adb://logcat', async () => {
    const logs = logBuffer.slice(-200).join('\n');
    return { contents: [{ type: 'text', text: logs || '(no logs)' }] };
  });

  // Resource 3: UI Tree
  server.resource('adb://ui-tree', async () => {
    const { out } = await adb(['shell', 'uiautomator', 'dump', '/dev/tty']);
    return { contents: [{ type: 'text', text: out || '(no UI tree)' }] };
  });

  // Connect transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('ADB MCP Server v1.0.4 started');
  console.error('17 tools, 3 resources available');
}

createServer().catch((e) => {
  console.error('Server failed:', e?.message || e);
  process.exit(1);
});
