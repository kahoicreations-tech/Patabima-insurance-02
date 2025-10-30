import { once } from 'node:events';
import { ADB } from './executor.js';

export async function captureScreenshot(deviceId: string): Promise<Buffer> {
  // Use adb exec-out screencap -p for direct PNG output
  const child = await ADB.spawn(['exec-out', 'screencap', '-p'], { deviceId });
  const chunks: Buffer[] = [];
  let stderr = '';
  child.stdout.on('data', (d: Buffer) => chunks.push(Buffer.from(d)));
  child.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
  await once(child, 'close');
  if (stderr.trim()) throw new Error(`screencap error: ${stderr}`);
  return Buffer.concat(chunks);
}
