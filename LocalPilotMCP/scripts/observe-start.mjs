import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'node:path';

async function main() {
  const deviceId = process.argv[2];
  const serverEntrypoint = resolve(dirname(fileURLToPath(import.meta.url)), '../dist/index.js');
  const transport = new StdioClientTransport({ command: 'node', args: [serverEntrypoint] });

  const client = new Client({ name: 'adb-mcp-cli', version: '1.0.0' });
  await client.connect(transport);

  const args = {};
  if (deviceId) args.deviceId = deviceId;

  const res = await client.callTool({ name: 'start_observation_session', arguments: args });
  const msg = res?.content?.[0]?.text ?? JSON.stringify(res);
  console.log(msg);
}

main().catch((e) => {
  console.error('Failed to start observation:', e);
  process.exit(1);
});
