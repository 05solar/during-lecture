// Minimal 19×19 Go rules engine for the tsumego solver/board — captures, suicide
// prevention, and ko, nothing else (no AI, no scoring). Kept separate from
// GoGame/go.ts (which is fixed at 9×9 for the playable Go game + its MCTS AI) so a
// bigger local-reading board for tsumego can't affect that game. Real classical
// diagrams are authored for a 19×19 board; using the same size here means their
// coordinates can be used as-is, with no cropping/translation that could clip off
// part of a position's true boundary.

export const N = 19;
export const SZ = N * N;
export type Color = 1 | 2; // 1=흑, 2=백
export const PASS = -1;

export interface GoState {
  board: Int8Array; // 0=빈점, 1=흑, 2=백
  ko: number; // 패로 인해 금지된 점 (없으면 -1)
  toMove: Color;
  passes: number;
  capB: number;
  capW: number;
}

const NEI: number[][] = [];
for (let r = 0; r < N; r++) {
  for (let c = 0; c < N; c++) {
    const idx = r * N + c;
    const nb: number[] = [];
    if (r > 0) nb.push(idx - N);
    if (r < N - 1) nb.push(idx + N);
    if (c > 0) nb.push(idx - 1);
    if (c < N - 1) nb.push(idx + 1);
    NEI[idx] = nb;
  }
}

export function emptyState(): GoState {
  return { board: new Int8Array(SZ), ko: -1, toMove: 1, passes: 0, capB: 0, capW: 0 };
}

const gSeen = new Int32Array(SZ);
let gGen = 0;
const gStack = new Int32Array(SZ);
const gGroup = new Int32Array(SZ);

function hasLiberty(board: Int8Array, idx: number): boolean {
  const color = board[idx];
  gGen++;
  let sp = 0;
  gStack[sp++] = idx;
  gSeen[idx] = gGen;
  while (sp > 0) {
    const cur = gStack[--sp];
    const ns = NEI[cur];
    for (let i = 0; i < ns.length; i++) {
      const n = ns[i];
      const v = board[n];
      if (v === 0) return true;
      if (v === color && gSeen[n] !== gGen) {
        gSeen[n] = gGen;
        gStack[sp++] = n;
      }
    }
  }
  return false;
}

function collectGroup(board: Int8Array, idx: number): number {
  const color = board[idx];
  gGen++;
  let sp = 0;
  gStack[sp++] = idx;
  gSeen[idx] = gGen;
  let c = 0;
  while (sp > 0) {
    const cur = gStack[--sp];
    gGroup[c++] = cur;
    const ns = NEI[cur];
    for (let i = 0; i < ns.length; i++) {
      const n = ns[i];
      if (board[n] === color && gSeen[n] !== gGen) {
        gSeen[n] = gGen;
        gStack[sp++] = n;
      }
    }
  }
  return c;
}

export function play(s: GoState, move: number): { state: GoState; captured: number } | null {
  if (move === PASS) {
    return {
      state: { board: s.board, ko: -1, toMove: (3 - s.toMove) as Color, passes: s.passes + 1, capB: s.capB, capW: s.capW },
      captured: 0,
    };
  }
  const { board, ko, toMove } = s;
  if (move < 0 || move >= SZ || board[move] !== 0) return null;
  if (move === ko) return null;
  const nb = board.slice();
  nb[move] = toMove;
  const opp = (3 - toMove) as Color;
  let capCount = 0;
  let oneCapPt = -1;
  const ns = NEI[move];
  for (let i = 0; i < ns.length; i++) {
    const n = ns[i];
    if (nb[n] === opp && !hasLiberty(nb, n)) {
      const c = collectGroup(nb, n);
      for (let k = 0; k < c; k++) nb[gGroup[k]] = 0;
      if (c === 1) oneCapPt = gGroup[0];
      capCount += c;
    }
  }
  if (!hasLiberty(nb, move)) return null;
  let newKo = -1;
  if (capCount === 1) {
    let ownAdj = false;
    let libs = 0;
    for (let i = 0; i < ns.length; i++) {
      const v = nb[ns[i]];
      if (v === toMove) ownAdj = true;
      else if (v === 0) libs++;
    }
    if (!ownAdj && libs === 1) newKo = oneCapPt;
  }
  return {
    state: {
      board: nb,
      ko: newKo,
      toMove: opp,
      passes: 0,
      capB: s.capB + (toMove === 1 ? capCount : 0),
      capW: s.capW + (toMove === 2 ? capCount : 0),
    },
    captured: capCount,
  };
}

export const toIdx = (r: number, c: number) => r * N + c;
export const rc = (idx: number): [number, number] => [Math.floor(idx / N), idx % N];
