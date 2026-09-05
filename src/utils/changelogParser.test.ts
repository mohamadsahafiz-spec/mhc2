import { describe, it, expect } from 'vitest';
import { getAuthoritativeChangelog, parseChangelog } from './changelogParser';

describe('Authoritative Changelog Parser', () => {
  it('loads and parses the root CHANGELOG.md directly', () => {
    const entries = getAuthoritativeChangelog();
    expect(entries.length).toBe(122);

    // Latest entry should be v1.4.1
    const first = entries[0];
    expect(first.version).toBe('v1.4.1');
    expect(first.date).toBeTruthy();
    expect(first.title).toBeTruthy();
    expect(first.sections.length).toBeGreaterThan(0);

    // Oldest entry should be v0.1.0
    const last = entries[entries.length - 1];
    expect(last.version).toBe('v0.1.0');
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
    expect(versionSet.size).toBe(122);
  });

  it('verifies all 16 normalized releases are present with full structured sections', () => {
    const entries = getAuthoritativeChangelog();
    const versions = entries.map((e) => e.version);

    const normalized16 = [
      'v1.2.7', 'v1.2.6', 'v1.2.3', 'v1.2.2', 'v1.2.1',
      'v1.1.21', 'v1.1.20', 'v1.1.19', 'v1.1.18', 'v1.1.17',
      'v1.1.12', 'v1.0.15', 'v1.0.14', 'v1.0.1', 'v1.0.0', 'v0.9.1',
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

  it('contains historical v1.2.11 and v1.3.0 entries', () => {
    const entries = getAuthoritativeChangelog();
    const versions = entries.map((e) => e.version);

    expect(versions).toContain('v1.3.1');
    expect(versions).toContain('v1.3.0');
    expect(versions).toContain('v1.2.11');
    expect(versions).toContain('v1.2.10');
    expect(versions).toContain('v1.2.5');
    expect(versions).toContain('v1.1.15');
    expect(versions).toContain('v1.0.37');
    expect(versions).toContain('v1.0.14');
    expect(versions).toContain('v0.9.0 Phase 2.1');
    expect(versions).toContain('v0.7.5');
    expect(versions).toContain('v0.1.0');
  });
});
