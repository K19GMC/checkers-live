'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Avatar from '../components/Avatar.js';
import AvatarCamera from '../components/AvatarCamera.js';
import { useEntrance } from '../components/Motion.js';
import { isPhotoAvatar } from '../lib/social.js';

const BAND_TERMS = [
  'Knockout bracket',
  '45 seconds a move',
  '6 minutes a round',
  'Bye when the field is odd',
  'Kings on the far row',
  'Captures suggested, not required',
  'Losers out',
  'Last player takes the board',
];

const miniCells = [];
for (let r = 0; r < 8; r += 1) {
  for (let c = 0; c < 8; c += 1) {
    const dark = (r + c) % 2 === 1;
    const piece = dark && (r < 2 || r > 5);
    miniCells.push({
      key: r + '-' + c,
      className: (dark ? 'd' : 'l') + (piece ? (r < 2 ? ' p r' : ' p') : ''),
    });
  }
}

export default function Home() {
  const router = useRouter();
  const rootRef = useRef(null);
  useEntrance(rootRef);
  const [pin, setPin] = useState('');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [paused, setPaused] = useState(false);
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
  async function join(e) {
    e?.preventDefault?.();
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
    <main className="page" ref={rootRef}>
      <div className="wrap">
        <header className="site-head">
          <Link href="/" className="brand">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
            Checkers Live
          </Link>
          <span className="head-note">Knockout · Live</span>
        </header>

        <section className="hero" data-enter>
          <h1>Live knockout checkers<span className="dot">.</span></h1>
          <p className="lead">
            Win your game or you&apos;re out. Every round pairs the field again until one player
            takes the board.
          </p>
        </section>

        <section className="band" aria-label="Tournament rules at a glance">
          <div className="band-row" data-paused={paused ? 'true' : 'false'}>
            <div className="band-track">
              {BAND_TERMS.concat(BAND_TERMS).map((term, i) => (
                <span
                  className="band-item"
                  key={term + i}
                  aria-hidden={i >= BAND_TERMS.length ? 'true' : undefined}
                >
                  {term}
                  <i aria-hidden="true" />
                </span>
              ))}
            </div>
          </div>
          <button
            type="button"
            className="band-pause"
            aria-pressed={paused}
            aria-label={paused ? 'Resume the rules ribbon' : 'Pause the rules ribbon'}
            onClick={() => setPaused(x => !x)}
          >
            {paused ? 'Play' : 'Pause'}
          </button>
        </section>

        <div className="home-grid">
          <section className="panel" aria-labelledby="join-title" data-enter>
            <div className="panel-head">
              <h2 id="join-title">Join a game</h2>
              <p>Enter the PIN from your host, or start a fresh tournament.</p>
            </div>

            <form onSubmit={join} noValidate>
              <div className="field">
                <label htmlFor="pin">Game PIN</label>
                <input
                  id="pin"
                  className="input pin-input"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="0000"
                  maxLength={12}
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                />
              </div>

              <div className="field">
                <label htmlFor="nickname">Nickname</label>
                <input
                  id="nickname"
                  className="input"
                  placeholder="How the bracket knows you"
                  autoComplete="nickname"
                  maxLength={16}
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>

              <fieldset className="avatar-field">
                <legend className="field-label">Your avatar</legend>
                <div className="avatar-row">
                  <Avatar name={displayName} avatar={avatar} />
                  <div className="avatar-copy">
                    <strong>{usingPhoto ? 'Camera photo' : 'Generated from your name'}</strong>
                    <span>{usingPhoto ? 'Tap below to retake' : `“${displayName || 'Player'}”`}</span>
                  </div>
                </div>
                <div className="avatar-actions">
                  <button type="button" className="btn btn--quiet" onClick={() => setCameraOpen(true)}>
                    {usingPhoto ? 'Retake photo' : 'Use camera'}
                  </button>
                  {usingPhoto && (
                    <button type="button" className="btn btn--ghost" onClick={() => setAvatar(null)}>
                      Use my name
                    </button>
                  )}
                </div>
              </fieldset>

              {err && <div className="err" role="alert">{err}</div>}

              <button type="submit" className="btn btn--primary btn--lg btn--block" style={{ marginTop: 18 }} disabled={!pin.trim() || !name.trim() || busy}>
                {busy ? 'Please wait…' : 'Join game'}
              </button>
            </form>

            <hr className="rule" style={{ margin: '18px 0' }} />

            <button type="button" className="btn btn--ghost btn--block" onClick={host} disabled={busy}>
              Host a new game
            </button>
          </section>

          <aside className="panel court" aria-labelledby="court-title" data-enter>
            <div className="panel-head">
              <h2 id="court-title">How a round runs</h2>
              <p>Four beats, six minutes a round, no second chances.</p>
            </div>
            <div className="mini-board" aria-hidden="true">
              {miniCells.map(cell => <i key={cell.key} className={cell.className} />)}
            </div>
            <div className="court-steps">
              <div className="step">
                <span className="step-n">01</span>
                <div><b>Join the PIN</b><span>Everyone in the room lands in the same bracket.</span></div>
              </div>
              <div className="step">
                <span className="step-n">02</span>
                <div><b>Get paired</b><span>A random opponent each round; the odd player sits safe.</span></div>
              </div>
              <div className="step">
                <span className="step-n">03</span>
                <div><b>Beat the clock</b><span>45 seconds a move, six minutes a round. Time out forfeits.</span></div>
              </div>
              <div className="step">
                <span className="step-n">04</span>
                <div><b>Survive</b><span>Losers are out. The last player standing wins.</span></div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <div className="wrap">
        <footer className="site-foot">
          <span>Checkers Live</span>
          <span>American checkers · 8×8 · kings on the far row</span>
        </footer>
      </div>

      {cameraOpen && <AvatarCamera onCapture={setAvatar} onClose={() => setCameraOpen(false)} />}
    </main>
  );
}