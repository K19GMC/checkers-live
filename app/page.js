'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Avatar from '../components/Avatar.js';
import AvatarCamera from '../components/AvatarCamera.js';
import { isPhotoAvatar } from '../lib/social.js';

export default function Home() {
  const router = useRouter();
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const usingPhoto = isPhotoAvatar(avatar);
  const displayName = name.trim();

  async function host() {
    setBusy(true); setErr('');
    try {
      const d = await (await fetch('/api/t', { method: 'POST' })).json();
      if (d.error) return setErr(d.error);
      sessionStorage.setItem('host:' + d.pin, d.hostToken);
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
      sessionStorage.setItem('p:' + code, d.token);
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
          <legend>Your avatar</legend>
          <div className="avatar-preview"><Avatar name={displayName} avatar={avatar} /></div>
          <p className="avatar-note">{usingPhoto ? 'Your camera photo' : `Generated from “${displayName || 'Player'}”`}</p>
          <div className="avatar-actions">
            <button type="button" className="camera-btn" onClick={() => setCameraOpen(true)}>{usingPhoto ? 'Retake photo' : 'Use camera'}</button>
            {usingPhoto && <button type="button" className="camera-btn" onClick={() => setAvatar(null)}>Use my name</button>}
          </div>
        </fieldset>
        {err && <div className="err" role="alert">{err}</div>}
        <button className="go" onClick={join} disabled={!pin.trim() || !name.trim() || busy}>{busy ? 'Please wait…' : 'Join game'}</button>
      </div>
      <button className="host" onClick={host} disabled={busy}>Host a new game</button>
      {cameraOpen && <AvatarCamera onCapture={setAvatar} onClose={() => setCameraOpen(false)} />}
    </main>
  );
}
