export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  lineNumber: number;
}

export interface Diff {
  original: string;
  modified: string;
  lines: DiffLine[];
}

export function generateDiff(original: string, modified: string): Diff {
  const originalLines = original.split('\n');
  const modifiedLines = modified.split('\n');

  // Simple line-by-line diff (can be enhanced with proper diff algorithm)
  const lines: DiffLine[] = [];
  let lineNumber = 0;

  const maxLength = Math.max(originalLines.length, modifiedLines.length);

  for (let i = 0; i < maxLength; i++) {
    const origLine = originalLines[i];
    const modLine = modifiedLines[i];

    if (origLine === modLine) {
      lines.push({
        type: 'unchanged',
        content: origLine || '',
        lineNumber: ++lineNumber,
      });
    } else {
      if (origLine !== undefined) {
        lines.push({
          type: 'removed',
          content: origLine,
          lineNumber: lineNumber,
        });
      }
      if (modLine !== undefined) {
        lines.push({
          type: 'added',
          content: modLine,
          lineNumber: ++lineNumber,
        });
      }
    }
  }

  return {
    original,
    modified,
    lines,
  };
}

export function getDiffSummary(diff: Diff): {
  added: number;
  removed: number;
  unchanged: number;
} {
  const summary = {
    added: 0,
    removed: 0,
    unchanged: 0,
  };

  for (const line of diff.lines) {
    summary[line.type]++;
  }

  return summary;
}

export function applyDiff(original: string, diff: DiffLine[]): string {
  const lines: string[] = [];

  for (const line of diff) {
    if (line.type === 'added' || line.type === 'unchanged') {
      lines.push(line.content);
    }
  }

  return lines.join('\n');
}
