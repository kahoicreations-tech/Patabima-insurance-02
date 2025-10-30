import { LogOptions, LogcatManager } from '../adb/logcat.js';

export class ObservationSessionManager {
  private activeDeviceId: string | null = null;
  private started = false;

  constructor(private logcat: LogcatManager) {}

  async start(deviceId: string, logOpts: LogOptions) {
    if (this.started && this.activeDeviceId === deviceId) return;
    if (this.started) await this.end();
    this.activeDeviceId = deviceId;
    await this.logcat.start(deviceId, logOpts);
    this.started = true;
  }

  async end(): Promise<boolean> {
    if (!this.started) return false;
    this.logcat.stop();
    this.started = false;
    this.activeDeviceId = null;
    return true;
  }

  getActiveDeviceId() { return this.activeDeviceId; }
}
