import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'node:path';

async function main() {
  const serverEntrypoint = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/index.js');
  const transport = new StdioClientTransport({ command: 'node', args: [serverEntrypoint] });

  const client = new Client({ name: 'adb-mcp-ping', version: '1.0.0' });
  await client.connect(transport);

  const tools = await client.listTools();
  console.log('Tools:', tools.tools.map(t => t.name));

  const resources = await client.listResources();
  console.log('Resources:', resources.resources.map(r => r.uri));

  // Try calling a no-arg tool to ensure it works
  const result = await client.callTool({ name: 'adb_list_devices', arguments: {} });
  console.log('adb_list_devices result:', result.content?.[0]?.text || JSON.stringify(result));

  process.exit(0);
}

main().catch((err) => {
  console.error('Ping failed:', err);
  process.exit(1);
});
