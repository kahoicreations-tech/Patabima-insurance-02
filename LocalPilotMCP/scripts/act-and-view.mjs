import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'node:path';

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const serverEntrypoint = resolve(here, '../dist/index.js');
  const transport = new StdioClientTransport({ command: 'node', args: [serverEntrypoint] });
  const client = new Client({ name: 'adb-mcp-act-and-view', version: '1.0.0' });
  await client.connect(transport);

  // Sample: tap a query, type some text, then view
  const actions = [
    { tool: 'tap_by_query', args: { query: 'Phone' } },
    { tool: 'type_text', args: { value: '0792865547' } },
    { tool: 'tap_by_query', args: { query: 'Password' } },
    { tool: 'type_text', args: { value: 'Best254#' } },
  ];

  const res = await client.callTool({ name: 'act_and_view', arguments: { actions, includeLogs: true, maxLogLines: 120 } });
  const img = res.content?.find(c => c.type === 'image');
  const txts = res.content?.filter(c => c.type === 'text') || [];

  if (img?.data && img?.mimeType === 'image/png') {
    const outDir = resolve(here, '../out');
    const { mkdirSync, writeFileSync } = await import('node:fs');
    mkdirSync(outDir, { recursive: true });
    const file = resolve(outDir, `after-act-${Date.now()}.png`);
    writeFileSync(file, Buffer.from(img.data, 'base64'));
    console.log(`[act] Saved screenshot: ${file}`);
  }

  for (const t of txts) console.log(t.text);
}

main().catch((e) => { console.error('act-and-view failed:', e?.message || e); process.exit(1); });
