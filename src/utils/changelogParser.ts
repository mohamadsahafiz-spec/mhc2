import changelogRaw from '../../CHANGELOG.md?raw';

export interface ChangelogSection {
  heading: string;
  items: string[];
}

export interface ChangelogEntry {
  version: string;
  title: string;
  date: string;
  headerLine: string;
  sections: ChangelogSection[];
  rawBody: string;
}

/**
 * Parses the authoritative CHANGELOG.md markdown content into structured entries.
 */
export function parseChangelog(markdownContent: string): ChangelogEntry[] {
  const chunks = markdownContent.split(/\n(?=##\s+)/g);
  const entries: ChangelogEntry[] = [];

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed.startsWith('## ')) continue;

    const lines = trimmed.split('\n');
    const headerLine = lines[0].replace(/^##\s+/, '').trim();

    // Match patterns:
    // v1.3.1 — TITLE (YYYY-MM-DD)
    // v0.9.0 Phase 2.1 — TITLE (YYYY-MM-DD)
    const headerMatch = headerLine.match(/^(v[^\s—–-]+(?:\s+Phase\s+[\d.]+)?)\s*[—–-]\s*(.*?)(?:\s*\(([^)]+)\))?$/);

    let version = '';
    let title = '';
    let date = '';

    if (headerMatch) {
      version = headerMatch[1].trim();
      title = headerMatch[2].trim();
      date = headerMatch[3] ? headerMatch[3].trim() : '';
    } else {
      const fallbackMatch = headerLine.match(/^(v\S+)\s*(.*)/);
      version = fallbackMatch ? fallbackMatch[1] : headerLine;
      title = fallbackMatch ? fallbackMatch[2] : '';
    }

    const bodyLines = lines.slice(1);
    const sections: ChangelogSection[] = [];
    let currentSection: ChangelogSection = { heading: '', items: [] };

    for (let i = 0; i < bodyLines.length; i++) {
      const line = bodyLines[i];
      if (line.startsWith('### ')) {
        if (currentSection.heading || currentSection.items.length > 0) {
          sections.push(currentSection);
        }
        currentSection = { heading: line.replace(/^###\s+/, '').trim(), items: [] };
      } else if (line.trim().length > 0) {
        currentSection.items.push(line);
      }
    }
    if (currentSection.heading || currentSection.items.length > 0) {
      sections.push(currentSection);
    }

    entries.push({
      version,
      title,
      date,
      headerLine,
      sections,
      rawBody: bodyLines.join('\n').trim(),
    });
  }

  return entries;
}

/**
 * Returns the single authoritative parsed Changelog derived directly from root CHANGELOG.md.
 */
export function getAuthoritativeChangelog(): ChangelogEntry[] {
  return parseChangelog(changelogRaw);
}
