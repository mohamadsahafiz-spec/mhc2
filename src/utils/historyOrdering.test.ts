import { describe, it, expect } from 'vitest';

describe('Standardized History Ordering (Newest -> Oldest)', () => {
  it('sorts Temperature records newest first by createdAt', () => {
    const records = [
      { id: '1', createdAt: '2026-08-01T10:00:00Z', overallResult: 'PASS' },
      { id: '2', createdAt: '2026-09-02T12:00:00Z', overallResult: 'PASS' },
      { id: '3', createdAt: '2026-07-15T08:00:00Z', overallResult: 'PASS' }
    ];
    const sorted = [...records].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    expect(sorted.map(r => r.id)).toEqual(['2', '1', '3']);
  });

  it('sorts Laser Power records newest first by date', () => {
    const records = [
      { id: 'lp-old', date: '2026-05-10' },
      { id: 'lp-new', date: '2026-09-01' },
      { id: 'lp-mid', date: '2026-07-20' }
    ];
    const sorted = [...records].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    expect(sorted.map(r => r.id)).toEqual(['lp-new', 'lp-mid', 'lp-old']);
  });

  it('sorts Beam Profile records newest first by date', () => {
    const records = [
      { id: 'bp-1', date: '2026-06-01' },
      { id: 'bp-2', date: '2026-09-03' },
      { id: 'bp-3', date: '2026-08-15' }
    ];
    const sorted = [...records].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    expect(sorted.map(r => r.id)).toEqual(['bp-2', 'bp-3', 'bp-1']);
  });

  it('sorts Focus Optimization records newest first while preserving position sequence', () => {
    const positionSequence = ['+0.300 mm', '+0.200 mm', '+0.100 mm', '0.000 mm', '-0.100 mm', '-0.200 mm', '-0.300 mm'];
    const records = [
      { id: 'fo-old', date: '2026-04-10', positions: positionSequence },
      { id: 'fo-new', date: '2026-09-02', positions: positionSequence }
    ];
    const sorted = [...records].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    expect(sorted.map(r => r.id)).toEqual(['fo-new', 'fo-old']);
    expect(sorted[0].positions).toEqual(positionSequence);
  });

  it('sorts Product & Process records newest first by date', () => {
    const records = [
      { id: 'pp-1', date: '2026-01-01' },
      { id: 'pp-2', date: '2026-09-01' },
      { id: 'pp-3', date: '2026-06-15' }
    ];
    const sorted = [...records].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    expect(sorted.map(r => r.id)).toEqual(['pp-2', 'pp-3', 'pp-1']);
  });
});
