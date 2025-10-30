import { ADB } from './executor.js';
import { XMLParser } from 'fast-xml-parser';

export async function dumpUiXml(deviceId: string): Promise<string> {
  // Use exec-out to stream XML directly
  const child = await ADB.spawn(['exec-out', 'uiautomator', 'dump', '/dev/tty'], { deviceId });
  const chunks: Buffer[] = [];
  const xml: string = await new Promise((resolve) => {
    child.stdout.on('data', (c: Buffer) => chunks.push(c));
    child.on('close', () => resolve(Buffer.concat(chunks).toString('utf-8')));
  });
  // Some devices may prefix logs; try to trim to first '<hierarchy'
  const idx = xml.indexOf('<hierarchy');
  return idx >= 0 ? xml.slice(idx) : xml;
}

export type UiElement = {
  text?: string;
  contentDesc?: string;
  resourceId?: string;
  className?: string;
  clickable?: boolean;
  bounds?: string; // "[x1,y1][x2,y2]"
};

export function parseBounds(bounds?: string): { x1: number; y1: number; x2: number; y2: number; cx: number; cy: number } | null {
  if (!bounds) return null;
  const m = bounds.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!m) return null;
  const x1 = Number(m[1]);
  const y1 = Number(m[2]);
  const x2 = Number(m[3]);
  const y2 = Number(m[4]);
  return { x1, y1, x2, y2, cx: Math.round((x1 + x2) / 2), cy: Math.round((y1 + y2) / 2) };
}

export function extractElements(xml: string): UiElement[] {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });
  const obj = parser.parse(xml);
  const out: UiElement[] = [];
  function walk(node: any) {
    if (!node) return;
    const children = Array.isArray(node) ? node : [node];
    for (const n of children) {
      if (n.node) {
        // Many nodes
        walk(n.node);
      } else if (typeof n === 'object') {
        // attributes of a node
        if (n['class'] || n.class || n.text || n['content-desc'] || n['resource-id'] || n.bounds) {
          out.push({
            className: n['class'] || n.class,
            text: n.text,
            contentDesc: n['content-desc'],
            resourceId: n['resource-id'],
            clickable: String(n.clickable).toLowerCase() === 'true',
            bounds: n.bounds
          });
        }
        // descend
        if (n.node) walk(n.node);
      }
    }
  }
  if (obj?.hierarchy) walk(obj.hierarchy);
  return out;
}
