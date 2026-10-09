'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');

  async function host() {
    const d = await (await fetch('/api/t', { method: 'POST' })).json();
    localStorage.setItem('host:' + d.pin, d.hostToken);
    router.push('/room/' + d.pin);
  }
  async function join() {
    const res = await fetch('/api/t/' + pin.trim(), { method: 'POST', body: JSON.stringify({ action: 'join', nickname: name }) });
    const d = await res.json();
    if (d.error) return setErr(d.error);
    localStorage.setItem('p:' + pin.trim(), d.token);
    router.push('/room/' + pin.trim());
  }
  return (
    <main className="c">
      <h1>Checkers Live</h1>
      <p>Knockout tournament. Win your game or you're out.</p>
      <div className="card">
        <input inputMode="numeric" placeholder="Game PIN" value={pin} onChange={e => setPin(e.target.value)} aria-label="Game PIN" />
        <input placeholder="Nickname" maxLength={16} value={name} onChange={e => setName(e.target.value)} aria-label="Nickname" />
        {err && <div className="err">{err}</div>}
        <button className="go" onClick={join} disabled={!pin || !name}>Join game</button>
      </div>
      <button className="host" onClick={host}>Host a new game</button>
    </main>
  );
}
