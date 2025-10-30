import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'url';

async function main() {
  const out = resolve('out');
  const serverEntrypoint = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/index.js');
  mkdirSync(out, { recursive: true });
  const transport = new StdioClientTransport({ command: 'node', args: [serverEntrypoint] });
  const client = new Client({ name: 'adb-mcp-view-now', version: '1.0.0' });
  await client.connect(transport);

  const res = await client.callTool({ name: 'get_current_view', arguments: { includeLogs: true, maxLogLines: 150 } });
  const img = res.content?.find(c => c.type === 'image');
  const txt = res.content?.find(c => c.type === 'text');
  if (img?.data && img?.mimeType === 'image/png') {
    const file = resolve(out, `view-${Date.now()}.png`);
    writeFileSync(file, Buffer.from(img.data, 'base64'));
    console.log(`[view] Saved screenshot: ${file}`);
  } else {
    console.log('[view] No image in response');
  }
  console.log('\n--- Recent Logs ---');
  console.log(txt?.text || '(no logs)');
}

main().catch(e => { console.error('get-view failed:', e?.message || e); process.exit(1); });
