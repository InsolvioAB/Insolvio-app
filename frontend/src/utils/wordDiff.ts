// Ordnivå-jämförelse mellan gammal och ny lydelse (EJU-90).
// Returnerar två listor med segment: ett för den gamla texten (same/removed)
// och ett för den nya texten (same/added), så att jämför-vyn kan markera
// borttagen text (genomstruken) och tillagd text (fetstil + grön markering).

export type DiffSegment = { text: string; changed: boolean };

const TOKEN = /\s+|[A-Za-z0-9À-ÿ]+|[^\sA-Za-z0-9À-ÿ]/g;

function tokenize(text: string): string[] {
  return text.match(TOKEN) ?? [];
}

function merge(tokens: string[], changed: boolean[]): DiffSegment[] {
  // Ett mellanslag mellan två ändrade ord räknas som ändrat, så att
  // markeringen blir en sammanhängande remsa.
  const flags = changed.slice();
  for (let i = 1; i < tokens.length - 1; i++) {
    if (/^\s+$/.test(tokens[i]) && !flags[i] && flags[i - 1] && flags[i + 1]) {
      flags[i] = true;
    }
  }
  const out: DiffSegment[] = [];
  tokens.forEach((t, i) => {
    const last = out[out.length - 1];
    if (last && last.changed === flags[i]) last.text += t;
    else out.push({ text: t, changed: flags[i] });
  });
  return out;
}

export function diffWords(
  oldText: string,
  newText: string
): { oldSegments: DiffSegment[]; newSegments: DiffSegment[] } {
  const a = tokenize(oldText);
  const b = tokenize(newText);
  const n = a.length;
  const m = b.length;

  // LCS-tabell
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }

  const aChanged = new Array(n).fill(true);
  const bChanged = new Array(m).fill(true);
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      aChanged[i] = false;
      bChanged[j] = false;
      i++;
      j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }

  return { oldSegments: merge(a, aChanged), newSegments: merge(b, bChanged) };
}
