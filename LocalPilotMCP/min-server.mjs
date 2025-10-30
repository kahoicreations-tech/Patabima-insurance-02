import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { spawn } from 'node:child_process';

function run(cmd, args = []) {
  return new Promise((resolve) => {
    const ps = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    ps.stdout.on('data', (d) => (out += d.toString()));
    ps.stderr.on('data', (d) => (err += d.toString()));
    ps.on('close', (code) => resolve({ code, out, err }));
  });
}

async function createServer() {
  const server = new McpServer({ name: 'adb-mcp-min', version: '0.1.0' });

  // Tool: List ADB Devices
  server.registerTool('adb_list_devices', {
    title: 'List ADB Devices',
    description: 'Lists connected Android devices/emulators using `adb devices -l`',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  }, async () => {
    const { code, out, err } = await run('adb', ['devices', '-l']);
    if (code !== 0) return { content: [{ type: 'text', text: err || 'adb failed' }] };
    return { content: [{ type: 'text', text: out.trim() || '(no devices)' }] };
  });

  // Resource: Screenshot
  server.resource('adb://current-screen', async () => {
    const { code, out, err } = await run('adb', ['exec-out', 'screencap', '-p']);
    if (code !== 0 || !out) {
      return { contents: [{ type: 'text', text: err || 'Failed to capture screenshot' }] };
    }
    const b64 = Buffer.from(out, 'binary').toString('base64');
    return { contents: [{ type: 'image', mimeType: 'image/png', data: b64 }] };
  });

  // Resource: Logcat (recent lines)
  server.resource('adb://logcat', async () => {
    const { code, out, err } = await run('adb', ['logcat', '-d', '-t', '200']);
    if (code !== 0) return { contents: [{ type: 'text', text: err || 'logcat failed' }] };
    return { contents: [{ type: 'text', text: out.trim() }] };
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

createServer().catch((e) => {
  console.error('adb-mcp-min failed:', e?.message || e);
  process.exit(1);
});
