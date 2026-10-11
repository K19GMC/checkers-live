import { Redis } from '@upstash/redis';

// Uses Upstash Redis when its env vars exist (Vercel); otherwise an in-memory Map for local dev.
const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;
const mem = (globalThis.__checkersMem ||= new Map());
const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function load(pin) {
  if (redis) return (await redis.get(`t:${pin}`)) ?? null;
  const s = mem.get(pin); return s ? JSON.parse(s) : null;
}
export async function save(t) {
  if (redis) await redis.set(`t:${t.pin}`, t, { ex: 6 * 3600 });
  else mem.set(t.pin, JSON.stringify(t));
}

const hb = (globalThis.__checkersHb ||= new Map());
// Heartbeats: players check in on every poll; the server uses these to detect people who left.
export async function beat(pin, pid) {
  if (redis) await redis.set(`hb:${pin}:${pid}`, Date.now(), { ex: 120 });
  else hb.set(`${pin}:${pid}`, Date.now());
}
export async function seenMap(pin, ids) {
  if (!ids.length) return {};
  const vals = redis ? await redis.mget(...ids.map(i => `hb:${pin}:${i}`)) : ids.map(i => hb.get(`${pin}:${i}`));
  const out = {};
  ids.forEach((id, i) => { if (vals[i] != null) out[id] = Number(vals[i]); });
  return out;
}

// Load -> change -> save under a short lock so simultaneous moves don't overwrite each other.
export async function mutate(pin, fn) {
  const lock = `l:${pin}`;
  if (redis) {
    for (let n = 0; !(await redis.set(lock, 1, { nx: true, ex: 5 })); n++) {
      if (n > 60) return { error: 'Server busy, try again' };
      await sleep(40);
    }
  }
  try {
    const t = await load(pin);
    if (!t) return { error: 'Game not found' };
    const out = fn(t);
    if (out?.error) return { error: out.error };
    await save(t);
    return { t, out };
  } finally {
    if (redis) await redis.del(lock);
  }
}
