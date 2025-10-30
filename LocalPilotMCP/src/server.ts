import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { z } from 'zod';import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

import { ADB } from './adb/executor.js';

import { captureScreenshot } from './adb/screenshot.js';import { z } from 'zod';import { z } from 'zod';

import { LogcatManager } from './adb/logcat.js';

import { ObservationSessionManager } from './observation/session-manager.js';import { ADB } from './adb/executor.js';import { ADB } from './adb/executor.js';

import { getForegroundApp, getPidForPackage } from './adb/process.js';

import { dumpUiXml, extractElements, parseBounds } from './adb/ui.js';import { captureScreenshot } from './adb/screenshot.js';import { captureScreenshot } from './adb/screenshot.js';

import { getScreenSize } from './adb/display.js';

import { LogcatManager } from './adb/logcat.js';import { LogcatManager } from './adb/logcat.js';

const logcatManager = new LogcatManager();

const sessions = new ObservationSessionManager(logcatManager);import { ObservationSessionManager } from './observation/session-manager.js';import { ObservationSessionManager } from './observation/session-manager.js';



export async function createServer(): Promise<McpServer> {import { getForegroundApp, getPidForPackage } from './adb/process.js';import { getForegroundApp, getPidForPackage } from './adb/process.js';

  const server = new McpServer({ name: 'adb-mcp-server', version: '1.0.3' });

import { dumpUiXml, extractElements, parseBounds } from './adb/ui.js';import { dumpUiXml, extractElements, parseBounds } from './adb/ui.js';

  let expertMode = false;

  let autoViewAfterAction = true;import { getScreenSize } from './adb/display.js';import { getScreenSize } from './adb/display.js';

  const humanDelayMs = (): number => expertMode ? Math.round(150 + Math.random() * 300) : 0;



  // Tool: Start Observation Session

  server.registerTool(const logcatManager = new LogcatManager();const logcatManager = new LogcatManager();

    'start_observation_session',

    {const sessions = new ObservationSessionManager(logcatManager);const sessions = new ObservationSessionManager(logcatManager);

      title: 'Start Observation Session',

      description: 'Start an observation session for an Android device/emulator (begins logcat streaming).',

      inputSchema: z.object({

        deviceId: z.string().optional().describe('Device ID from `adb devices` (optional, auto-selects emulator-5554 if available)'),export async function createServer(): Promise<McpServer> {export async function createServer() {

        priority: z.enum(['V', 'D', 'I', 'W', 'E', 'F']).optional().default('I'),

        tags: z.array(z.string()).optional().describe('Optional logcat tags to filter (e.g., ReactNativeJS, Expo)')  const server = new McpServer({ name: 'adb-mcp-server', version: '1.0.3' });  const server = new McpServer({ name: 'adb-mcp-server', version: '1.0.4' });

      })

    },  let expertMode = false;

    async ({ deviceId, priority = 'I', tags = [] }) => {

      const selected = deviceId || (await ADB.autoSelectDevice());  let expertMode = false;  let autoViewAfterAction = true; // when expert mode, return a view after interactions

      if (!selected) {

        return { content: [{ type: 'text', text: 'No Android devices/emulators found. Start an emulator and try again.' }] };  let autoViewAfterAction = true; // when expert mode, return a view after interactions  const humanDelayMs = () => expertMode ? Math.round(150 + Math.random() * 300) : 0; // small human-like delay

      }

      await sessions.start(selected, { priority, tags });  const humanDelayMs = (): number => expertMode ? Math.round(150 + Math.random() * 300) : 0; // small human-like delay

      return { content: [{ type: 'text', text: `Observation session started for ${selected}` }] };

    }  // Tools

  );

  // Tools  server.registerTool(

  // Tool: Start Observation for Package

  server.registerTool(  server.registerTool(    'start_observation_session',

    'start_observation_for_package',

    {    'start_observation_session',    {

      title: 'Start Observation for Package',

      description: 'Start observation filtered to a specific Android package (e.g., your Expo app). Uses logcat --pid when available and common React Native tags.',    {      title: 'Start Observation Session',

      inputSchema: z.object({

        package: z.string().optional().describe('Android package name. If omitted, attempts to use the foreground app.'),      title: 'Start Observation Session',      description: 'Start an observation session for an Android device/emulator (begins logcat streaming).',

        priority: z.enum(['V', 'D', 'I', 'W', 'E', 'F']).optional().default('I')

      })      description: 'Start an observation session for an Android device/emulator (begins logcat streaming).',      inputSchema: {

    },

    async ({ package: pkg, priority = 'I' }) => {      inputSchema: {        deviceId: z.string().optional().describe('Device ID from `adb devices` (optional, auto-selects emulator-5554 if available)'),

      const deviceId = (await ADB.autoSelectDevice());

      if (!deviceId) {        deviceId: z.string().optional().describe('Device ID from `adb devices` (optional, auto-selects emulator-5554 if available)'),        priority: z.enum(['V', 'D', 'I', 'W', 'E', 'F']).optional().default('I'),

        return { content: [{ type: 'text', text: 'No Android devices/emulators found.' }] };

      }        priority: z.enum(['V', 'D', 'I', 'W', 'E', 'F']).optional().default('I'),        tags: z.array(z.string()).optional().describe('Optional logcat tags to filter (e.g., ReactNativeJS, Expo)')

      const targetPkg = pkg || (await getForegroundApp(deviceId));

      const pid = await getPidForPackage(deviceId, targetPkg);        tags: z.array(z.string()).optional().describe('Optional logcat tags to filter (e.g., ReactNativeJS, Expo)')      }

      const tags = ['ReactNativeJS', 'ReactNative', 'Expo', 'RN'];

      }    },

      await sessions.start(deviceId, { priority, tags, pid: pid || undefined });

      const msg = pid ? `Observation started for ${targetPkg} (pid ${pid})` : `Observation started for ${targetPkg} (pid unknown, tag-filtered only)`;    },    async ({ deviceId, priority = 'I', tags = [] }) => {

      return { content: [{ type: 'text', text: msg }] };

    }    async ({ deviceId, priority = 'I', tags = [] }) => {      const selected = deviceId || (await ADB.autoSelectDevice());

  );

      const selected = deviceId || (await ADB.autoSelectDevice());      if (!selected) {

  // Tool: End Observation Session

  server.registerTool(      if (!selected) {        return { content: [{ type: 'text', text: 'No Android devices/emulators found. Start an emulator and try again.' }] };

    'end_observation_session',

    {        return { content: [{ type: 'text', text: 'No Android devices/emulators found. Start an emulator and try again.' }] };      import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

      title: 'End Observation Session',

      description: 'End the current observation session and stop logcat streaming.',      }      import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

      inputSchema: z.object({})

    },      await sessions.start(selected, { priority, tags });      import { z } from 'zod';

    async () => {

      const ended = await sessions.end();      return { content: [{ type: 'text', text: `Observation session started for ${selected}` }] };      import { ADB } from './adb/executor.js';

      return { content: [{ type: 'text', text: ended ? 'Observation session ended.' : 'No active observation session.' }] };

    }    }      import { captureScreenshot } from './adb/screenshot.js';

  );

  );      import { LogcatManager } from './adb/logcat.js';

  // Tool: List ADB Devices

  server.registerTool(      import { ObservationSessionManager } from './observation/session-manager.js';

    'adb_list_devices',

    {  server.registerTool(      import { getForegroundApp, getPidForPackage } from './adb/process.js';

      title: 'List ADB Devices',

      description: 'List connected Android devices and emulators',    'start_observation_for_package',      import { dumpUiXml, extractElements, parseBounds } from './adb/ui.js';

      inputSchema: z.object({})

    },    {      import { getScreenSize } from './adb/display.js';

    async () => {

      const devices = await ADB.listDevices();      title: 'Start Observation for Package',

      if (devices.length === 0) {

        return { content: [{ type: 'text', text: 'No devices/emulators connected.' }] };      description: 'Start observation filtered to a specific Android package (e.g., your Expo app). Uses logcat --pid when available and common React Native tags.',      const logcatManager = new LogcatManager();

      }

      const lines = devices.map((d) => `- ${d.id} (${d.state})`).join('\n');      inputSchema: {      const sessions = new ObservationSessionManager(logcatManager);

      return { content: [{ type: 'text', text: `Connected devices:\n${lines}` }] };

    }        package: z.string().optional().describe('Android package name. If omitted, attempts to use the foreground app.'),

  );

        priority: z.enum(['V', 'D', 'I', 'W', 'E', 'F']).optional().default('I')      export async function createServer() {

  // Resource: current-screen

  server.registerResource(      }        const server = new McpServer({ name: 'adb-mcp-server', version: '1.1.0' });

    'current-screen',

    'adb://current-screen',    },        let expertMode = false;

    {

      title: 'Live Emulator Screen',    async ({ package: pkg, priority = 'I' }) => {        let autoViewAfterAction = true;

      description: 'Capture a PNG screenshot of the current screen for the active device/emulator',

      mimeType: 'image/png'      const deviceId = (await ADB.autoSelectDevice());        const humanDelayMs = () => (expertMode ? Math.round(150 + Math.random() * 300) : 0);

    },

    async (uri) => {      if (!deviceId) {

      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());

      if (!deviceId) {        return { content: [{ type: 'text', text: 'No Android devices/emulators found.' }] };        // Start observation

        return {

          contents: [{ uri: uri.href, mimeType: 'text/plain', text: 'No active device/emulator found.' }]      }        server.registerTool(

        };

      }      const targetPkg = pkg || (await getForegroundApp(deviceId));          'start_observation_session',

      const png = await captureScreenshot(deviceId);

      const base64 = png.toString('base64');      const pid = await getPidForPackage(deviceId, targetPkg);          {

      return {

        contents: [      const tags = ['ReactNativeJS', 'ReactNative', 'Expo', 'RN'];            title: 'Start Observation Session',

          { uri: uri.href, mimeType: 'image/png', blob: base64 }

        ]            description: 'Start logcat streaming for a device/emulator',

      };

    }      await sessions.start(deviceId, { priority, tags, pid: pid || undefined });            inputSchema: {

  );

      const msg = pid ? `Observation started for ${targetPkg} (pid ${pid})` : `Observation started for ${targetPkg} (pid unknown, tag-filtered only)`;              deviceId: z.string().optional(),

  // Resource: logcat

  server.registerResource(      return { content: [{ type: 'text', text: msg }] };              priority: z.enum(['V', 'D', 'I', 'W', 'E', 'F']).optional().default('I'),

    'logcat',

    'adb://logcat',    }              tags: z.array(z.string()).optional()

    {

      title: 'Logcat Snapshot',  );            }

      description: 'Recent logcat output (last 200 lines) for the active device/emulator',

      mimeType: 'text/plain'          },

    },

    async (uri) => {  server.registerTool(          async ({ deviceId, priority = 'I', tags = [] }) => {

      const text = logcatManager.getBuffer().join('\n');

      return { contents: [{ uri: uri.href, mimeType: 'text/plain', text }] };    'end_observation_session',            const selected = deviceId || (await ADB.autoSelectDevice());

    }

  );    {            if (!selected) return { content: [{ type: 'text', text: 'No Android devices/emulators found.' }] };



  // Tool: Get Current View      title: 'End Observation Session',            await sessions.start(selected, { priority, tags });

  server.registerTool(

    'get_current_view',      description: 'End the current observation session and stop logcat streaming.',            return { content: [{ type: 'text', text: `Observation session started for ${selected}` }] };

    {

      title: 'Get Current View (Screenshot + Logs)',      inputSchema: {}          }

      description: 'Captures a screenshot and returns it with the most recent logcat lines in a single result.',

      inputSchema: z.object({    },        );

        includeLogs: z.boolean().optional().default(true),

        maxLogLines: z.number().int().optional().default(120)    async () => {

      })

    },      const ended = await sessions.end();        server.registerTool(

    async ({ includeLogs = true, maxLogLines = 120 }) => {

      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());      return { content: [{ type: 'text', text: ended ? 'Observation session ended.' : 'No active observation session.' }] };          'start_observation_for_package',

      if (!deviceId) {

        return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };    }          {

      }

      const png = await captureScreenshot(deviceId);  );            title: 'Start Observation for Package',

      const img = { type: 'image' as const, data: png.toString('base64'), mimeType: 'image/png' };

            description: 'Start observation filtered to a specific Android package (pid if available).',

      if (!includeLogs) {

        return { content: [img] };  server.registerTool(            inputSchema: {

      }

    'adb_list_devices',              package: z.string().optional(),

      const logs = logcatManager.getBuffer().slice(-maxLogLines).join('\n');

      return { content: [img, { type: 'text', text: logs || '(no recent logs)' }] };    {              priority: z.enum(['V', 'D', 'I', 'W', 'E', 'F']).optional().default('I')

    }

  );      title: 'List ADB Devices',            }



  // Tool: Toggle Expert Mode      description: 'List connected Android devices and emulators',          },

  server.registerTool(

    'toggle_expert_mode',      inputSchema: {}          async ({ package: pkg, priority = 'I' }) => {

    {

      title: 'Toggle Expert Mode',    },            const deviceId = await ADB.autoSelectDevice();

      description: 'Enable or disable expert mode. Expert mode adds human-like delays, auto-view after actions, and richer tools.',

      inputSchema: z.object({    async () => {            if (!deviceId) return { content: [{ type: 'text', text: 'No Android devices/emulators found.' }] };

        enabled: z.boolean().describe('Set true to enable expert mode; false to disable'),

        autoView: z.boolean().optional().describe('Override auto view-after-action behavior')      const devices = await ADB.listDevices();            const targetPkg = pkg || (await getForegroundApp(deviceId));

      })

    },      if (devices.length === 0) {            const pid = await getPidForPackage(deviceId, targetPkg);

    async ({ enabled, autoView }) => {

      expertMode = enabled;        return { content: [{ type: 'text', text: 'No devices/emulators connected.' }] };            const tags = ['ReactNativeJS', 'ReactNative', 'Expo', 'RN'];

      if (typeof autoView === 'boolean') autoViewAfterAction = autoView;

      return { content: [{ type: 'text', text: `Expert mode ${expertMode ? 'ENABLED' : 'DISABLED'} (autoView=${autoViewAfterAction})` }] };      }            await sessions.start(deviceId, { priority, tags, pid: pid || undefined });

    }

  );      const lines = devices.map((d) => `- ${d.id} (${d.state})`).join('\n');            return { content: [{ type: 'text', text: pid ? `Observation started for ${targetPkg} (pid ${pid})` : `Observation started for ${targetPkg} (pid unknown, tag-filtered)` }] };



  // Resource: ui-tree      return { content: [{ type: 'text', text: `Connected devices:\n${lines}` }] };          }

  server.registerResource(

    'ui-tree',    }        );

    'adb://ui-tree',

    {  );

      title: 'UI Hierarchy XML',

      description: 'Current UI hierarchy dump (uiautomator XML)',        server.registerTool(

      mimeType: 'application/xml'

    },  // Resources (static URIs)          'end_observation_session',

    async (uri) => {

      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());  server.registerResource(          {

      if (!deviceId) {

        return { contents: [{ uri: uri.href, mimeType: 'text/plain', text: 'No active device/emulator found.' }] };    'current-screen',            title: 'End Observation Session',

      }

      const xml = await dumpUiXml(deviceId);    'adb://current-screen',            description: 'Stop logcat streaming.',

      return { contents: [{ uri: uri.href, mimeType: 'application/xml', text: xml }] };

    }    {            inputSchema: {}

  );

      title: 'Live Emulator Screen',          },

  // Tool: Get UI Tree

  server.registerTool(      description: 'Capture a PNG screenshot of the current screen for the active device/emulator',          async () => {

    'get_ui_tree',

    {      mimeType: 'image/png'            const ended = await sessions.end();

      title: 'Get UI Tree',

      description: 'Return the current UI hierarchy XML and a parsed summary of elements helpful for selection.',    },            return { content: [{ type: 'text', text: ended ? 'Observation session ended.' : 'No active observation session.' }] };

      inputSchema: z.object({})

    },    async (uri) => {          }

    async () => {

      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());        );

      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

      if (!deviceId) {

      const xml = await dumpUiXml(deviceId);

      const els = extractElements(xml).slice(0, 200);        return {        server.registerTool(

      const summary = els.map((e, i) => `${i + 1}. text=${e.text || ''} contentDesc=${e.contentDesc || ''} id=${e.resourceId || ''} clickable=${e.clickable ? 'y' : 'n'} bounds=${e.bounds || ''}`).join('\n');

          contents: [{ uri: uri.href, mimeType: 'text/plain', text: 'No active device/emulator found.' }]          'adb_list_devices',

      return { content: [

        { type: 'text', text: summary || '(no elements parsed)' }        };          { title: 'List ADB Devices', description: 'List connected Android devices and emulators', inputSchema: {} },

      ] };

    }      }          async () => {

  );

      const png = await captureScreenshot(deviceId);            const devices = await ADB.listDevices();

  // Tool: Wait For Element

  server.registerTool(      const base64 = png.toString('base64');            if (!devices.length) return { content: [{ type: 'text', text: 'No devices/emulators connected.' }] };

    'wait_for_element',

    {      return {            const list = devices.map(d => `- ${d.id} (${d.state})`).join('\n');

      title: 'Wait For Element',

      description: 'Wait until a UI element matching the query appears (by text/content-desc/resource-id substring).',        contents: [            return { content: [{ type: 'text', text: `Connected devices:\n${list}` }] };

      inputSchema: z.object({

        query: z.string(),          { uri: uri.href, mimeType: 'image/png', blob: base64 }          }

        timeoutMs: z.number().int().optional().default(8000),

        preferClickable: z.boolean().optional().default(true)        ]        );

      })

    },      };

    async ({ query, timeoutMs = 8000, preferClickable = true }) => {

      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());    }        // Resources

      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

  );        server.registerResource(

      const start = Date.now();

      while (Date.now() - start < timeoutMs) {          'current-screen',

        const xml = await dumpUiXml(deviceId);

        const els = extractElements(xml);  server.registerResource(          'adb://current-screen',

        const hit = els.find(e => {

          const m = (    'logcat',          { title: 'Live Emulator Screen', description: 'PNG screenshot of current screen', mimeType: 'image/png' },

            e.text?.toLowerCase().includes(query.toLowerCase())

            || e.contentDesc?.toLowerCase().includes(query.toLowerCase())    'adb://logcat',          async (uri) => {

            || e.resourceId?.toLowerCase().includes(query.toLowerCase())

          );    {            const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());

          return m && (!preferClickable || e.clickable);

        }) || els.find(e => (      title: 'Logcat Snapshot',            if (!deviceId) return { contents: [{ uri: uri.href, mimeType: 'text/plain', text: 'No active device/emulator found.' }] };

          e.text?.toLowerCase().includes(query.toLowerCase())

          || e.contentDesc?.toLowerCase().includes(query.toLowerCase())      description: 'Recent logcat output (last 200 lines) for the active device/emulator',            const png = await captureScreenshot(deviceId);

          || e.resourceId?.toLowerCase().includes(query.toLowerCase())

        ));      mimeType: 'text/plain'            return { contents: [{ uri: uri.href, mimeType: 'image/png', blob: png.toString('base64') }] };

        if (hit) return { content: [{ type: 'text', text: `Element found: ${query}` }] };

        await new Promise(r => setTimeout(r, 300));    },          }

      }

      return { content: [{ type: 'text', text: `Timeout waiting for element: ${query}` }] };    async (uri) => {        );

    }

  );      const text = logcatManager.getBuffer().join('\n');



  // Tool: Tap by Percent      return { contents: [{ uri: uri.href, mimeType: 'text/plain', text }] };        server.registerResource(

  server.registerTool(

    'tap_percent',    }          'logcat',

    {

      title: 'Tap by Percent',  );          'adb://logcat',

      description: 'Tap using percentage coordinates (0..100 for x and y). Useful when element text is dynamic.',

      inputSchema: z.object({          { title: 'Logcat Snapshot', description: 'Recent logcat output', mimeType: 'text/plain' },

        xPct: z.number().min(0).max(100),

        yPct: z.number().min(0).max(100)  // Convenience: one-shot capture for LLM "eyes" (image + logs together)          async (uri) => {

      })

    },  server.registerTool(            const text = logcatManager.getBuffer().join('\n');

    async ({ xPct, yPct }) => {

      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());    'get_current_view',            return { contents: [{ uri: uri.href, mimeType: 'text/plain', text }] };

      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

    {          }

      const sz = await getScreenSize(deviceId);

      if (!sz) return { content: [{ type: 'text', text: 'Unable to determine screen size' }] };      title: 'Get Current View (Screenshot + Logs)',        );



      const x = Math.round((xPct / 100) * sz.width);      description: 'Captures a screenshot and returns it with the most recent logcat lines in a single result.',

      const y = Math.round((yPct / 100) * sz.height);

      inputSchema: {        server.registerResource(

      await new Promise(r => setTimeout(r, humanDelayMs()));

      await ADB.spawn(['shell', 'input', 'tap', String(x), String(y)], { deviceId });        includeLogs: z.boolean().optional().default(true),          'ui-tree',



      if (expertMode && autoViewAfterAction) {        maxLogLines: z.number().int().optional().default(120)          'adb://ui-tree',

        const png = await captureScreenshot(deviceId);

        return { content: [      }          { title: 'UI Hierarchy XML', description: 'Current uiautomator XML dump', mimeType: 'application/xml' },

          { type: 'text', text: `Tapped at ${xPct}%,${yPct}% -> ${x},${y}` },

          { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }    },          async (uri) => {

        ] };

      }    async ({ includeLogs = true, maxLogLines = 120 }) => {            const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());

      return { content: [{ type: 'text', text: `Tapped at ${xPct}%,${yPct}% -> ${x},${y}` }] };

    }      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());            if (!deviceId) return { contents: [{ uri: uri.href, mimeType: 'text/plain', text: 'No active device/emulator found.' }] };

  );

      if (!deviceId) {            const xml = await dumpUiXml(deviceId);

  // Tool: Swipe by Percent

  server.registerTool(        return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };            return { contents: [{ uri: uri.href, mimeType: 'application/xml', text: xml }] };

    'swipe_percent',

    {      }          }

      title: 'Swipe by Percent',

      description: 'Swipe using percentage coordinates (0..100 for x/y start and end). Useful for scrolling or gesture navigation.',      const png = await captureScreenshot(deviceId);        );

      inputSchema: z.object({

        xPct: z.number().min(0).max(100),      const img = { type: 'image' as const, data: png.toString('base64'), mimeType: 'image/png' };

        yPct: z.number().min(0).max(100),

        x2Pct: z.number().min(0).max(100),        // Eyes

        y2Pct: z.number().min(0).max(100),

        durationMs: z.number().int().optional().describe('Optional swipe duration in ms')      if (!includeLogs) {        server.registerTool(

      })

    },        return { content: [img] };          'get_current_view',

    async ({ xPct, yPct, x2Pct, y2Pct, durationMs }) => {

      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());      }          { title: 'Get Current View (Screenshot + Logs)', description: 'Return screenshot and recent logs', inputSchema: { includeLogs: z.boolean().optional().default(true), maxLogLines: z.number().int().optional().default(120) } },

      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

          async ({ includeLogs = true, maxLogLines = 120 }) => {

      const sz = await getScreenSize(deviceId);

      if (!sz) return { content: [{ type: 'text', text: 'Unable to determine screen size' }] };      const logs = logcatManager.getBuffer().slice(-maxLogLines).join('\n');            const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());



      const x = Math.round((xPct / 100) * sz.width);      return { content: [img, { type: 'text', text: logs || '(no recent logs)' }] };            if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

      const y = Math.round((yPct / 100) * sz.height);

      const x2 = Math.round((x2Pct / 100) * sz.width);    }            const png = await captureScreenshot(deviceId);

      const y2 = Math.round((y2Pct / 100) * sz.height);

  );            const img = { type: 'image', data: png.toString('base64'), mimeType: 'image/png' } as const;

      const args = ['shell', 'input', 'swipe', String(x), String(y), String(x2), String(y2)];

      if (typeof durationMs === 'number') args.push(String(durationMs));            if (!includeLogs) return { content: [img] };



      await new Promise(r => setTimeout(r, humanDelayMs()));  // Expert mode controls            const logs = logcatManager.getBuffer().slice(-maxLogLines).join('\n');

      await ADB.spawn(args, { deviceId });

  server.registerTool(            return { content: [img, { type: 'text', text: logs || '(no recent logs)' }] };

      if (expertMode && autoViewAfterAction) {

        const png = await captureScreenshot(deviceId);    'toggle_expert_mode',          }

        return { content: [

          { type: 'text', text: `Swiped ${xPct}%,${yPct}% -> ${x2Pct}%,${y2Pct}% (${x},${y} to ${x2},${y2})` },    {        );

          { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }

        ] };      title: 'Toggle Expert Mode',

      }

      return { content: [{ type: 'text', text: `Swiped ${xPct}%,${yPct}% -> ${x2Pct}%,${y2Pct}% (${x},${y} to ${x2},${y2})` }] };      description: 'Enable or disable expert mode. Expert mode adds human-like delays, auto-view after actions, and richer tools.',        // Expert mode

    }

  );      inputSchema: {        server.registerTool(



  // Tool: Dismiss Keyboard        enabled: z.boolean().describe('Set true to enable expert mode; false to disable'),          'toggle_expert_mode',

  server.registerTool(

    'dismiss_keyboard',        autoView: z.boolean().optional().describe('Override auto view-after-action behavior')          { title: 'Toggle Expert Mode', description: 'Enable human-like delays and auto-view after actions', inputSchema: { enabled: z.boolean(), autoView: z.boolean().optional() } },

    {

      title: 'Dismiss Keyboard',      }          async ({ enabled, autoView }) => {

      description: 'Attempts to dismiss the soft keyboard using BACK keyevent.',

      inputSchema: z.object({})    },            expertMode = enabled; if (typeof autoView === 'boolean') autoViewAfterAction = autoView;

    },

    async () => {    async ({ enabled, autoView }) => {            return { content: [{ type: 'text', text: `Expert mode ${enabled ? 'ENABLED' : 'DISABLED'} (autoView=${autoViewAfterAction})` }] };

      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());

      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };      expertMode = enabled;          }



      await new Promise(r => setTimeout(r, humanDelayMs()));      if (typeof autoView === 'boolean') autoViewAfterAction = autoView;        );

      await ADB.spawn(['shell', 'input', 'keyevent', 'BACK'], { deviceId });

      return { content: [{ type: 'text', text: `Expert mode ${expertMode ? 'ENABLED' : 'DISABLED'} (autoView=${autoViewAfterAction})` }] };

      if (expertMode && autoViewAfterAction) {

        const png = await captureScreenshot(deviceId);    }        // UI helpers

        return { content: [

          { type: 'text', text: 'Dismissed keyboard (BACK)' },  );        server.registerTool(

          { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }

        ] };          'get_ui_tree',

      }

      return { content: [{ type: 'text', text: 'Dismissed keyboard (BACK)' }] };  // UI tree as a resource and tool for richer selection          { title: 'Get UI Tree', description: 'Parse UI dump and return summary', inputSchema: {} },

    }

  );  server.registerResource(          async () => {



  // Tool: ADB Input    'ui-tree',            const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());

  server.registerTool(

    'adb_input',    'adb://ui-tree',            if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

    {

      title: 'ADB Input (tap/swipe/key/text)',    {            const xml = await dumpUiXml(deviceId);

      description: 'Simulate basic input on the device: tap, swipe, keyevent, or text.',

      inputSchema: z.object({      title: 'UI Hierarchy XML',            const els = extractElements(xml).slice(0, 200);

        action: z.enum(['tap', 'swipe', 'keyevent', 'text']),

        x: z.number().optional(),      description: 'Current UI hierarchy dump (uiautomator XML)',            const summary = els.map((e, i) => `${i + 1}. text=${e.text || ''} contentDesc=${e.contentDesc || ''} id=${e.resourceId || ''} clickable=${e.clickable ? 'y' : 'n'} bounds=${e.bounds || ''}`).join('\n');

        y: z.number().optional(),

        x2: z.number().optional(),      mimeType: 'application/xml'            return { content: [{ type: 'text', text: summary || '(no elements parsed)' }] };

        y2: z.number().optional(),

        keycode: z.string().optional(),    },          }

        text: z.string().optional()

      })    async (uri) => {        );

    },

    async ({ action, x, y, x2, y2, keycode, text }) => {      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());

      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());

      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };      if (!deviceId) {        server.registerTool(



      const args = ['shell', 'input'];        return { contents: [{ uri: uri.href, mimeType: 'text/plain', text: 'No active device/emulator found.' }] };          'wait_for_element',

      switch (action) {

        case 'tap':      }          { title: 'Wait For Element', description: 'Wait until an element containing query appears', inputSchema: { query: z.string(), timeoutMs: z.number().int().optional().default(8000), preferClickable: z.boolean().optional().default(true) } },

          if (typeof x !== 'number' || typeof y !== 'number') return { content: [{ type: 'text', text: 'tap requires x and y' }] };

          args.push('tap', String(x), String(y));      const xml = await dumpUiXml(deviceId);          async ({ query, timeoutMs = 8000, preferClickable = true }) => {

          break;

        case 'swipe':      return { contents: [{ uri: uri.href, mimeType: 'application/xml', text: xml }] };            const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());

          if ([x, y, x2, y2].some(v => typeof v !== 'number')) return { content: [{ type: 'text', text: 'swipe requires x,y,x2,y2' }] };

          args.push('swipe', String(x), String(y), String(x2!), String(y2!));    }            if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

          break;

        case 'keyevent':  );            const start = Date.now();

          if (!keycode) return { content: [{ type: 'text', text: 'keyevent requires keycode (e.g., ENTER, BACK)' }] };

          args.push('keyevent', keycode);            while (Date.now() - start < timeoutMs) {

          break;

        case 'text':  server.registerTool(              const xml = await dumpUiXml(deviceId);

          if (!text) return { content: [{ type: 'text', text: 'text requires a value' }] };

          args.push('text', `'${text.replace(/'/g, "'\\''")}'`);    'get_ui_tree',              const els = extractElements(xml);

          break;

      }    {              const hit = els.find(e => {



      await new Promise(r => setTimeout(r, humanDelayMs()));      title: 'Get UI Tree',                const m = (e.text?.toLowerCase().includes(query.toLowerCase()) || e.contentDesc?.toLowerCase().includes(query.toLowerCase()) || e.resourceId?.toLowerCase().includes(query.toLowerCase()));

      await ADB.spawn(args, { deviceId });

      description: 'Return the current UI hierarchy XML and a parsed summary of elements helpful for selection.',                return m && (!preferClickable || e.clickable);

      if (expertMode && autoViewAfterAction) {

        const png = await captureScreenshot(deviceId);      inputSchema: {}              }) || els.find(e => (e.text?.toLowerCase().includes(query.toLowerCase()) || e.contentDesc?.toLowerCase().includes(query.toLowerCase()) || e.resourceId?.toLowerCase().includes(query.toLowerCase())));

        return { content: [

          { type: 'text', text: `Sent ${action}` },    },              if (hit) return { content: [{ type: 'text', text: `Element found: ${query}` }] };

          { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }

        ] };    async () => {              await new Promise(r => setTimeout(r, 300));

      }

      return { content: [{ type: 'text', text: `Sent ${action}` }] };      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());            }

    }

  );      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };            return { content: [{ type: 'text', text: `Timeout waiting for element: ${query}` }] };



  // Tool: Foreground App          }

  server.registerTool(

    'foreground_app',      const xml = await dumpUiXml(deviceId);        );

    {

      title: 'Get Foreground App Package',      const els = extractElements(xml).slice(0, 200); // cap to avoid huge payloads

      description: 'Returns the package name of the current foreground app.',

      inputSchema: z.object({})      const summary = els.map((e, i) => `${i + 1}. text=${e.text || ''} contentDesc=${e.contentDesc || ''} id=${e.resourceId || ''} clickable=${e.clickable ? 'y' : 'n'} bounds=${e.bounds || ''}`).join('\n');        server.registerTool(

    },

    async () => {          'tap_percent',

      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());

      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };      return { content: [          { title: 'Tap by Percent', description: 'Tap using percentage coordinates', inputSchema: { xPct: z.number().min(0).max(100), yPct: z.number().min(0).max(100) } },



      const pkg = await getForegroundApp(deviceId);        { type: 'text', text: summary || '(no elements parsed)' }          async ({ xPct, yPct }) => {

      return { content: [{ type: 'text', text: pkg }] };

    }      ] };            const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());

  );

    }            if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

  // Tool: Tap by Query

  server.registerTool(  );            const sz = await getScreenSize(deviceId); if (!sz) return { content: [{ type: 'text', text: 'Unable to determine screen size' }] };

    'tap_by_query',

    {            const x = Math.round((xPct / 100) * sz.width); const y = Math.round((yPct / 100) * sz.height);

      title: 'Tap by Query',

      description: 'Finds the first matching UI element (by text, content-desc, or resource-id substring) and taps its center.',  // Wait until an element appears (by query), with timeout            await new Promise(r => setTimeout(r, humanDelayMs()));

      inputSchema: z.object({

        query: z.string().describe('Substring to match against text, content-desc, or resource-id'),  server.registerTool(            await ADB.spawn(['shell', 'input', 'tap', String(x), String(y)], { deviceId });

        preferClickable: z.boolean().optional().default(true)

      })    'wait_for_element',            if (expertMode && autoViewAfterAction) { const png = await captureScreenshot(deviceId); return { content: [{ type: 'text', text: `Tapped at ${xPct}%,${yPct}% -> ${x},${y}` }, { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }] }; }

    },

    async ({ query, preferClickable = true }) => {    {            return { content: [{ type: 'text', text: `Tapped at ${xPct}%,${yPct}% -> ${x},${y}` }] };

      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());

      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };      title: 'Wait For Element',          }



      const xml = await dumpUiXml(deviceId);      description: 'Wait until a UI element matching the query appears (by text/content-desc/resource-id substring).',        );

      const els = extractElements(xml);

      const cand = els.find(e => {      inputSchema: {

        const hit = (

          e.text?.toLowerCase().includes(query.toLowerCase())        query: z.string(),        server.registerTool(

          || e.contentDesc?.toLowerCase().includes(query.toLowerCase())

          || e.resourceId?.toLowerCase().includes(query.toLowerCase())        timeoutMs: z.number().int().optional().default(8000),          'dismiss_keyboard',

        );

        return hit && (!preferClickable || e.clickable);        preferClickable: z.boolean().optional().default(true)          { title: 'Dismiss Keyboard', description: 'Send BACK to hide soft keyboard', inputSchema: {} },

      }) || els.find(e => (

        e.text?.toLowerCase().includes(query.toLowerCase())      }          async () => {

        || e.contentDesc?.toLowerCase().includes(query.toLowerCase())

        || e.resourceId?.toLowerCase().includes(query.toLowerCase())    },            const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());

      ));

      if (!cand) return { content: [{ type: 'text', text: `No element matching "${query}"` }] };    async ({ query, timeoutMs = 8000, preferClickable = true }) => {            if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };



      const b = parseBounds(cand.bounds);      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());            await new Promise(r => setTimeout(r, humanDelayMs()));

      if (!b) return { content: [{ type: 'text', text: `Element found but bounds unavailable` }] };

      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };            await ADB.spawn(['shell', 'input', 'keyevent', 'BACK'], { deviceId });

      await new Promise(r => setTimeout(r, humanDelayMs()));

      await ADB.spawn(['shell', 'input', 'tap', String(b.cx), String(b.cy)], { deviceId });            if (expertMode && autoViewAfterAction) { const png = await captureScreenshot(deviceId); return { content: [{ type: 'text', text: 'Sent BACK to dismiss keyboard' }, { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }] }; }



      if (expertMode && autoViewAfterAction) {      const start = Date.now();            return { content: [{ type: 'text', text: 'Sent BACK to dismiss keyboard' }] };

        const png = await captureScreenshot(deviceId);

        return { content: [      while (Date.now() - start < timeoutMs) {          }

          { type: 'text', text: `Tapped ${query} at ${b.cx},${b.cy}` },

          { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }        const xml = await dumpUiXml(deviceId);        );

        ] };

      }        const els = extractElements(xml);

      return { content: [{ type: 'text', text: `Tapped ${query} at ${b.cx},${b.cy}` }] };

    }        const hit = els.find(e => {        server.registerTool(

  );

          const m = (          'swipe_percent',

  // Tool: Type Text

  server.registerTool(            e.text?.toLowerCase().includes(query.toLowerCase())          { title: 'Swipe by Percent', description: 'Swipe from one percentage coordinate to another', inputSchema: { x1Pct: z.number().min(0).max(100), y1Pct: z.number().min(0).max(100), x2Pct: z.number().min(0).max(100), y2Pct: z.number().min(0).max(100), durationMs: z.number().int().optional().default(300) } },

    'type_text',

    {            || e.contentDesc?.toLowerCase().includes(query.toLowerCase())          async ({ x1Pct, y1Pct, x2Pct, y2Pct, durationMs = 300 }) => {

      title: 'Type Text',

      description: 'Types text into the currently focused input field.',            || e.resourceId?.toLowerCase().includes(query.toLowerCase())            const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());

      inputSchema: z.object({

        value: z.string().describe('The text to input')          );            if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

      })

    },          return m && (!preferClickable || e.clickable);            const sz = await getScreenSize(deviceId); if (!sz) return { content: [{ type: 'text', text: 'Unable to determine screen size' }] };

    async ({ value }) => {

      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());        }) || els.find(e => (            const x1 = Math.round((x1Pct / 100) * sz.width); const y1 = Math.round((y1Pct / 100) * sz.height);

      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

          e.text?.toLowerCase().includes(query.toLowerCase())            const x2 = Math.round((x2Pct / 100) * sz.width); const y2 = Math.round((y2Pct / 100) * sz.height);

      const safe = `'${value.replace(/'/g, "'\\''")}'`;

      await new Promise(r => setTimeout(r, humanDelayMs()));          || e.contentDesc?.toLowerCase().includes(query.toLowerCase())            await new Promise(r => setTimeout(r, humanDelayMs()));

      await ADB.spawn(['shell', 'input', 'text', safe], { deviceId });

          || e.resourceId?.toLowerCase().includes(query.toLowerCase())            await ADB.spawn(['shell', 'input', 'swipe', String(x1), String(y1), String(x2), String(y2), String(durationMs)], { deviceId });

      if (expertMode && autoViewAfterAction) {

        const png = await captureScreenshot(deviceId);        ));            if (expertMode && autoViewAfterAction) { const png = await captureScreenshot(deviceId); return { content: [{ type: 'text', text: `Swiped ${x1Pct}%,${y1Pct}% -> ${x2Pct}%,${y2Pct}% (${x1},${y1} -> ${x2},${y2})` }, { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }] }; }

        return { content: [

          { type: 'text', text: `Typed text (${value.length} chars)` },        if (hit) return { content: [{ type: 'text', text: `Element found: ${query}` }] };            return { content: [{ type: 'text', text: `Swiped ${x1Pct}%,${y1Pct}% -> ${x2Pct}%,${y2Pct}% (${x1},${y1} -> ${x2},${y2})` }] };

          { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }

        ] };        await new Promise(r => setTimeout(r, 300));          }

      }

      return { content: [{ type: 'text', text: `Typed text (${value.length} chars)` }] };      }        );

    }

  );      return { content: [{ type: 'text', text: `Timeout waiting for element: ${query}` }] };



  // Tool: Act and View    }        server.registerTool(

  server.registerTool(

    'act_and_view',  );          'foreground_app',

    {

      title: 'Act and View',          { title: 'Get Foreground App Package', description: 'Returns the current foreground package', inputSchema: {} },

      description: 'Execute a sequence of actions (tap_by_query, type_text, adb_input, tap_percent, swipe_percent, dismiss_keyboard, wait_for_element) and return a final screenshot and logs. Actions are executed in order.',

      inputSchema: z.object({  // Percent-based tap to avoid resolution differences          async () => {

        actions: z.array(

          z.discriminatedUnion('tool', [  server.registerTool(            const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());

            z.object({

              tool: z.literal('tap_by_query'),    'tap_percent',            if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

              args: z.object({

                query: z.string().describe('Substring to match against text, content-desc, or resource-id'),    {            const pkg = await getForegroundApp(deviceId);

                preferClickable: z.boolean().optional().default(true)

              })      title: 'Tap by Percent',            return { content: [{ type: 'text', text: pkg }] };

            }),

            z.object({      description: 'Tap using percentage coordinates (0..100 for x and y). Useful when element text is dynamic.',          }

              tool: z.literal('type_text'),

              args: z.object({      inputSchema: {        );

                value: z.string().describe('The text to input')

              })        xPct: z.number().min(0).max(100),

            }),

            z.object({        yPct: z.number().min(0).max(100)        server.registerTool(

              tool: z.literal('adb_input'),

              args: z.object({      }          'tap_by_query',

                action: z.enum(['tap', 'swipe', 'keyevent', 'text']),

                x: z.number().optional(),    },          { title: 'Tap by Query', description: 'Find element by text/content-desc/resource-id substring and tap center', inputSchema: { query: z.string(), preferClickable: z.boolean().optional().default(true) } },

                y: z.number().optional(),

                x2: z.number().optional(),    async ({ xPct, yPct }) => {          async ({ query, preferClickable = true }) => {

                y2: z.number().optional(),

                keycode: z.string().optional(),      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());            const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());

                text: z.string().optional()

              })      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };            if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

            }),

            z.object({            const xml = await dumpUiXml(deviceId); const els = extractElements(xml);

              tool: z.literal('tap_percent'),

              args: z.object({      const sz = await getScreenSize(deviceId);            const cand = els.find(e => { const hit = (e.text?.toLowerCase().includes(query.toLowerCase()) || e.contentDesc?.toLowerCase().includes(query.toLowerCase()) || e.resourceId?.toLowerCase().includes(query.toLowerCase())); return hit && (!preferClickable || e.clickable); }) || els.find(e => (e.text?.toLowerCase().includes(query.toLowerCase()) || e.contentDesc?.toLowerCase().includes(query.toLowerCase()) || e.resourceId?.toLowerCase().includes(query.toLowerCase())));

                xPct: z.number().min(0).max(100),

                yPct: z.number().min(0).max(100)      if (!sz) return { content: [{ type: 'text', text: 'Unable to determine screen size' }] };            if (!cand) return { content: [{ type: 'text', text: `No element matching "${query}"` }] };

              })

            }),            const b = parseBounds(cand.bounds); if (!b) return { content: [{ type: 'text', text: 'Element found but bounds unavailable' }] };

            z.object({

              tool: z.literal('swipe_percent'),      const x = Math.round((xPct / 100) * sz.width);            await new Promise(r => setTimeout(r, humanDelayMs()));

              args: z.object({

                xPct: z.number().min(0).max(100),      const y = Math.round((yPct / 100) * sz.height);            await ADB.spawn(['shell', 'input', 'tap', String(b.cx), String(b.cy)], { deviceId });

                yPct: z.number().min(0).max(100),

                x2Pct: z.number().min(0).max(100),            if (expertMode && autoViewAfterAction) { const png = await captureScreenshot(deviceId); return { content: [{ type: 'text', text: `Tapped ${query} at ${b.cx},${b.cy}` }, { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }] }; }

                y2Pct: z.number().min(0).max(100),

                durationMs: z.number().int().optional()      await new Promise(r => setTimeout(r, humanDelayMs()));            return { content: [{ type: 'text', text: `Tapped ${query} at ${b.cx},${b.cy}` }] };

              })

            }),      await ADB.spawn(['shell', 'input', 'tap', String(x), String(y)], { deviceId });          }

            z.object({

              tool: z.literal('dismiss_keyboard'),        );

              args: z.object({}).optional()

            }),      if (expertMode && autoViewAfterAction) {

            z.object({

              tool: z.literal('wait_for_element'),        const png = await captureScreenshot(deviceId);        server.registerTool(

              args: z.object({

                query: z.string(),        return { content: [          'type_text',

                timeoutMs: z.number().int().optional().default(8000),

                preferClickable: z.boolean().optional().default(true)          { type: 'text', text: `Tapped at ${xPct}%,${yPct}% -> ${x},${y}` },          { title: 'Type Text', description: 'Type into the focused input', inputSchema: { value: z.string() } },

              })

            })          { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }          async ({ value }) => {

          ])

        ),        ] };            const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());

        includeLogs: z.boolean().optional().default(true),

        maxLogLines: z.number().int().optional().default(120)      }            if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

      })

    },      return { content: [{ type: 'text', text: `Tapped at ${xPct}%,${yPct}% -> ${x},${y}` }] };            const safe = `'${value.replace(/'/g, "'\\''")}'`;

    async ({ actions, includeLogs = true, maxLogLines = 120 }) => {

      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());    }            await new Promise(r => setTimeout(r, humanDelayMs()));

      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

  );            await ADB.spawn(['shell', 'input', 'text', safe], { deviceId });

      const results: string[] = [];

            if (expertMode && autoViewAfterAction) { const png = await captureScreenshot(deviceId); return { content: [{ type: 'text', text: `Typed text (${value.length} chars)` }, { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }] }; }

      for (const step of actions) {

        try {  // Percent-based swipe for robust scrolling/navigation            return { content: [{ type: 'text', text: `Typed text (${value.length} chars)` }] };

          await new Promise(r => setTimeout(r, humanDelayMs()));

  server.registerTool(          }

          switch (step.tool) {

            case 'tap_by_query': {    'swipe_percent',        );

              const { query, preferClickable } = step.args || {};

              const xml = await dumpUiXml(deviceId);    {

              const els = extractElements(xml);

              const cand = els.find(e => {      title: 'Swipe by Percent',        // Macro: act-and-view

                const hit = (

                  e.text?.toLowerCase().includes(query.toLowerCase())      description: 'Swipe using percentage coordinates (0..100 for x/y start and end). Useful for scrolling or gesture navigation.',        server.registerTool(

                  || e.contentDesc?.toLowerCase().includes(query.toLowerCase())

                  || e.resourceId?.toLowerCase().includes(query.toLowerCase())      inputSchema: {          'act_and_view',

                );

                return hit && ((preferClickable ?? true) ? e.clickable : true);        xPct: z.number().min(0).max(100),          {

              }) || els.find(e => (

                e.text?.toLowerCase().includes(query.toLowerCase())        yPct: z.number().min(0).max(100),            title: 'Act and View',

                || e.contentDesc?.toLowerCase().includes(query.toLowerCase())

                || e.resourceId?.toLowerCase().includes(query.toLowerCase())        x2Pct: z.number().min(0).max(100),            description: 'Execute a sequence of actions and return a final screenshot and logs. Optionally capture a view after each step.',

              ));

              if (!cand) {        y2Pct: z.number().min(0).max(100),            inputSchema: {

                results.push(`tap_by_query: no match for ${query}`);

                break;        durationMs: z.number().int().optional().describe('Optional swipe duration in ms')              actions: z.array(z.discriminatedUnion('tool', [

              }

              const b = parseBounds(cand.bounds);      }                z.object({ tool: z.literal('tap_by_query'), args: z.object({ query: z.string(), preferClickable: z.boolean().optional().default(true) }) }),

              if (!b) {

                results.push(`tap_by_query: bounds missing for ${query}`);    },                z.object({ tool: z.literal('type_text'), args: z.object({ value: z.string() }) }),

                break;

              }    async ({ xPct, yPct, x2Pct, y2Pct, durationMs }) => {                z.object({ tool: z.literal('adb_input'), args: z.object({ action: z.enum(['tap','swipe','keyevent','text']), x: z.number().optional(), y: z.number().optional(), x2: z.number().optional(), y2: z.number().optional(), keycode: z.string().optional(), text: z.string().optional() }) }),

              await ADB.spawn(['shell', 'input', 'tap', String(b.cx), String(b.cy)], { deviceId });

              results.push(`tap_by_query: tapped ${query} at ${b.cx},${b.cy}`);      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());                z.object({ tool: z.literal('tap_percent'), args: z.object({ xPct: z.number().min(0).max(100), yPct: z.number().min(0).max(100) }) }),

              break;

            }      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };                z.object({ tool: z.literal('wait_for_element'), args: z.object({ query: z.string(), timeoutMs: z.number().int().optional().default(8000), preferClickable: z.boolean().optional().default(true) }) }),



            case 'type_text': {                z.object({ tool: z.literal('dismiss_keyboard'), args: z.object({}).optional() }),

              const { value } = step.args || {};

              const safe = `'${String(value ?? '').replace(/'/g, "'\\''")}'`;      const sz = await getScreenSize(deviceId);                z.object({ tool: z.literal('swipe_percent'), args: z.object({ x1Pct: z.number().min(0).max(100), y1Pct: z.number().min(0).max(100), x2Pct: z.number().min(0).max(100), y2Pct: z.number().min(0).max(100), durationMs: z.number().int().optional().default(300) }) }),

              await ADB.spawn(['shell', 'input', 'text', safe], { deviceId });

              results.push(`type_text: typed (${String(value ?? '').length} chars)`);      if (!sz) return { content: [{ type: 'text', text: 'Unable to determine screen size' }] };              ])),

              break;

            }              includeLogs: z.boolean().optional().default(true),



            case 'adb_input': {      const x = Math.round((xPct / 100) * sz.width);              maxLogLines: z.number().int().optional().default(120),

              const { action, x, y, x2, y2, keycode, text } = step.args || {};

              const args = ['shell', 'input'];      const y = Math.round((yPct / 100) * sz.height);              viewEveryStep: z.boolean().optional().default(false)

              if (action === 'tap') args.push('tap', String(x), String(y));

              else if (action === 'swipe') args.push('swipe', String(x), String(y), String(x2), String(y2));      const x2 = Math.round((x2Pct / 100) * sz.width);            }

              else if (action === 'keyevent') args.push('keyevent', String(keycode));

              else if (action === 'text') args.push('text', `'${String(text ?? '').replace(/'/g, "'\\''")}'`);      const y2 = Math.round((y2Pct / 100) * sz.height);          },

              else {

                results.push(`adb_input: unsupported action ${action}`);          async ({ actions, includeLogs = true, maxLogLines = 120, viewEveryStep = false }) => {

                break;

              }      const args = ['shell', 'input', 'swipe', String(x), String(y), String(x2), String(y2)];            const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());

              await ADB.spawn(args, { deviceId });

              results.push(`adb_input: ${action}`);      if (typeof durationMs === 'number') args.push(String(durationMs));            if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

              break;

            }            const results: string[] = [];



            case 'tap_percent': {      await new Promise(r => setTimeout(r, humanDelayMs()));            const stepImages: string[] = [];

              const { xPct, yPct } = step.args || {};

              const sz = await getScreenSize(deviceId);      await ADB.spawn(args, { deviceId });            for (const step of actions) {

              if (!sz) {

                results.push('tap_percent: unknown screen size');              try {

                break;

              }      if (expertMode && autoViewAfterAction) {                await new Promise(r => setTimeout(r, humanDelayMs()));

              const x = Math.round((Number(xPct) / 100) * sz.width);

              const y = Math.round((Number(yPct) / 100) * sz.height);        const png = await captureScreenshot(deviceId);                switch (step.tool) {

              await ADB.spawn(['shell', 'input', 'tap', String(x), String(y)], { deviceId });

              results.push(`tap_percent: tapped ${xPct}%,${yPct}% -> ${x},${y}`);        return { content: [                  case 'tap_by_query': {

              break;

            }          { type: 'text', text: `Swiped ${xPct}%,${yPct}% -> ${x2Pct}%,${y2Pct}% (${x},${y} to ${x2},${y2})` },                    const { query, preferClickable } = step.args || {};



            case 'swipe_percent': {          { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }                    const xml = await dumpUiXml(deviceId); const els = extractElements(xml);

              const { xPct, yPct, x2Pct, y2Pct, durationMs } = step.args || {};

              const sz = await getScreenSize(deviceId);        ] };                    const cand = els.find(e => { const hit = (e.text?.toLowerCase().includes(query.toLowerCase()) || e.contentDesc?.toLowerCase().includes(query.toLowerCase()) || e.resourceId?.toLowerCase().includes(query.toLowerCase())); return hit && ((preferClickable ?? true) ? e.clickable : true); }) || els.find(e => (e.text?.toLowerCase().includes(query.toLowerCase()) || e.contentDesc?.toLowerCase().includes(query.toLowerCase()) || e.resourceId?.toLowerCase().includes(query.toLowerCase())));

              if (!sz) {

                results.push('swipe_percent: unknown screen size');      }                    if (!cand) { results.push(`tap_by_query: no match for ${query}`); break; }

                break;

              }      return { content: [{ type: 'text', text: `Swiped ${xPct}%,${yPct}% -> ${x2Pct}%,${y2Pct}% (${x},${y} to ${x2},${y2})` }] };                    const b = parseBounds(cand.bounds); if (!b) { results.push(`tap_by_query: bounds missing for ${query}`); break; }

              const x = Math.round((Number(xPct) / 100) * sz.width);

              const y = Math.round((Number(yPct) / 100) * sz.height);    }                    await ADB.spawn(['shell', 'input', 'tap', String(b.cx), String(b.cy)], { deviceId });

              const x2 = Math.round((Number(x2Pct) / 100) * sz.width);

              const y2 = Math.round((Number(y2Pct) / 100) * sz.height);  );                    results.push(`tap_by_query: tapped ${query} at ${b.cx},${b.cy}`);

              const args = ['shell', 'input', 'swipe', String(x), String(y), String(x2), String(y2)];

              if (typeof durationMs === 'number') args.push(String(durationMs));                    break;

              await ADB.spawn(args, { deviceId });

              results.push(`swipe_percent: swiped ${xPct}%,${yPct}% -> ${x2Pct}%,${y2Pct}%`);  // Dismiss the soft keyboard with a BACK keyevent (common recovery)                  }

              break;

            }  server.registerTool(                  case 'type_text': {



            case 'dismiss_keyboard': {    'dismiss_keyboard',                    const { value } = step.args || {}; const safe = `'${String(value ?? '').replace(/'/g, "'\\''")}'`;

              await ADB.spawn(['shell', 'input', 'keyevent', 'BACK'], { deviceId });

              results.push('dismiss_keyboard: sent BACK');    {                    await ADB.spawn(['shell', 'input', 'text', safe], { deviceId });

              break;

            }      title: 'Dismiss Keyboard',                    results.push(`type_text: typed (${String(value ?? '').length} chars)`);



            case 'wait_for_element': {      description: 'Attempts to dismiss the soft keyboard using BACK keyevent.',                    break;

              const { query, timeoutMs, preferClickable } = step.args || {};

              const start = Date.now();      inputSchema: {}                  }

              let found = false;

              while (Date.now() - start < (timeoutMs ?? 8000)) {    },                  case 'adb_input': {

                const xml = await dumpUiXml(deviceId);

                const els = extractElements(xml);    async () => {                    const { action, x, y, x2, y2, keycode, text } = step.args || {};

                const hit = els.find(e => {

                  const m = (      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());                    const args: string[] = ['shell', 'input'];

                    e.text?.toLowerCase().includes(String(query).toLowerCase())

                    || e.contentDesc?.toLowerCase().includes(String(query).toLowerCase())      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };                    if (action === 'tap') args.push('tap', String(x), String(y));

                    || e.resourceId?.toLowerCase().includes(String(query).toLowerCase())

                  );                    else if (action === 'swipe') args.push('swipe', String(x), String(y), String(x2), String(y2));

                  return m && ((preferClickable ?? true) ? e.clickable : true);

                }) || els.find(e => (      await new Promise(r => setTimeout(r, humanDelayMs()));                    else if (action === 'keyevent') args.push('keyevent', String(keycode));

                  e.text?.toLowerCase().includes(String(query).toLowerCase())

                  || e.contentDesc?.toLowerCase().includes(String(query).toLowerCase())      await ADB.spawn(['shell', 'input', 'keyevent', 'BACK'], { deviceId });                    else if (action === 'text') args.push('text', `'${String(text ?? '').replace(/'/g, "'\\''")}'`);

                  || e.resourceId?.toLowerCase().includes(String(query).toLowerCase())

                ));                    else { results.push(`adb_input: unsupported action ${action}`); break; }

                if (hit) {

                  found = true;      if (expertMode && autoViewAfterAction) {                    await ADB.spawn(args, { deviceId }); results.push(`adb_input: ${action}`); break;

                  break;

                }        const png = await captureScreenshot(deviceId);                  }

                await new Promise(r => setTimeout(r, 300));

              }        return { content: [                  case 'tap_percent': {

              results.push(found ? `wait_for_element: found ${query}` : `wait_for_element: timeout ${query}`);

              break;          { type: 'text', text: 'Dismissed keyboard (BACK)' },                    const { xPct, yPct } = step.args || {}; const sz = await getScreenSize(deviceId); if (!sz) { results.push('tap_percent: unknown screen size'); break; }

            }

          }          { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }                    const x = Math.round((Number(xPct) / 100) * sz.width); const y = Math.round((Number(yPct) / 100) * sz.height);

        } catch (e: any) {

          results.push(`error: ${step.tool}: ${e?.message || e}`);        ] };                    await ADB.spawn(['shell', 'input', 'tap', String(x), String(y)], { deviceId }); results.push(`tap_percent: tapped ${xPct}%,${yPct}% -> ${x},${y}`); break;

        }

      }      }                  }



      const png = await captureScreenshot(deviceId);      return { content: [{ type: 'text', text: 'Dismissed keyboard (BACK)' }] };                  case 'wait_for_element': {

      if (!includeLogs) {

        return { content: [    }                    const { query, timeoutMs, preferClickable } = step.args || {}; const start = Date.now(); let found = false;

          { type: 'text', text: results.join('\n') },

          { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }  );                    while (Date.now() - start < (timeoutMs ?? 8000)) {

        ] };

      }                      const xml = await dumpUiXml(deviceId); const els = extractElements(xml);



      const logs = logcatManager.getBuffer().slice(-maxLogLines).join('\n');  // Minimal interaction helpers so the LLM can proceed step-by-step when stuck                      const hit = els.find(e => { const m = (e.text?.toLowerCase().includes(String(query).toLowerCase()) || e.contentDesc?.toLowerCase().includes(String(query).toLowerCase()) || e.resourceId?.toLowerCase().includes(String(query).toLowerCase())); return m && ((preferClickable ?? true) ? e.clickable : true); }) || els.find(e => (e.text?.toLowerCase().includes(String(query).toLowerCase()) || e.contentDesc?.toLowerCase().includes(String(query).toLowerCase()) || e.resourceId?.toLowerCase().includes(String(query).toLowerCase())));

      return { content: [

        { type: 'text', text: results.join('\n') },  server.registerTool(                      if (hit) { found = true; break; } await new Promise(r => setTimeout(r, 300));

        { type: 'image', data: png.toString('base64'), mimeType: 'image/png' },

        { type: 'text', text: logs || '(no recent logs)' }    'adb_input',                    }

      ] };

    }    {                    results.push(found ? `wait_for_element: found ${query}` : `wait_for_element: timeout ${query}`); break;

  );

      title: 'ADB Input (tap/swipe/key/text)',                  }

  // Connect via stdio

  const transport = new StdioServerTransport();      description: 'Simulate basic input on the device: tap, swipe, keyevent, or text.',                  case 'dismiss_keyboard': { await ADB.spawn(['shell', 'input', 'keyevent', 'BACK'], { deviceId }); results.push('dismiss_keyboard: sent BACK'); break; }

  await server.connect(transport);

      inputSchema: {                  case 'swipe_percent': {

  return server;

}        action: z.enum(['tap', 'swipe', 'keyevent', 'text']),                    const { x1Pct, y1Pct, x2Pct, y2Pct, durationMs } = step.args || {}; const sz = await getScreenSize(deviceId); if (!sz) { results.push('swipe_percent: unknown screen size'); break; }


        x: z.number().optional(),                    const x1 = Math.round((Number(x1Pct) / 100) * sz.width); const y1 = Math.round((Number(y1Pct) / 100) * sz.height);

        y: z.number().optional(),                    const x2 = Math.round((Number(x2Pct) / 100) * sz.width); const y2 = Math.round((Number(y2Pct) / 100) * sz.height);

        x2: z.number().optional(),                    await ADB.spawn(['shell', 'input', 'swipe', String(x1), String(y1), String(x2), String(y2), String(durationMs ?? 300)], { deviceId });

        y2: z.number().optional(),                    results.push(`swipe_percent: ${x1Pct}%,${y1Pct}% -> ${x2Pct}%,${y2Pct}%`); break;

        keycode: z.string().optional(),                  }

        text: z.string().optional()                }

      }                if (viewEveryStep) { const png = await captureScreenshot(deviceId); stepImages.push(png.toString('base64')); }

    },              } catch (e: any) { results.push(`error: ${step.tool}: ${e?.message || e}`); }

    async ({ action, x, y, x2, y2, keycode, text }) => {            }

      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());            const png = await captureScreenshot(deviceId);

      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };            const base = [{ type: 'text', text: results.join('\n') } as const, { type: 'image', data: png.toString('base64'), mimeType: 'image/png' as const }];

            const extraImgs = stepImages.map(d => ({ type: 'image', data: d, mimeType: 'image/png' as const }));

      const args = ['shell', 'input'];            if (!includeLogs) return { content: [...base, ...extraImgs] };

      switch (action) {            const logs = logcatManager.getBuffer().slice(-maxLogLines).join('\n');

        case 'tap':            return { content: [...base, { type: 'text', text: logs || '(no recent logs)' }, ...extraImgs] };

          if (typeof x !== 'number' || typeof y !== 'number') return { content: [{ type: 'text', text: 'tap requires x and y' }] };          }

          args.push('tap', String(x), String(y));        );

          break;

        case 'swipe':        // Connect via stdio

          if ([x, y, x2, y2].some(v => typeof v !== 'number')) return { content: [{ type: 'text', text: 'swipe requires x,y,x2,y2' }] };        const transport = new StdioServerTransport();

          args.push('swipe', String(x), String(y), String(x2!), String(y2!));        await server.connect(transport);

          break;        return server;

        case 'keyevent':      }

          if (!keycode) return { content: [{ type: 'text', text: 'keyevent requires keycode (e.g., ENTER, BACK)' }] };        value: z.string().describe('The text to input')

          args.push('keyevent', keycode);
          break;
        case 'text':
          if (!text) return { content: [{ type: 'text', text: 'text requires a value' }] };
          // Quote text to avoid shell parsing issues
          args.push('text', `'${text.replace(/'/g, "'\\''")}'`);
          break;
      }

      await new Promise(r => setTimeout(r, humanDelayMs()));
      await ADB.spawn(args, { deviceId });

      if (expertMode && autoViewAfterAction) {
        const png = await captureScreenshot(deviceId);
        return { content: [
          { type: 'text', text: `Sent ${action}` },
          { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }
        ] };
      }
      return { content: [{ type: 'text', text: `Sent ${action}` }] };
    }
  );

  server.registerTool(
    'foreground_app',
    {
      title: 'Get Foreground App Package',
      description: 'Returns the package name of the current foreground app.',
      inputSchema: {}
    },
    async () => {
      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());
      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

      const pkg = await getForegroundApp(deviceId);
      return { content: [{ type: 'text', text: pkg }] };
    }
  );

  // Tap an element by query (text, content-desc, resource-id contains)
  server.registerTool(
    'tap_by_query',
    {
      title: 'Tap by Query',
      description: 'Finds the first matching UI element (by text, content-desc, or resource-id substring) and taps its center.',
      inputSchema: {
        query: z.string().describe('Substring to match against text, content-desc, or resource-id'),
        preferClickable: z.boolean().optional().default(true)
      }
    },
    async ({ query, preferClickable = true }) => {
      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());
      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

      const xml = await dumpUiXml(deviceId);
      const els = extractElements(xml);
      const cand = els.find(e => {
        const hit = (
          e.text?.toLowerCase().includes(query.toLowerCase())
          || e.contentDesc?.toLowerCase().includes(query.toLowerCase())
          || e.resourceId?.toLowerCase().includes(query.toLowerCase())
        );
        return hit && (!preferClickable || e.clickable);
      }) || els.find(e => (
        e.text?.toLowerCase().includes(query.toLowerCase())
        || e.contentDesc?.toLowerCase().includes(query.toLowerCase())
        || e.resourceId?.toLowerCase().includes(query.toLowerCase())
      ));
      if (!cand) return { content: [{ type: 'text', text: `No element matching "${query}"` }] };

      const b = parseBounds(cand.bounds);
      if (!b) return { content: [{ type: 'text', text: `Element found but bounds unavailable` }] };

      await new Promise(r => setTimeout(r, humanDelayMs()));
      await ADB.spawn(['shell', 'input', 'tap', String(b.cx), String(b.cy)], { deviceId });

      if (expertMode && autoViewAfterAction) {
        const png = await captureScreenshot(deviceId);
        return { content: [
          { type: 'text', text: `Tapped ${query} at ${b.cx},${b.cy}` },
          { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }
        ] };
      }
      return { content: [{ type: 'text', text: `Tapped ${query} at ${b.cx},${b.cy}` }] };
    }
  );

  // Type text into focused input
  server.registerTool(
    'type_text',
    {
      title: 'Type Text',
      description: 'Types text into the currently focused input field.',
      inputSchema: {
        value: z.string().describe('The text to input')
      }
    },
    async ({ value }) => {
      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());
      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

      const safe = `'${value.replace(/'/g, "'\\''")}'`;
      await new Promise(r => setTimeout(r, humanDelayMs()));
      await ADB.spawn(['shell', 'input', 'text', safe], { deviceId });

      if (expertMode && autoViewAfterAction) {
        const png = await captureScreenshot(deviceId);
        return { content: [
          { type: 'text', text: `Typed text (${value.length} chars)` },
          { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }
        ] };
      }
      return { content: [{ type: 'text', text: `Typed text (${value.length} chars)` }] };
    }
  );

  // High-level act-and-view sequence: run multiple actions then return a fresh view
  server.registerTool(
    'act_and_view',
    {
      title: 'Act and View',
      description: 'Execute a sequence of actions (tap_by_query, type_text, adb_input, tap_percent, swipe_percent, dismiss_keyboard, wait_for_element) and return a final screenshot and logs. Actions are executed in order.',
      inputSchema: {
        actions: z.array(
          z.discriminatedUnion('tool', [
            z.object({
              tool: z.literal('tap_by_query'),
              args: z.object({
                query: z.string().describe('Substring to match against text, content-desc, or resource-id'),
                preferClickable: z.boolean().optional().default(true)
              })
            }),
            z.object({
              tool: z.literal('type_text'),
              args: z.object({
                value: z.string().describe('The text to input')
              })
            }),
            z.object({
              tool: z.literal('adb_input'),
              args: z.object({
                action: z.enum(['tap', 'swipe', 'keyevent', 'text']),
                x: z.number().optional(),
                y: z.number().optional(),
                x2: z.number().optional(),
                y2: z.number().optional(),
                keycode: z.string().optional(),
                text: z.string().optional()
              })
            }),
            z.object({
              tool: z.literal('tap_percent'),
              args: z.object({
                xPct: z.number().min(0).max(100),
                yPct: z.number().min(0).max(100)
              })
            }),
            z.object({
              tool: z.literal('swipe_percent'),
              args: z.object({
                xPct: z.number().min(0).max(100),
                yPct: z.number().min(0).max(100),
                x2Pct: z.number().min(0).max(100),
                y2Pct: z.number().min(0).max(100),
                durationMs: z.number().int().optional()
              })
            }),
            z.object({
              tool: z.literal('dismiss_keyboard'),
              args: z.object({}).optional()
            }),
            z.object({
              tool: z.literal('wait_for_element'),
              args: z.object({
                query: z.string(),
                timeoutMs: z.number().int().optional().default(8000),
                preferClickable: z.boolean().optional().default(true)
              })
            })
          ])
        ),
        includeLogs: z.boolean().optional().default(true),
        maxLogLines: z.number().int().optional().default(120)
      }
    },
    async ({ actions, includeLogs = true, maxLogLines = 120 }) => {
      const deviceId = sessions.getActiveDeviceId() || (await ADB.autoSelectDevice());
      if (!deviceId) return { content: [{ type: 'text', text: 'No active device/emulator found.' }] };

      const results: string[] = [];

      for (const step of actions) {
        try {
          await new Promise(r => setTimeout(r, humanDelayMs()));

          switch (step.tool) {
            case 'tap_by_query': {
              const { query, preferClickable } = step.args || {};
              const xml = await dumpUiXml(deviceId);
              const els = extractElements(xml);
              const cand = els.find(e => {
                const hit = (
                  e.text?.toLowerCase().includes(query.toLowerCase())
                  || e.contentDesc?.toLowerCase().includes(query.toLowerCase())
                  || e.resourceId?.toLowerCase().includes(query.toLowerCase())
                );
                return hit && ((preferClickable ?? true) ? e.clickable : true);
              }) || els.find(e => (
                e.text?.toLowerCase().includes(query.toLowerCase())
                || e.contentDesc?.toLowerCase().includes(query.toLowerCase())
                || e.resourceId?.toLowerCase().includes(query.toLowerCase())
              ));
              if (!cand) {
                results.push(`tap_by_query: no match for ${query}`);
                break;
              }
              const b = parseBounds(cand.bounds);
              if (!b) {
                results.push(`tap_by_query: bounds missing for ${query}`);
                break;
              }
              await ADB.spawn(['shell', 'input', 'tap', String(b.cx), String(b.cy)], { deviceId });
              results.push(`tap_by_query: tapped ${query} at ${b.cx},${b.cy}`);
              break;
            }

            case 'type_text': {
              const { value } = step.args || {};
              const safe = `'${String(value ?? '').replace(/'/g, "'\\''")}'`;
              await ADB.spawn(['shell', 'input', 'text', safe], { deviceId });
              results.push(`type_text: typed (${String(value ?? '').length} chars)`);
              break;
            }

            case 'adb_input': {
              const { action, x, y, x2, y2, keycode, text } = step.args || {};
              const args = ['shell', 'input'];
              if (action === 'tap') args.push('tap', String(x), String(y));
              else if (action === 'swipe') args.push('swipe', String(x), String(y), String(x2), String(y2));
              else if (action === 'keyevent') args.push('keyevent', String(keycode));
              else if (action === 'text') args.push('text', `'${String(text ?? '').replace(/'/g, "'\\''")}'`);
              else {
                results.push(`adb_input: unsupported action ${action}`);
                break;
              }
              await ADB.spawn(args, { deviceId });
              results.push(`adb_input: ${action}`);
              break;
            }

            case 'tap_percent': {
              const { xPct, yPct } = step.args || {};
              const sz = await getScreenSize(deviceId);
              if (!sz) {
                results.push('tap_percent: unknown screen size');
                break;
              }
              const x = Math.round((Number(xPct) / 100) * sz.width);
              const y = Math.round((Number(yPct) / 100) * sz.height);
              await ADB.spawn(['shell', 'input', 'tap', String(x), String(y)], { deviceId });
              results.push(`tap_percent: tapped ${xPct}%,${yPct}% -> ${x},${y}`);
              break;
            }

            case 'swipe_percent': {
              const { xPct, yPct, x2Pct, y2Pct, durationMs } = step.args || {};
              const sz = await getScreenSize(deviceId);
              if (!sz) {
                results.push('swipe_percent: unknown screen size');
                break;
              }
              const x = Math.round((Number(xPct) / 100) * sz.width);
              const y = Math.round((Number(yPct) / 100) * sz.height);
              const x2 = Math.round((Number(x2Pct) / 100) * sz.width);
              const y2 = Math.round((Number(y2Pct) / 100) * sz.height);
              const args = ['shell', 'input', 'swipe', String(x), String(y), String(x2), String(y2)];
              if (typeof durationMs === 'number') args.push(String(durationMs));
              await ADB.spawn(args, { deviceId });
              results.push(`swipe_percent: swiped ${xPct}%,${yPct}% -> ${x2Pct}%,${y2Pct}%`);
              break;
            }

            case 'dismiss_keyboard': {
              await ADB.spawn(['shell', 'input', 'keyevent', 'BACK'], { deviceId });
              results.push('dismiss_keyboard: sent BACK');
              break;
            }

            case 'wait_for_element': {
              const { query, timeoutMs, preferClickable } = step.args || {};
              const start = Date.now();
              let found = false;
              while (Date.now() - start < (timeoutMs ?? 8000)) {
                const xml = await dumpUiXml(deviceId);
                const els = extractElements(xml);
                const hit = els.find(e => {
                  const m = (
                    e.text?.toLowerCase().includes(String(query).toLowerCase())
                    || e.contentDesc?.toLowerCase().includes(String(query).toLowerCase())
                    || e.resourceId?.toLowerCase().includes(String(query).toLowerCase())
                  );
                  return m && ((preferClickable ?? true) ? e.clickable : true);
                }) || els.find(e => (
                  e.text?.toLowerCase().includes(String(query).toLowerCase())
                  || e.contentDesc?.toLowerCase().includes(String(query).toLowerCase())
                  || e.resourceId?.toLowerCase().includes(String(query).toLowerCase())
                ));
                if (hit) {
                  found = true;
                  break;
                }
                await new Promise(r => setTimeout(r, 300));
              }
              results.push(found ? `wait_for_element: found ${query}` : `wait_for_element: timeout ${query}`);
              break;
            }
          }
        } catch (e: any) {
          results.push(`error: ${step.tool}: ${e?.message || e}`);
        }
      }

      const png = await captureScreenshot(deviceId);
      if (!includeLogs) {
        return { content: [
          { type: 'text', text: results.join('\n') },
          { type: 'image', data: png.toString('base64'), mimeType: 'image/png' }
        ] };
      }

      const logs = logcatManager.getBuffer().slice(-maxLogLines).join('\n');
      return { content: [
        { type: 'text', text: results.join('\n') },
        { type: 'image', data: png.toString('base64'), mimeType: 'image/png' },
        { type: 'text', text: logs || '(no recent logs)' }
      ] };
    }
  );

  // Connect via stdio
  const transport = new StdioServerTransport();
  await server.connect(transport);

  return server;
}
