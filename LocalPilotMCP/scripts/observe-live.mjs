import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'url';

function parseArgs(argv) {
  const opts = { deviceId: undefined, priority: 'I', tags: [], screenshotInterval: 0, logsEvery: 2000, outDir: 'out', pkg: undefined };
  for (const arg of argv.slice(2)) {
    if (arg.startsWith('--device=')) opts.deviceId = arg.split('=')[1];
    else if (arg.startsWith('--priority=')) opts.priority = arg.split('=')[1];
    else if (arg.startsWith('--tags=')) opts.tags = arg.split('=')[1].split(',').map(s => s.trim()).filter(Boolean);
    else if (arg.startsWith('--screenshot-interval=')) opts.screenshotInterval = Number(arg.split('=')[1]) * 1000;
    else if (arg.startsWith('--logs-every=')) opts.logsEvery = Number(arg.split('=')[1]);
    else if (arg.startsWith('--out-dir=')) opts.outDir = arg.split('=')[1];
    else if (arg.startsWith('--pkg=')) opts.pkg = arg.split('=')[1];
  }
  return opts;
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
  const opts = parseArgs(process.argv);
  const serverEntrypoint = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/index.js');
  const transport = new StdioClientTransport({ command: 'node', args: [serverEntrypoint] });
  const client = new Client({ name: 'adb-mcp-observe-live', version: '1.0.0' });
  await client.connect(transport);

  // Start session
  let startRes;
  if (opts.pkg) {
    startRes = await client.callTool({ name: 'start_observation_for_package', arguments: { package: opts.pkg, priority: opts.priority } });
  } else {
    const startArgs = {};
    if (opts.deviceId) startArgs.deviceId = opts.deviceId;
    if (opts.priority) startArgs.priority = opts.priority;
    if (opts.tags?.length) startArgs.tags = opts.tags;
    startRes = await client.callTool({ name: 'start_observation_session', arguments: startArgs });
  }
  console.log(startRes?.content?.[0]?.text || 'Observation started');

  // Log streaming loop
  let lastLines = [];
  let running = true;
  const outDir = resolve(opts.outDir);
  mkdirSync(outDir, { recursive: true });

  // Periodic screenshots
  let shotTimer = null;
  async function takeScreenshot() {
    try {
      const res = await client.readResource({ uri: 'adb://current-screen' });
      const item = res?.contents?.[0];
      if (item?.blob && item?.mimeType === 'image/png') {
        const ts = new Date().toISOString().replace(/[:.]/g, '-');
        const file = resolve(outDir, `screen-${ts}.png`);
        writeFileSync(file, Buffer.from(item.blob, 'base64'));
        console.log(`[shot] Saved ${file}`);
      }
    } catch (e) {
      console.error('[shot] Failed:', e?.message || e);
    }
  }
  if (opts.screenshotInterval > 0) {
    shotTimer = setInterval(takeScreenshot, opts.screenshotInterval);
  }

  async function fetchLogsOnce() {
    try {
      const res = await client.readResource({ uri: 'adb://logcat' });
      const text = res?.contents?.[0]?.text || '';
      const lines = text.split(/\r?\n/).filter(Boolean);
      // Print only new lines
      let startIndex = 0;
      if (lastLines.length) {
        // Find overlap from the end
        for (let k = Math.min(lastLines.length, lines.length); k >= 0; k--) {
          const tailA = lastLines.slice(-k).join('\n');
          const tailB = lines.slice(0, k).join('\n');
          if (tailA === tailB) { startIndex = k; break; }
        }
      }
      const newLines = lines.slice(startIndex);
      if (newLines.length) {
        for (const l of newLines) console.log(l);
      }
      lastLines = lines;
    } catch (e) {
      // Ignore transient errors
    }
  }

  process.on('SIGINT', async () => {
    running = false;
    if (shotTimer) clearInterval(shotTimer);
    try {
      const endRes = await client.callTool({ name: 'end_observation_session', arguments: {} });
      console.log(endRes?.content?.[0]?.text || 'Observation ended');
    } finally {
      process.exit(0);
    }
  });

  console.log(`[observe] Streaming logs every ${opts.logsEvery}ms${opts.screenshotInterval>0?`, screenshots every ${opts.screenshotInterval/1000}s → ${outDir}`:''}. Press Ctrl+C to stop.`);
  // Small warm-up for log buffer
  await sleep(1000);

  while (running) {
    await fetchLogsOnce();
    await sleep(opts.logsEvery);
  }
}

main().catch((e) => {
  console.error('observe-live failed:', e?.message || e);
  process.exit(1);
});
