// American checkers: 8x8, mandatory captures, multi-jumps, kings. w moves up, b moves down.
export const MOVE_MS = 45000;
const DIRS = { w: [[-1, -1], [-1, 1]], b: [[1, -1], [1, 1]] };
const KING = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
const own = (p, c) => !!p && p.toLowerCase() === c;
const inB = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

export function newGame(white, black, now = Date.now()) {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null));
  for (let r = 0; r < 8; r++) for (let c = 0; c < 8; c++)
    if ((r + c) % 2 === 1) board[r][c] = r < 3 ? 'b' : r > 4 ? 'w' : null;
  return { board, turn: 'w', chain: null, white, black, winner: null, reason: null, quiet: 0, deadline: now + MOVE_MS };
}

function pieceMoves(board, r, c) {
  const p = board[r][c], out = [];
  for (const [dr, dc] of p === p.toUpperCase() ? KING : DIRS[p]) {
    const r1 = r + dr, c1 = c + dc;
    if (!inB(r1, c1)) continue;
    const t = board[r1][c1];
    if (!t) out.push({ from: [r, c], to: [r1, c1], cap: null });
    else if (t.toLowerCase() !== p.toLowerCase() && inB(r1 + dr, c1 + dc) && !board[r1 + dr][c1 + dc])
      out.push({ from: [r, c], to: [r1 + dr, c1 + dc], cap: [r1, c1] });
  }
  return out;
}

export function legalMoves(g) {
  if (g.winner) return [];
  const cells = [];
  if (g.chain) cells.push(g.chain);
  else g.board.forEach((row, r) => row.forEach((p, c) => own(p, g.turn) && cells.push([r, c])));
  const all = cells.flatMap(([r, c]) => pieceMoves(g.board, r, c));
  const jumps = all.filter(m => m.cap);
  return g.chain || jumps.length ? jumps : all;
}

export const count = (g, c) => g.board.flat().filter(p => own(p, c)).length;
export function finish(g, winner, reason) { g.winner = winner; g.reason = reason; g.chain = null; }
export function tiebreak(g, reason) {
  const w = count(g, 'w'), b = count(g, 'b');
  finish(g, w !== b ? (w > b ? 'w' : 'b') : Math.random() < 0.5 ? 'w' : 'b',
    reason + (w === b ? ' (coin flip)' : ' (decided by piece count)'));
}

// Applies one hop. Returns an error string, or null on success.
export function applyMove(g, from, to, now = Date.now()) {
  const m = legalMoves(g).find(m => m.from[0] === from[0] && m.from[1] === from[1] && m.to[0] === to[0] && m.to[1] === to[1]);
  if (!m) return 'Illegal move';
  const p = g.board[from[0]][from[1]], color = p.toLowerCase();
  let q = p;
  if (p === 'w' && to[0] === 0) q = 'W';
  if (p === 'b' && to[0] === 7) q = 'B';
  g.board[from[0]][from[1]] = null;
  if (m.cap) g.board[m.cap[0]][m.cap[1]] = null;
  g.board[to[0]][to[1]] = q;
  g.quiet = m.cap || p === color ? 0 : g.quiet + 1;
  g.chain = null;
  if (m.cap && q === p && pieceMoves(g.board, to[0], to[1]).some(x => x.cap)) g.chain = to;
  else g.turn = g.turn === 'w' ? 'b' : 'w';
  g.deadline = now + MOVE_MS;
  if (!g.chain && legalMoves(g).length === 0) finish(g, color, 'No moves left');
  else if (g.quiet >= 40) tiebreak(g, 'Draw');
  return null;
}
