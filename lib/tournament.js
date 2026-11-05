import { newGame, applyMove, finish } from './checkers.js';
import { EMOTES, normalizeAvatar } from './social.js';

export const ROUND_MS = 6 * 60 * 1000;
export const LEAVE_MS = 20000; // no check-in for this long = player has left
const rid = n => Math.random().toString(36).slice(2, 2 + n);
const shuffle = a => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export const createTournament = pin => ({ pin, hostToken: rid(16), status: 'lobby', round: 0, players: {}, matches: [], roundEndsAt: null, champion: null });

export function join(t, nickname, avatar) {
  if (t.status !== 'lobby') return { error: 'This game has already started' };
  const name = String(nickname || '').trim().slice(0, 16);
  if (!name) return { error: 'Enter a nickname' };
  if (Object.values(t.players).some(p => p.nickname.toLowerCase() === name.toLowerCase())) return { error: 'That nickname is taken' };
  const id = rid(5), token = rid(16);
  t.players[id] = { id, token, nickname: name, avatar: normalizeAvatar(avatar), status: 'lobby', hadBye: false, byeRound: 0 };
  return { id, token };
}

function startRound(t, now) {
  const active = Object.values(t.players).filter(p => p.status !== 'eliminated');
  if (active.length === 1) { t.status = 'done'; t.champion = active[0].id; active[0].status = 'champion'; return; }
  t.round++; t.matches = []; t.roundEndsAt = now + ROUND_MS;
  let pool = shuffle(active);
  if (pool.length % 2) { // odd count: one player is safe this round
    let c = pool.filter(p => !p.hadBye);
    if (!c.length) c = pool.filter(p => p.byeRound !== t.round - 1);
    if (!c.length) c = pool;
    const bye = c[0];
    bye.status = 'safe'; bye.hadBye = true; bye.byeRound = t.round;
    pool = pool.filter(p => p !== bye);
  }
  for (let i = 0; i < pool.length; i += 2) {
    pool[i].status = pool[i + 1].status = 'playing';
    t.matches.push({ id: rid(4), white: pool[i].id, black: pool[i + 1].id, winner: null, draw: false, emotes: [], game: newGame(pool[i].id, pool[i + 1].id, now) });
  }
}

export function start(t, now) {
  if (t.status !== 'lobby') return { error: 'Already started' };
  if (Object.keys(t.players).length < 2) return { error: 'Need at least 2 players' };
  t.status = 'running'; startRound(t, now);
  return { ok: true };
}

// Resolves timeouts, records results, eliminates losers and starts the next round.
// A round timeout is a draw: neither player is eliminated and both continue.
export function tick(t, now = Date.now(), seen = null) {
  if (t.status !== 'running') return false;
  let changed = false;
  for (const m of t.matches) {
    const g = m.game;
    if (m.winner || m.draw) continue;
    if (!g.winner && seen) { // forfeit if a player has stopped checking in
      const ls = id => seen[id] ?? g.started;
      const gone = [m.white, m.black].filter(id => now - ls(id) > LEAVE_MS);
      if (gone.length) {
        const loser = gone.length === 2 ? (ls(m.white) <= ls(m.black) ? m.white : m.black) : gone[0];
        finish(g, loser === m.white ? 'b' : 'w', 'Opponent left the game');
      }
    }
    if (!g.winner && now > t.roundEndsAt) finish(g, 'draw', 'Round time is up — both advance');
    else if (!g.winner && now > g.deadline) finish(g, g.turn === 'w' ? 'b' : 'w', 'Ran out of time');
    if (g.winner === 'draw') { m.draw = true; changed = true; }
    else if (g.winner) { m.winner = g.winner === 'w' ? m.white : m.black; changed = true; }
  }
  if (t.matches.length && t.matches.every(m => m.winner || m.draw)) {
    for (const m of t.matches) {
      if (!m.draw) t.players[m.winner === m.white ? m.black : m.white].status = 'eliminated';
    }
    startRound(t, now); changed = true;
  }
  return changed;
}

const activeMatch = (t, pid) => t.matches.find(m => !m.winner && !m.draw && (m.white === pid || m.black === pid));

export function move(t, pid, from, to, now) {
  const m = activeMatch(t, pid);
  if (!m) return { error: 'No active game' };
  if ((m.game.turn === 'w' ? m.white : m.black) !== pid) return { error: 'Not your turn' };
  const err = applyMove(m.game, from, to, now);
  if (err) return { error: err };
  tick(t, now);
  return { ok: true };
}

export function leave(t, pid, now = Date.now()) {
  const m = activeMatch(t, pid);
  if (!m) return { error: 'No active game' };
  const winner = m.white === pid ? 'b' : 'w';
  finish(m.game, winner, 'Opponent left the match');
  tick(t, now);
  return { ok: true };
}

export function emote(t, pid, symbol, now = Date.now()) {
  const m = activeMatch(t, pid);
  if (!m) return { error: 'No active game' };
  if (!EMOTES.includes(symbol)) return { error: 'Unknown emote' };
  m.emotes ||= [];
  const previous = m.emotes[m.emotes.length - 1];
  if (previous?.playerId === pid && now - previous.at < 600) return { error: 'Wait a moment before sending another emote' };
  m.emotes.push({ id: rid(8), playerId: pid, symbol, at: now });
  m.emotes = m.emotes.slice(-12);
  return { ok: true };
}

export const view = (t, token) => {
  const me = Object.values(t.players).find(p => p.token === token);
  return {
    pin: t.pin, status: t.status, round: t.round, roundEndsAt: t.roundEndsAt, champion: t.champion, now: Date.now(),
    isHost: token === t.hostToken, me: me ? me.id : null,
    players: Object.values(t.players).map(({ id, nickname, avatar, status }) => ({ id, nickname, avatar: normalizeAvatar(avatar), status })),
    matches: t.matches,
  };
};
