import { describe, it, expect } from 'vitest';
import { TemperatureEngine } from './temperatureEngine';

describe('TemperatureEngine', () => {
  it('parses log correctly', () => {
    const logText = `
2026-08-01 10:00:00 Recv>> Command No: 1 Station No: 1 Read Data Value: 250
2026-08-01 10:00:00 Recv>> Command No: 1 Station No: 2 Read Data Value: 280
`;
    const parsed = TemperatureEngine.parseLog(logText);
    expect(parsed.length).toBe(2);
    expect(parsed[0].val).toBe(25);
    expect(parsed[1].val).toBe(28);
  });

  it('downsamples points with Date instances without NaN', () => {
    const samplePoints = [
      { ts: new Date('2026-08-01T10:00:00.000Z'), val: 19.9 },
      { ts: new Date('2026-08-01T10:10:00.000Z'), val: 25.9 },
      { ts: new Date('2026-08-01T10:20:00.000Z'), val: 22.9 },
      { ts: new Date('2026-08-01T10:30:00.000Z'), val: 23.5 },
      { ts: new Date('2026-08-01T10:40:00.000Z'), val: 21.0 }
    ];

    const downsampled = TemperatureEngine.downsamplePoints(samplePoints, 10);
    expect(downsampled.length).toBe(5);
    downsampled.forEach((pt) => {
      expect(pt.ts instanceof Date).toBe(true);
      expect(isNaN(pt.ts.getTime())).toBe(false);
      expect(typeof pt.val).toBe('number');
      expect(isNaN(pt.val)).toBe(false);
    });
  });

  it('calculates stats correctly', () => {
    const stats = TemperatureEngine.calcStats([
      { val: 19.9 },
      { val: 25.9 },
      { val: 22.9 }
    ]);
    expect(stats).toBeDefined();
    expect(stats?.min).toBe(19.9);
    expect(stats?.max).toBe(25.9);
    expect(stats?.range).toBe(6);
  });

  it('filters deleted records cleanly without modifying remaining records', () => {
    const rec1 = { id: 'TR-1', title: 'Inspection 1' };
    const rec2 = { id: 'TR-2', title: 'Inspection 2' };
    const records = [rec1, rec2];

    const targetId = 'TR-1';
    const remaining = records.filter(r => r.id !== targetId);

    expect(remaining.length).toBe(1);
    expect(remaining[0].id).toBe('TR-2');
    expect(remaining.some(r => r.id === 'TR-1')).toBe(false);
  });
});

export function runTemperatureEngineTests() {
  const logText = `
2026-08-01 10:00:00 Recv>> Command No: 1 Station No: 1 Read Data Value: 250
2026-08-01 10:00:00 Recv>> Command No: 1 Station No: 2 Read Data Value: 280
`;
  const parsed = TemperatureEngine.parseLog(logText);
  if (parsed.length !== 2) {
    throw new Error(`Expected 2 records, got ${parsed.length}`);
  }
  if (parsed[0].val !== 25) {
    throw new Error(`Expected first record value to be 25, got ${parsed[0].val}`);
  }
  if (parsed[1].val !== 28) {
    throw new Error(`Expected second record value to be 28, got ${parsed[1].val}`);
  }

  const samplePoints = [
    { ts: new Date('2026-08-01T10:00:00.000Z'), val: 19.9 },
    { ts: new Date('2026-08-01T10:10:00.000Z'), val: 25.9 },
    { ts: new Date('2026-08-01T10:20:00.000Z'), val: 22.9 },
    { ts: new Date('2026-08-01T10:30:00.000Z'), val: 23.5 },
    { ts: new Date('2026-08-01T10:40:00.000Z'), val: 21.0 }
  ];

  const downsampled = TemperatureEngine.downsamplePoints(samplePoints, 10);
  if (downsampled.length !== 5) {
    throw new Error(`Expected 5 downsampled points, got ${downsampled.length}`);
  }

  downsampled.forEach((pt, i) => {
    if (!(pt.ts instanceof Date)) {
      throw new Error(`Point ${i} ts is not a Date instance`);
    }
    if (isNaN(pt.ts.getTime())) {
      throw new Error(`Point ${i} ts.getTime() is NaN`);
    }
    if (typeof pt.val !== 'number' || isNaN(pt.val)) {
      throw new Error(`Point ${i} val is NaN or not a number`);
    }
  });

  const stats = TemperatureEngine.calcStats([
    { val: 19.9 },
    { val: 25.9 },
    { val: 22.9 }
  ]);
  if (!stats || stats.min !== 19.9 || stats.max !== 25.9 || stats.range !== 6) {
    throw new Error(`Stats mismatch: expected min 19.9, max 25.9, range 6; got min ${stats?.min}, max ${stats?.max}, range ${stats?.range}`);
  }

  return true;
}
