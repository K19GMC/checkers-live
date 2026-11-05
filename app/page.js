'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '../components/Avatar.js';
import { AVATARS } from '../lib/social.js';

export default function Home() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0].id);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function host() {
    setBusy(true); setErr('');
    try {
      const d = await (await fetch('/api/t', { method: 'POST' })).json();
      if (d.error) return setErr(d.error);
      localStorage.setItem('host:' + d.pin, d.hostToken);
      router.push('/room/' + d.pin);
    } catch { setErr('Could not create the game. Try again.'); }
    finally { setBusy(false); }
  }
  async function join() {
    setBusy(true); setErr('');
    try {
      const code = pin.trim();
      const res = await fetch('/api/t/' + code, { method: 'POST', body: JSON.stringify({ action: 'join', nickname: name, avatar }) });
      const d = await res.json();
      if (d.error) return setErr(d.error);
      localStorage.setItem('p:' + code, d.token);
      router.push('/room/' + code);
    } catch { setErr('Could not join the game. Try again.'); }
    finally { setBusy(false); }
  }
  return (
    <main className="c">
      <h1>Checkers Live</h1>
      <p>Knockout tournament. Win your game or you're out.</p>
      <div className="card">
        <input inputMode="numeric" placeholder="Game PIN" value={pin} onChange={e => setPin(e.target.value)} aria-label="Game PIN" />
        <input placeholder="Nickname" maxLength={16} value={name} onChange={e => setName(e.target.value)} aria-label="Nickname" />
        <fieldset className="avatar-picker">
          <legend>Choose your avatar</legend>
          <div className="avatar-options">
            {AVATARS.map(a => <button type="button" key={a.id} className={avatar === a.id ? 'selected' : ''} aria-label={`Choose ${a.name}`} aria-pressed={avatar === a.id} onClick={() => setAvatar(a.id)}><Avatar avatar={a.id} /></button>)}
          </div>
        </fieldset>
        {err && <div className="err" role="alert">{err}</div>}
        <button className="go" onClick={join} disabled={!pin.trim() || !name.trim() || busy}>{busy ? 'Please wait…' : 'Join game'}</button>
      </div>
      <button className="host" onClick={host} disabled={busy}>Host a new game</button>
    </main>
  );
}
