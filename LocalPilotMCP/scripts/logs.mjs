import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'node:path';

async function main() {
  const serverEntrypoint = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/index.js');
  const transport = new StdioClientTransport({ command: 'node', args: [serverEntrypoint] });

  const client = new Client({ name: 'adb-mcp-cli', version: '1.0.0' });
  await client.connect(transport);

  const res = await client.readResource({ uri: 'adb://logcat' });
  const item = res?.contents?.[0];
  console.log(item?.text || 'No logs available. Start observation first.');
}

main().catch((e) => {
  console.error('Failed to read logs:', e);
  process.exit(1);
});
