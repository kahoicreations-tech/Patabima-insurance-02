import { ADB } from './executor.js';

export type ScreenSize = { width: number; height: number };

export async function getScreenSize(deviceId: string): Promise<ScreenSize | null> {
  const child = await ADB.spawn(['shell', 'wm', 'size'], { deviceId });
  let stdout = '';
  child.stdout.on('data', (d) => { stdout += d.toString(); });
  await new Promise((r) => child.on('close', r));
  // Example outputs:
  // Physical size: 1080x1920
  // Override size: 720x1280
  const m = stdout.match(/Physical size:\s*(\d+)x(\d+)/i) || stdout.match(/Override size:\s*(\d+)x(\d+)/i);
  if (!m) return null;
  return { width: Number(m[1]), height: Number(m[2]) };
}
