export type TtsClueInput = {
  number: number;
  question: string;
  answer: string;
  explanation?: string;
};

export type PlacedClue = {
  number: number;
  question: string;
  answer: string;
  row: number;
  col: number;
  direction: "across" | "down";
  explanation: string;
};

export type TtsGridCell = {
  answer: string;
  number: number | null;
  active: boolean;
};

export type AutoPlaceResult = {
  placed: PlacedClue[];
  failed: TtsClueInput[];
  grid: TtsGridCell[][];
  rows: number;
  cols: number;
};

export function autoPlaceClues(clues: TtsClueInput[]): AutoPlaceResult {
  const allAnswers = new Map<string, Set<string>>();
  for (const c of clues) {
    const upper = c.answer.toUpperCase();
    for (const ch of upper) {
      if (!allAnswers.has(ch)) allAnswers.set(ch, new Set());
      allAnswers.get(ch)!.add(c.answer.toUpperCase());
    }
  }
  const sorted = [...clues].sort((a, b) => {
    const aLen = a.answer.length, bLen = b.answer.length;
    if (aLen !== bLen) return bLen - aLen;
    const aUpper = a.answer.toUpperCase();
    const bUpper = b.answer.toUpperCase();
    const aScore = [...new Set(aUpper)].reduce((s, ch) => s + ((allAnswers.get(ch)?.size ?? 1) - 1), 0);
    const bScore = [...new Set(bUpper)].reduce((s, ch) => s + ((allAnswers.get(ch)?.size ?? 1) - 1), 0);
    return bScore - aScore;
  });
  const maxSize = Math.max(50, sorted.reduce((s, c) => s + c.answer.length * 2, 0));
  const grid: string[][][] = Array.from({ length: maxSize }, () =>
    Array.from({ length: maxSize }, () => ["", ""])
  );
  const used: boolean[][] = Array.from({ length: maxSize }, () =>
    Array.from({ length: maxSize }, () => false)
  );

  const placed: PlacedClue[] = [];
  const failed: TtsClueInput[] = [];
  const clueOwner: number[][][] = Array.from({ length: maxSize }, () =>
    Array.from({ length: maxSize }, () => [])
  );

  function hasAdjacentConflict(
    row: number, col: number, dir: "across" | "down", answer: string
  ): boolean {
    const newClueCells: [number, number][] = [];
    for (let i = 0; i < answer.length; i++) {
      newClueCells.push([dir === "across" ? row : row + i, dir === "across" ? col + i : col]);
    }

    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [r, c] of newClueCells) {
      for (const [dr, dc] of dirs) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nr >= maxSize || nc < 0 || nc >= maxSize) continue;
        if (!used[nr][nc]) continue;

        const isOnPath = newClueCells.some(([cr, cc]) => cr === nr && cc === nc);
        if (isOnPath) continue;

        const neighborOwners = clueOwner[nr][nc];
        let sharesCrossing = false;
        for (const ownerId of neighborOwners) {
          for (const [cr, cc] of newClueCells) {
            if (clueOwner[cr][cc].includes(ownerId)) {
              sharesCrossing = true;
              break;
            }
          }
          if (sharesCrossing) break;
        }
        if (!sharesCrossing) return true;
      }
    }
    return false;
  }

  function canPlace(
    row: number, col: number, dir: "across" | "down", answer: string
  ): boolean {
    for (let i = 0; i < answer.length; i++) {
      const r = dir === "across" ? row : row + i;
      const c = dir === "across" ? col + i : col;
      if (r < 0 || r >= maxSize || c < 0 || c >= maxSize) return false;
      if (used[r][c] && grid[r][c][0] !== answer[i]) return false;
    }
    if (hasAdjacentConflict(row, col, dir, answer)) return false;
    return true;
  }

  function occupy(row: number, col: number, dir: "across" | "down", answer: string) {
    let ownerId = placed.length;
    for (let i = 0; i < answer.length; i++) {
      const r = dir === "across" ? row : row + i;
      const c = dir === "across" ? col + i : col;
      used[r][c] = true;
      grid[r][c][0] = answer[i];
      if (!clueOwner[r][c].includes(ownerId)) clueOwner[r][c].push(ownerId);
    }
  }

  function tryPlace(clue: TtsClueInput): boolean {
    const answer = clue.answer.toUpperCase();
    for (const existing of placed) {
      const eAns = existing.answer.toUpperCase();
      for (let ei = 0; ei < eAns.length; ei++) {
        const eChar = eAns[ei];
        for (let ai = 0; ai < answer.length; ai++) {
          if (answer[ai] !== eChar) continue;

          let r = 0, c = 0;
          let dir: "across" | "down" = "across";

          if (existing.direction === "across") {
            r = existing.row - ai;
            c = existing.col + ei;
            dir = "down";
          } else {
            r = existing.row + ei;
            c = existing.col - ai;
            dir = "across";
          }

          if (r < 0 || c < 0) continue;

          if (canPlace(r, c, dir, answer)) {
            occupy(r, c, dir, answer);
            placed.push({ number: clue.number, question: clue.question, answer, row: r, col: c, direction: dir, explanation: clue.explanation || "" });
            return true;
          }
        }
      }
    }
    return false;
  }

  let remaining = [...sorted];
  let changed = true;
  while (changed && remaining.length > 0) {
    changed = false;
    const next: TtsClueInput[] = [];
    for (const clue of remaining) {
      if (tryPlace(clue)) {
        changed = true;
      } else {
        next.push(clue);
      }
    }
    remaining = next;
  }

  if (placed.length === 0 && remaining.length > 0) {
    const first = remaining.shift()!;
    const ans = first.answer.toUpperCase();
    occupy(0, 0, "across", ans);
    placed.push({ number: first.number, question: first.question, answer: ans, row: 0, col: 0, direction: "across", explanation: first.explanation || "" });
    // retry remaining clues now that we have a placed clue
    changed = true;
    while (changed && remaining.length > 0) {
      changed = false;
      const next: TtsClueInput[] = [];
      for (const clue of remaining) {
        if (tryPlace(clue)) {
          changed = true;
        } else {
          next.push(clue);
        }
      }
      remaining = next;
    }
  }

  failed.push(...remaining);

  let minR = maxSize, maxR = 0, minC = maxSize, maxC = 0;
  for (let r = 0; r < maxSize; r++) {
    for (let c = 0; c < maxSize; c++) {
      if (used[r][c]) {
        if (r < minR) minR = r;
        if (r > maxR) maxR = r;
        if (c < minC) minC = c;
        if (c > maxC) maxC = c;
      }
    }
  }
  const pad = 3;
  minR = Math.max(0, minR - pad);
  maxR = Math.min(maxSize - 1, maxR + pad);
  minC = Math.max(0, minC - pad);
  maxC = Math.min(maxSize - 1, maxC + pad);
  const rows = maxR - minR + 1;
  const cols = maxC - minC + 1;

  const trimmedGrid: TtsGridCell[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({ answer: "", number: null, active: false }))
  );

  for (const clue of placed) {
    let r = clue.row - minR;
    let c = clue.col - minC;
    for (let i = 0; i < clue.answer.length; i++) {
      if (r >= 0 && r < rows && c >= 0 && c < cols) {
        trimmedGrid[r][c] = {
          answer: clue.answer[i],
          number: i === 0 ? clue.number : null,
          active: true,
        };
        if (clue.direction === "across") c++;
        else r++;
      }
    }
  }

  placed.sort((a, b) => a.number - b.number);

  return { placed, failed, grid: trimmedGrid, rows, cols };
}
