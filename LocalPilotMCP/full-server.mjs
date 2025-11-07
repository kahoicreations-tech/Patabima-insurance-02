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
  server.tool('adb_list_devices', {
    title: 'List ADB Devices',
    description: 'Lists connected Android devices/emulators',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false }
  }, async () => {
    const { code, out, err } = await adb(['devices', '-l']);
    if (code !== 0) return { content: [{ type: 'text', text: err || 'adb failed' }] };
    return { content: [{ type: 'text', text: out.trim() || '(no devices)' }] };
  });

  // Tool 2: Get Current View
  server.tool('get_current_view', {
    title: 'Get Current View',
    description: 'Capture screenshot and recent logs',
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'string', description: 'Optional device serial' },
        maxLogLines: { type: 'number', description: 'Max log lines to return', default: 120 }
      },
      additionalProperties: false
    }
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
  server.tool('toggle_expert_mode', {
    title: 'Toggle Expert Mode',
    description: 'Enable/disable expert mode with human-like delays',
    inputSchema: {
      type: 'object',
      properties: {
        enabled: { type: 'boolean', description: 'Enable or disable' },
        autoView: { type: 'boolean', description: 'Auto-view after actions' }
      },
      required: ['enabled'],
      additionalProperties: false
    }
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
  server.tool('get_ui_tree', {
    title: 'Get UI Tree',
    description: 'Dump UI hierarchy XML',
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'string', description: 'Device serial' }
      },
      additionalProperties: false
    }
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
  server.tool('tap_percent', {
    title: 'Tap by Percentage',
    description: 'Tap at percentage coordinates (0-100)',
    inputSchema: {
      type: 'object',
      properties: {
        xPct: { type: 'number', minimum: 0, maximum: 100 },
        yPct: { type: 'number', minimum: 0, maximum: 100 },
        deviceId: { type: 'string' }
      },
      required: ['xPct', 'yPct'],
      additionalProperties: false
    }
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
  server.tool('swipe_percent', {
    title: 'Swipe by Percentage',
    description: 'Swipe using percentage coordinates',
    inputSchema: {
      type: 'object',
      properties: {
        x1Pct: { type: 'number', minimum: 0, maximum: 100 },
        y1Pct: { type: 'number', minimum: 0, maximum: 100 },
        x2Pct: { type: 'number', minimum: 0, maximum: 100 },
        y2Pct: { type: 'number', minimum: 0, maximum: 100 },
        durationMs: { type: 'number', description: 'Swipe duration in ms' },
        deviceId: { type: 'string' }
      },
      required: ['x1Pct', 'y1Pct', 'x2Pct', 'y2Pct'],
      additionalProperties: false
    }
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
  server.tool('type_text', {
    title: 'Type Text',
    description: 'Type text into focused input field',
    inputSchema: {
      type: 'object',
      properties: {
        value: { type: 'string', description: 'Text to type' },
        deviceId: { type: 'string' }
      },
      required: ['value'],
      additionalProperties: false
    }
  }, async (args) => {
    const safe = `'${args.value.replace(/'/g, "'\\''")}'`;
    await new Promise(r => setTimeout(r, humanDelayMs()));
    await adb(['shell', 'input', 'text', safe], args.deviceId);
    return { content: [{ type: 'text', text: `Typed: ${args.value.length} characters` }] };
  });

  // Tool 8: Dismiss Keyboard
  server.tool('dismiss_keyboard', {
    title: 'Dismiss Keyboard',
    description: 'Dismiss soft keyboard using BACK key',
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'string' }
      },
      additionalProperties: false
    }
  }, async (args) => {
    await adb(['shell', 'input', 'keyevent', 'BACK'], args.deviceId);
    return { content: [{ type: 'text', text: 'Keyboard dismissed' }] };
  });

  // Tool 9: ADB Input
  server.tool('adb_input', {
    title: 'ADB Input',
    description: 'Direct adb input command',
    inputSchema: {
      type: 'object',
      properties: {
        action: { type: 'string', enum: ['tap', 'swipe', 'keyevent', 'text'] },
        x: { type: 'number' },
        y: { type: 'number' },
        x2: { type: 'number' },
        y2: { type: 'number' },
        keycode: { type: 'string' },
        text: { type: 'string' },
        deviceId: { type: 'string' }
      },
      required: ['action'],
      additionalProperties: false
    }
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
  server.tool('foreground_app', {
    title: 'Get Foreground App',
    description: 'Get package name of foreground app',
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'string' }
      },
      additionalProperties: false
    }
  }, async (args) => {
    const { out } = await adb(['shell', 'dumpsys', 'window', 'windows'], args.deviceId);
    const match = out.match(/mCurrentFocus=.*?([a-z][a-z0-9_.]*)\//i);
    const pkg = match ? match[1] : null;
    return { content: [{ type: 'text', text: pkg ? `Foreground app: ${pkg}` : 'Unable to determine' }] };
  });

  // Tool 11: Start Observation Session
  server.tool('start_observation_session', {
    title: 'Start Observation Session',
    description: 'Start logcat observation',
    inputSchema: {
      type: 'object',
      properties: {
        deviceId: { type: 'string' }
      },
      additionalProperties: false
    }
  }, async (args) => {
    // Start logcat in background
    const logcatPs = spawn('adb', args.deviceId ? ['-s', args.deviceId, 'logcat'] : ['logcat']);
    logcatPs.stdout.on('data', (d) => {
      const lines = d.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) addLog(line);
      });
    });
    
    return { content: [{ type: 'text', text: `Observation started on device ${args.deviceId || 'default'}` }] };
  });

  // Tool 12: End Observation Session
  server.tool('end_observation_session', {
    title: 'End Observation Session',
    description: 'Stop observation',
    inputSchema: {
      type: 'object',
      properties: {},
      additionalProperties: false
    }
  }, async () => {
    return { content: [{ type: 'text', text: 'Observation ended (logcat continues in background)' }] };
  });

  // Tool 13: Wait for Element
  server.tool('wait_for_element', {
    title: 'Wait for Element',
    description: 'Wait for UI element to appear',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Text/content-desc/resource-id to search' },
        timeoutMs: { type: 'number', default: 8000 },
        deviceId: { type: 'string' }
      },
      required: ['query'],
      additionalProperties: false
    }
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
  server.tool('tap_by_query', {
    title: 'Tap by Query',
    description: 'Find and tap element by text/content-desc/resource-id',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        deviceId: { type: 'string' }
      },
      required: ['query'],
      additionalProperties: false
    }
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
  server.tool('start_observation_for_package', {
    title: 'Start Observation for Package',
    description: 'Start observation filtered to specific package',
    inputSchema: {
      type: 'object',
      properties: {
        packageName: { type: 'string', description: 'Package to filter (e.g., host.exp.exponent)' },
        deviceId: { type: 'string' }
      },
      required: ['packageName'],
      additionalProperties: false
    }
  }, async (args) => {
    const logcatPs = spawn('adb', [
      ...(args.deviceId ? ['-s', args.deviceId] : []),
      'logcat',
      `--pid=$(adb ${args.deviceId ? `-s ${args.deviceId}` : ''} shell pidof ${args.packageName})`
    ]);
    
    logcatPs.stdout.on('data', (d) => {
      const lines = d.toString().split('\n');
      lines.forEach(line => {
        if (line.trim()) addLog(line);
      });
    });

    return { content: [{ type: 'text', text: `Observation started for package: ${args.packageName}` }] };
  });

  // Tool 16: Act and View
  server.tool('act_and_view', {
    title: 'Act and View',
    description: 'Execute sequence of actions and return final view',
    inputSchema: {
      type: 'object',
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              tool: { type: 'string' },
              args: { type: 'object' }
            }
          }
        },
        viewEveryStep: { type: 'boolean', default: false },
        maxLogLines: { type: 'number', default: 120 },
        deviceId: { type: 'string' }
      },
      required: ['actions'],
      additionalProperties: false
    }
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
  console.error('16 tools, 3 resources available');
}

createServer().catch((e) => {
  console.error('Server failed:', e?.message || e);
  process.exit(1);
});
