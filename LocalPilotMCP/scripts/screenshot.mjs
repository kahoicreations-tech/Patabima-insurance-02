import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

async function main() {
  const outPath = resolve(process.argv[2] || 'out/screen.png');
  const serverEntrypoint = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/index.js');
  const transport = new StdioClientTransport({ command: 'node', args: [serverEntrypoint] });

  const client = new Client({ name: 'adb-mcp-cli', version: '1.0.0' });
  await client.connect(transport);

  const res = await client.readResource({ uri: 'adb://current-screen' });
  const item = res?.contents?.[0];
  if (!item || item.mimeType !== 'image/png' || !item.blob) {
    const fallback = item?.text || 'No image returned';
    throw new Error(`Unexpected response: ${fallback}`);
  }

  const buf = Buffer.from(item.blob, 'base64');
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, buf);
  console.log(`Saved screenshot to ${outPath}`);
}

main().catch((e) => {
  console.error('Failed to capture screenshot:', e?.message || e);
  process.exit(1);
});
