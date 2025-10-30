import { ADB } from './executor.js';

export async function getPidForPackage(deviceId: string, pkg: string): Promise<string | null> {
  // Try pidof first (fast path)
  try {
    const child = await ADB.spawn(['shell', 'pidof', pkg], { deviceId });
    const chunks: Buffer[] = [];
    const out: string = await new Promise((resolve) => {
      child.stdout.on('data', (c: Buffer) => chunks.push(c));
      child.on('close', () => resolve(Buffer.concat(chunks).toString('utf-8').trim()));
    });
    if (out) {
      const pid = out.split(/\s+/).filter(Boolean)[0];
      return pid || null;
    }
  } catch {}

  // Fallback to parsing ps output
  try {
    const child = await ADB.spawn(['shell', 'ps', '-A'], { deviceId });
    const chunks: Buffer[] = [];
    const out: string = await new Promise((resolve) => {
      child.stdout.on('data', (c: Buffer) => chunks.push(c));
      child.on('close', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
    const line = out.split(/\r?\n/).find((l) => l.includes(pkg));
    if (!line) return null;
    const cols = line.trim().split(/\s+/);
    // ps output usually: USER PID ... NAME
    const pid = cols[1];
    return pid || null;
  } catch {
    return null;
  }
}

export async function getForegroundApp(deviceId: string): Promise<string> {
  try {
    // Try to get top resumed activity (Android 10+)
    const child = await ADB.spawn(['shell', 'dumpsys', 'activity', 'activities'], { deviceId });
    const chunks: Buffer[] = [];
    const text: string = await new Promise((resolve) => {
      child.stdout.on('data', (c: Buffer) => chunks.push(c));
      child.on('close', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
    const match = text.match(/topResumedActivity\s*\{[^\s]+\s+([^\/\s]+)\//);
    if (match?.[1]) return match[1];
  } catch {}
  try {
    // Fallback: current focus window line
    const child = await ADB.spawn(['shell', 'dumpsys', 'window', 'windows'], { deviceId });
    const chunks: Buffer[] = [];
    const text: string = await new Promise((resolve) => {
      child.stdout.on('data', (c: Buffer) => chunks.push(c));
      child.on('close', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
    const match = text.match(/mCurrentFocus=Window\{[^\s]+\s+([^\/\s]+)\//);
    if (match?.[1]) return match[1];
  } catch {}
  return 'unknown';
}
