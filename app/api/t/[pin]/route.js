import { join, start, move, tick, view } from '../../../../lib/tournament.js';
import { load, mutate } from '../../../../lib/store.js';
export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { pin } = await params;
  const token = new URL(req.url).searchParams.get('token') || '';
  let t = await load(pin);
  if (!t) return Response.json({ error: 'Game not found' }, { status: 404 });
  if (tick(structuredClone(t))) { // something is due (timeout, round end): apply it under the lock
    const r = await mutate(pin, t => { tick(t); });
    if (r.t) t = r.t;
  }
  return Response.json(view(t, token));
}

export async function POST(req, { params }) {
  const { pin } = await params;
  const b = await req.json();
  const r = await mutate(pin, t => {
    const now = Date.now();
    if (b.action === 'join') return join(t, b.nickname);
    if (b.action === 'start') return b.token === t.hostToken ? start(t, now) : { error: 'Only the host can start' };
    if (b.action === 'move') {
      const p = Object.values(t.players).find(p => p.token === b.token);
      return p ? move(t, p.id, b.from, b.to, now) : { error: 'Not a player' };
    }
    return { error: 'Unknown action' };
  });
  return r.error ? Response.json({ error: r.error }, { status: 400 }) : Response.json(r.out);
}
