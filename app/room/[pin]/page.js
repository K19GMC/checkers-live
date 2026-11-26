'use client';
import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Board from '../../../components/Board.js';
import Avatar from '../../../components/Avatar.js';
import { useEntrance } from '../../../components/Motion.js';
import { EMOTES } from '../../../lib/social.js';

const post = (pin, body) => fetch('/api/t/' + pin, { method: 'POST', body: JSON.stringify(body) }).then(r => r.json());
const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

function Footer() {
  return (
    <div className="wrap">
      <footer className="site-foot">
        <span>Checkers Live</span>
        <span>45s a move · 6 min a round · losers out</span>
      </footer>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/" className="brand">
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
      Checkers Live
    </Link>
  );
}

function Stats({ v, alive, now }) {
  return (
    <div className="stats">
      <span className="stat"><span className="stat-k">Round</span><span className="stat-v">{v.round}</span></span>
      <span className="stat"><span className="stat-k">Left</span><span className="stat-v">{alive.length}</span></span>
      <span className="stat stat--alert"><span className="stat-k">Round timer</span><span className="stat-v">{fmt(v.roundEndsAt - now)}</span></span>
    </div>
  );
}

function PlayerBadge({ player, color, emote, active, right }) {
  return (
    <div className={'player' + (right ? ' player--right' : '') + (active ? ' player--active' : '')}>
      <div className="avatar-wrap">
        <Avatar name={player?.nickname} avatar={player?.avatar} />
        {emote && <span className="emote-bubble" role="status" aria-label={`${player?.nickname} reacted ${emote}`}>{emote}</span>}
      </div>
      <div className="player-copy"><strong>{player?.nickname || 'Player'}</strong><span>{color}</span></div>
    </div>
  );
}

