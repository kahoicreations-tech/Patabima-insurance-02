import { createServer } from './server.js';

async function main() {
  await createServer();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('ADB MCP Server failed to start:', err);
  process.exit(1);
});
