import { createTournament } from '../../../lib/tournament.js';
import { load, save } from '../../../lib/store.js';
export const dynamic = 'force-dynamic';

export async function POST() {
  let pin;
  do pin = String(Math.floor(100000 + Math.random() * 900000)); while (await load(pin));
  const t = createTournament(pin);
  await save(t);
  return Response.json({ pin, hostToken: t.hostToken });
}
