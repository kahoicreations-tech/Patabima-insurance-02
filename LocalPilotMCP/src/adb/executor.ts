import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { platform } from 'node:os';
import which from 'which';

export interface DeviceInfo { id: string; state: string }

export class ADB {
  static async resolveAdbPath(): Promise<string> {
    try {
      const adb = await which('adb');
      return adb;
    } catch {
      // Common Windows install (adjust as needed)
      const defaults = [
        'C:/Android/platform-tools/adb.exe',
        'C:/Users/USER/AppData/Local/Android/Sdk/platform-tools/adb.exe'
      ];
      for (const p of defaults) {
        try { await which(p); return p; } catch {}
      }
      throw new Error('adb not found in PATH. Please install Android Platform Tools and ensure adb is available.');
    }
  }

  static spawn(args: string[], opts: { deviceId?: string } = {}) {
    return (async () => {
      const adbPath = await ADB.resolveAdbPath();
      const finalArgs = [] as string[];
      if (opts.deviceId) finalArgs.push('-s', opts.deviceId);
      finalArgs.push(...args);
      return spawn(adbPath, finalArgs, { stdio: ['ignore', 'pipe', 'pipe'] });
    })();
  }

  static async listDevices(): Promise<DeviceInfo[]> {
    const child = await ADB.spawn(['devices']);
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d.toString(); });
    child.stderr.on('data', (d) => { stderr += d.toString(); });
    await once(child, 'close');
    if (stderr.trim()) throw new Error(`adb devices error: ${stderr}`);
    const lines = stdout.split(/\r?\n/).slice(1).filter(Boolean);
    return lines.map((l) => {
      const [id, state] = l.trim().split(/\s+/);
      return { id, state } as DeviceInfo;
    }).filter((d) => d.id && d.state && d.state !== 'unauthorized' && d.state !== 'offline');
  }

  static async autoSelectDevice(): Promise<string | null> {
    const devices = await ADB.listDevices();
    if (devices.length === 0) return null;
    // Prefer emulator
    const emu = devices.find((d) => d.id.startsWith('emulator-'));
    return (emu?.id) || devices[0].id;
  }
}
