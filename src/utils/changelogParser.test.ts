import { describe, it, expect } from 'vitest';
import { getAuthoritativeChangelog, parseChangelog } from './changelogParser';

describe('Authoritative Changelog Parser', () => {
  it('loads and parses the root CHANGELOG.md directly', () => {
    const entries = getAuthoritativeChangelog();
    expect(entries.length).toBe(155);

    // Latest entry should be v2.3.0
    const first = entries[0];
    expect(first.version).toBe('v2.3.0');
    expect(first.date).toBeTruthy();
    expect(first.title).toBeTruthy();
    expect(first.sections.length).toBeGreaterThan(0);

    // Oldest entry should be v1.0.0
    const last = entries[entries.length - 1];
    expect(last.version).toBe('v1.0.0');
    expect(last.title).toBeTruthy();
  });

  it('guarantees zero duplicate releases across all historical versions', () => {
    const entries = getAuthoritativeChangelog();
    const versionSet = new Set<string>();
    for (const entry of entries) {
      expect(versionSet.has(entry.version)).toBe(false);
      versionSet.add(entry.version);
      expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(entry.sections.length).toBeGreaterThan(0);
    }
    expect(versionSet.size).toBe(155);
  });

  it('verifies all 16 normalized releases are present with full structured sections', () => {
    const entries = getAuthoritativeChangelog();
    const versions = entries.map((e) => e.version);

    const normalized16 = [
      'v1.9.5', 'v1.9.4', 'v1.9.1', 'v1.9.0', 'v1.8.10',
      'v1.8.9', 'v1.8.8', 'v1.8.7', 'v1.8.6', 'v1.8.5',
      'v1.8.1', 'v1.4.10', 'v1.4.9', 'v1.3.8', 'v1.3.7', 'v1.3.6',
    ];

    for (const v of normalized16) {
      expect(versions).toContain(v);
      const entry = entries.find((e) => e.version === v);
      expect(entry).toBeDefined();
      expect(entry?.sections.length).toBeGreaterThan(0);
    }
  });

  it('correctly parses complex Markdown headers and sub-sections', () => {
    const sample = `
# FSOS CHANGELOG

## v1.3.1 — IN-APP CHANGELOG SYNCHRONIZATION (2026-09-05)

### Core Changes
- **Single Source of Truth**: Replaced static array with direct CHANGELOG.md parsing.
  - Nested point: 100% fidelity.

### Verification
- Tested parser against all entries.
`;
    const entries = parseChangelog(sample);
    expect(entries.length).toBe(1);
    expect(entries[0].version).toBe('v1.3.1');
    expect(entries[0].title).toBe('IN-APP CHANGELOG SYNCHRONIZATION');
    expect(entries[0].date).toBe('2026-09-05');
    expect(entries[0].sections.length).toBe(2);
    expect(entries[0].sections[0].heading).toBe('Core Changes');
    expect(entries[0].sections[0].items.length).toBe(2);
    expect(entries[0].sections[1].heading).toBe('Verification');
  });

  it('contains historical standardized entries across milestone ranges', () => {
    const entries = getAuthoritativeChangelog();
    const versions = entries.map((e) => e.version);

    expect(versions).toContain('v2.3.0');
    expect(versions).toContain('v2.2.10');
    expect(versions).toContain('v2.0.0');
    expect(versions).toContain('v1.10.10');
    expect(versions).toContain('v1.10.8');
    expect(versions).toContain('v1.10.7');
    expect(versions).toContain('v1.9.9');
    expect(versions).toContain('v1.9.8');
    expect(versions).toContain('v1.9.3');
    expect(versions).toContain('v1.8.4');
    expect(versions).toContain('v1.6.10');
    expect(versions).toContain('v1.4.9');
    expect(versions).toContain('v1.3.5');
    expect(versions).toContain('v1.2.8');
    expect(versions).toContain('v1.0.0');
  });
});
