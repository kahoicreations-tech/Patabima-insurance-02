import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'node:path';

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  // Use full-server directly (no build artifact required)
  const serverEntrypoint = resolve(here, '../full-server.mjs');
  const transport = new StdioClientTransport({ command: 'node', args: [serverEntrypoint] });
  const client = new Client({ name: 'adb-mcp-observe-expo', version: '1.0.0' });
  await client.connect(transport);

  // Legacy client passed `package`; server now accepts either `packageName` or `package`
  const res = await client.callTool({ name: 'start_observation_for_package', arguments: { package: 'host.exp.exponent' } });
  console.log(res.content?.[0]?.text || JSON.stringify(res));
}

main().catch((e) => { console.error('observe-expo failed:', e?.message || e); process.exit(1); });
