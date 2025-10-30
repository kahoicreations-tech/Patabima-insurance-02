import { ADB } from './executor.js';

export interface LogOptions { priority?: 'V'|'D'|'I'|'W'|'E'|'F'; tags?: string[]; pid?: string }

export class LogcatManager {
  private proc: import('child_process').ChildProcess | null = null;
  private buffer: string[] = [];
  private maxLines = 1000;

  async start(deviceId: string, opts: LogOptions = {}) {
    if (this.proc) return; // already running
    const args = ['logcat', '-v', 'time'];
    if (opts.pid) {
      // Prefer --pid to limit noise if supported
      args.push('--pid', opts.pid);
    }
    const filters: string[] = [];
    if (opts.tags && opts.tags.length > 0) {
      for (const t of opts.tags) filters.push(`${t}:${opts.priority || 'I'}`);
    }
    if (filters.length > 0) args.push(...filters);
    const child = await ADB.spawn(args, { deviceId });
    this.proc = child;
    child.stdout.setEncoding('utf-8');
    child.stdout.on('data', (chunk: string) => {
      const lines = chunk.split(/\r?\n/).filter(Boolean);
      this.buffer.push(...lines);
      if (this.buffer.length > this.maxLines) this.buffer.splice(0, this.buffer.length - this.maxLines);
    });
    child.on('close', () => { this.proc = null; });
  }

  stop() {
    if (this.proc) {
      this.proc.kill('SIGINT');
      this.proc = null;
    }
  }

  getBuffer(): string[] { return this.buffer.slice(-200); }
}