export default function Room() {
  const { pin } = useParams();
  const router = useRouter();
  const rootRef = useRef(null);
  useEntrance(rootRef);
  const [token, setToken] = useState(null);
  const [v, setV] = useState(null);
  const [skew, setSkew] = useState(0);
  const [n, setN] = useState(0);
  const [, setBeat] = useState(0);
  const [emotesOpen, setEmotesOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [actionErr, setActionErr] = useState('');
  const [busy, setBusy] = useState(false);

  // Per-tab tokens (sessionStorage) so a second tab on the same browser can be a
  // different player; localStorage host:<pin> is shared by every tab and would
  // otherwise make a joining tab resolve to the host token. localStorage is kept
  // as a fallback for sessions created before this change.
  useEffect(() => { setToken(
    sessionStorage.getItem('host:' + pin) || sessionStorage.getItem('p:' + pin) ||
    localStorage.getItem('p:' + pin) || localStorage.getItem('host:' + pin) || ''
  ); }, [pin]);
  useEffect(() => {
    if (token === null) return;
    let stop = false;
    const poll = async () => {
      try {
        const d = await (await fetch(`/api/t/${pin}?token=${token}`, { cache: 'no-store' })).json();
        if (!stop) { setV(d); if (d.now) setSkew(d.now - Date.now()); }
      } catch {}
    };
    poll();
    const a = setInterval(poll, 1200), b = setInterval(() => setBeat(x => x + 1), 500);
    return () => { stop = true; clearInterval(a); clearInterval(b); };
  }, [pin, token, n]);
  useEffect(() => {
    if (!leaveOpen) return;
    const close = e => { if (e.key === 'Escape') setLeaveOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [leaveOpen]);

  if (!v) return (
    <main className="page" ref={rootRef}>
      <div className="wrap"><div className="loading"><span className="dotline" aria-hidden="true"><i /><i /><i /></span> Joining the room…</div></div>
    </main>
  );

  if (v.error) return (
    <main className="page" ref={rootRef}>
      <div className="wrap">
        <header className="site-head"><Brand /><span className="head-note">Room</span></header>
        <section className="panel" style={{ marginTop: 48 }}>
          <div className="panel-head"><h2>Game not found</h2><p>That PIN is not a live tournament. Check the code and try again.</p></div>
          <Link className="btn btn--primary" href="/">Back to home</Link>
        </section>
      </div>
      <Footer />
    </main>
  );

  const now = Date.now() + skew;
  const player = id => v.players.find(p => p.id === id);
  const nm = id => player(id)?.nickname ?? '?';
  const alive = v.players.filter(p => p.status !== 'eliminated');
  const me = player(v.me);
  const myMatch = v.matches.find(m => m.white === v.me || m.black === v.me);
  const featured = v.matches.find(m => !m.winner && !m.draw) || v.matches[0];

  async function act(body) {
    setBusy(true); setActionErr('');
    try {
      const d = await post(pin, { ...body, token });
      if (d.error) { setActionErr(d.error); return false; }
      setN(x => x + 1);
      return true;
    } catch { setActionErr('Connection problem. Try again.'); return false; }
    finally { setBusy(false); }
  }
  const move = (from, to) => act({ action: 'move', from, to });
  async function confirmLeave() {
    if (await act({ action: 'leave' })) {
      sessionStorage.removeItem('p:' + pin);
      localStorage.removeItem('p:' + pin);
      router.push('/');
    }
  }

  if (v.status === 'done') return (
    <main className="page" ref={rootRef}>
      <div className="wrap">
        <section className="finish">
          <span className="tag">Champion</span>
          <img className="trophy" src="/trophy.png" alt="" width="447" height="447" />
          <div className="champion">
            <Avatar name={nm(v.champion)} avatar={player(v.champion)?.avatar} className="avatar-lg" />
            <h1>{nm(v.champion)}</h1>
          </div>
          <p className="lead">Takes the board and the tournament.</p>
          {v.me === v.champion && <p className="muted small">That&apos;s you. Well played.</p>}
          <div className="finish-actions">
            <Link className="btn btn--primary btn--lg" href="/">Play again</Link>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );

  if (v.status === 'lobby') return (
    <main className="page" ref={rootRef}>
      <header className="topbar">
        <div className="wrap topbar-inner">
          <Brand />
          <span className="stat"><span className="stat-k">Lobby</span><span className="stat-v">{v.players.length} in</span></span>
        </div>
      </header>
      <div className="wrap">
        <section className="lobby">
          <div className="pin-panel">
            <span className="eyebrow">Game PIN</span>
            <div className="pin-display">{pin}</div>
            <p className="muted small">Share this code. Everyone who enters it joins the bracket.</p>
          </div>

          <div className="chips" aria-label="Players in the room">
            {v.players.map(p => (
              <span key={p.id} className="chip"><Avatar name={p.nickname} avatar={p.avatar} />{p.nickname}</span>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {v.isHost
              ? <button className="btn btn--primary btn--lg" disabled={v.players.length < 2} onClick={() => post(pin, { action: 'start', token })}>
                  {v.players.length < 2 ? 'Waiting for players…' : `Start with ${v.players.length} players`}
                </button>
              : me
                ? <p className="muted small">You&apos;re in, {me.nickname}. The host starts the bracket.</p>
                : <Link className="btn btn--primary" href="/">Join this game</Link>}
          </div>
        </section>
      </div>
      <Footer />
    </main>
  );

  if (v.isHost) return (
    <main className="page" ref={rootRef}>
      <header className="topbar">
        <div className="wrap topbar-inner"><Brand /><Stats v={v} alive={alive} now={now} /></div>
      </header>
      <div className="wrap">
        <section className="match">
          <div className="match-main">
            <div className="match-tag">
              <span className="eyebrow">Featured board</span>
              <span className="mono small muted">{featured ? 'Live' : 'Waiting'}</span>
            </div>
            {featured && <Board game={featured.game} />}
          </div>
          <aside className="match-side panel">
            <p className="side-title">Bracket · round {v.round}</p>
            <ul className="bracket">
              {v.matches.map(m => (
                <li key={m.id} className={'bracket-item' + (m.winner || m.draw ? ' done' : '')}>
                  <span className="pair">
                    <b className={m.winner === m.white ? 'win' : m.winner ? 'out' : ''}>{nm(m.white)}</b>
                    <span className="vs">vs</span>
                    <b className={m.winner === m.black ? 'win' : m.winner ? 'out' : ''}>{nm(m.black)}</b>
                  </span>
                  <span className="reason">{m.winner || m.draw ? m.game.reason : 'Playing'}</span>
                </li>
              ))}
              {v.players.filter(p => p.status === 'safe').map(p => (
                <li key={p.id} className="bracket-item">
                  <span className="pair"><b>{p.nickname}</b></span>
                  <span className="reason">Safe this round</span>
                </li>
              ))}
            </ul>

            <p className="side-title" style={{ marginTop: 20 }}>Players</p>
            <ul className="bracket">
              {v.players.map(p => (
                <li key={p.id} className="bracket-item">
                  <span className="pair">
                    <Avatar name={p.nickname} avatar={p.avatar} className="avatar-sm" />
                    {p.nickname}
                  </span>
                  <span className="reason">
                    {p.status === 'playing' ? 'Playing'
                      : p.status === 'eliminated' ? 'Out'
                        : p.status === 'safe' ? 'Safe'
                          : p.status === 'champion' ? 'Champion' : 'In'}
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </div>
      <Footer />
    </main>
  );

  const mg = myMatch && !myMatch.winner && !myMatch.draw ? myMatch.game : null;
  const color = myMatch && myMatch.white === v.me ? 'w' : 'b';
  const opponent = myMatch ? player(color === 'w' ? myMatch.black : myMatch.white) : null;
  const emoteFor = id => [...(myMatch?.emotes || [])].reverse().find(e => e.playerId === id && now - e.at < 5000)?.symbol;
  const myTurn = mg && mg.turn === color;

  return (
    <main className="page" ref={rootRef}>
      <header className="topbar">
        <div className="wrap topbar-inner"><Brand /><Stats v={v} alive={alive} now={now} /></div>
      </header>
      <div className="wrap">
        <section className="match">
          <div className="match-main">
            {mg ? (
              <>
                <div className="match-players">
                  <PlayerBadge player={me} color={color === 'w' ? 'White' : 'Red'} emote={emoteFor(v.me)} active={myTurn} />
                  <span className="versus">VS</span>
                  <PlayerBadge player={opponent} color={color === 'w' ? 'Red' : 'White'} emote={emoteFor(opponent?.id)} right active={!myTurn} />
                </div>
                <p className={'turn' + (myTurn ? ' mine' : '')}>
                  <strong>{myTurn ? 'Your turn' : `${opponent?.nickname || 'Opponent'}'s turn`}</strong>
                  <span className="turn-clock">{fmt(mg.deadline - now)}</span>
                </p>
                <Board game={mg} flip={color === 'b'} canMove={myTurn && !busy} onMove={move} />
                <div className="match-actions">
                  <button type="button" className="btn btn--quiet" aria-expanded={emotesOpen} aria-controls="emote-picker" onClick={() => setEmotesOpen(x => !x)}>☺ Emotes</button>
                  <button type="button" className="btn btn--danger" onClick={() => setLeaveOpen(true)}>Leave match</button>
                </div>
                {emotesOpen && (
                  <div id="emote-picker" className="emote-picker" aria-label="Send an emote">
                    {EMOTES.map(symbol => (
                      <button type="button" key={symbol} disabled={busy} aria-label={`Send ${symbol}`} onClick={async () => { if (await act({ action: 'emote', symbol })) setEmotesOpen(false); }}>{symbol}</button>
                    ))}
                  </div>
                )}
              </>
            ) : myMatch?.draw ? (
              <div className="msg msg--win">Time&apos;s up — you both advance!<span>Next round starts when the other games finish.</span></div>
            ) : me?.status === 'safe' ? (
              <div className="msg">You&apos;re safe this round.<span>No game for you — sit tight and watch the board.</span></div>
            ) : me?.status === 'eliminated' ? (
              <><div className="msg">You&apos;re out.<span>Watch the rest of the bracket play out.</span></div>{featured && <Board game={featured.game} />}</>
            ) : me ? (
              <div className="msg msg--win">You won!<span>Next round starts once the bracket clears.</span></div>
            ) : (
              featured && <Board game={featured.game} />
            )}
            {actionErr && <p className="err" role="alert">{actionErr}</p>}
          </div>

          <aside className="match-side panel">
            <p className="side-title">This round</p>
            <dl style={{ margin: 0 }}>
              <div className="kv"><dt>Round</dt><dd>{v.round}</dd></div>
              <div className="kv"><dt>Players left</dt><dd>{alive.length}</dd></div>
              <div className="kv"><dt>Round timer</dt><dd>{fmt(v.roundEndsAt - now)}</dd></div>
              <div className="kv"><dt>Move timer</dt><dd>{mg ? fmt(mg.deadline - now) : '—'}</dd></div>
            </dl>
            <p className="muted small" style={{ marginTop: 16 }}>
              Losers are out. A round timeout is a draw and both players advance.
            </p>
          </aside>
        </section>
      </div>
      <Footer />

      {leaveOpen && (
        <div className="modal-backdrop" onClick={() => setLeaveOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="leave-title" onClick={e => e.stopPropagation()}>
            <h2 id="leave-title">Leave this match?</h2>
            <p>Your opponent will win this game, and you&apos;ll be eliminated from the tournament.</p>
            <div className="modal-actions">
              <button type="button" className="btn btn--quiet" autoFocus onClick={() => setLeaveOpen(false)}>Stay in match</button>
              <button type="button" className="btn btn--danger" disabled={busy} onClick={confirmLeave}>{busy ? 'Leaving…' : 'Leave & forfeit'}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}