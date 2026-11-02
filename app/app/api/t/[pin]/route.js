import { join, start, move, leave, emote, tick, view } from '../../../../lib/tournament.js';
import { load, mutate, beat, seenMap } from '../../../../lib/store.js';
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { pin } = await params;
  const token = new URL(req.url).searchParams.get('token') || '';
  let t = await load(pin);
  if (!t) return Response.json({ error: 'Game not found' }, { status: 404 });
  let seen = null;
  if (t.status === 'running') {
    const me = Object.values(t.players).find(p => p.token === token);
    if (me) await beat(pin, me.id);
    seen = await seenMap(pin, t.matches.filter(m => !m.winner).flatMap(m => [m.white, m.black]));
  }
  if (tick(structuredClone(t), Date.now(), seen)) { // something is due (timeout, leaver, round end): apply under the lock
    const r = await mutate(pin, t => { tick(t, Date.now(), seen); });
    if (r.t) t = r.t;
  }
  return Response.json(view(t, token));
}

export async function POST(req, { params }) {
  const { pin } = await params;
  const b = await req.json();
  const r = await mutate(pin, t => {
    const now = Date.now();
    if (b.action === 'join') return join(t, b.nickname, b.avatar);
    if (b.action === 'start') return b.token === t.hostToken ? start(t, now) : { error: 'Only the host can start' };
    if (['move', 'leave', 'emote'].includes(b.action)) {
      const p = Object.values(t.players).find(p => p.token === b.token);
      if (!p) return { error: 'Not a player' };
      if (b.action === 'move') return move(t, p.id, b.from, b.to, now);
      if (b.action === 'leave') return leave(t, p.id, now);
      return emote(t, p.id, b.symbol, now);
    }
    return { error: 'Unknown action' };
  });
  return r.error ? Response.json({ error: r.error }, { status: 400 }) : Response.json(r.out);
}
