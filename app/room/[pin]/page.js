'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Board from '../../../components/Board.js';
import Avatar from '../../../components/Avatar.js';
import { EMOTES } from '../../../lib/social.js';

const post = (pin, body) => fetch('/api/t/' + pin, { method: 'POST', body: JSON.stringify(body) }).then(r => r.json());
const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

function PlayerBadge({ player, color, emote }) {
  return (
    <div className="player-badge">
      <div className="avatar-wrap">
        <Avatar avatar={player?.avatar} />
        {emote && <span className="emote-bubble" role="status" aria-label={`${player?.nickname} reacted ${emote}`}>{emote}</span>}
      </div>
      <div className="player-copy"><strong>{player?.nickname || 'Player'}</strong><span>{color}</span></div>
    </div>
  );
}

export default function Room() {
  const { pin } = useParams();
  const router = useRouter();
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

  if (!v) return <main className="c"><h1>Loading…</h1></main>;
  if (v.error) return <main className="c"><h1>Game not found</h1><Link href="/">Back to home</Link></main>;

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
    <main className="c"><img className="trophy" src="/trophy.png" alt="" width="447" height="447" /><Avatar avatar={player(v.champion)?.avatar} className="champion-avatar" /><h1>{nm(v.champion)}</h1><p>wins the tournament!</p>
      {v.me === v.champion && <p>That's you. Well played!</p>}<Link className="home-link" href="/">Play again</Link></main>
  );

  if (v.status === 'lobby') return (
    <main className="c">
      <p>Join with this PIN</p><div className="pin">{pin}</div>
      <div className="chips">{v.players.map(p => <span key={p.id} className="chip"><Avatar avatar={p.avatar} />{p.nickname}</span>)}</div>
      {v.isHost
        ? <button className="go" disabled={v.players.length < 2} onClick={() => post(pin, { action: 'start', token })}>
            {v.players.length < 2 ? 'Waiting for players…' : `Start with ${v.players.length} players`}</button>
        : me ? <p>You're in, {me.nickname}. Waiting for the host to start.</p> : <Link href="/">Join this game</Link>}
    </main>
  );

  if (v.isHost) return (
    <main className="c wide">
      <div className="bar"><span>Round {v.round}</span><span>{alive.length} players left</span><span>Round ends in {fmt(v.roundEndsAt - now)}</span></div>
      <div className="split">
        {featured && <Board game={featured.game} />}
        <ul className="bracket">
          {v.matches.map(m => (
            <li key={m.id} className={m.winner || m.draw ? 'done' : ''}>
              <span><b className={m.winner === m.white ? 'win' : m.winner ? 'out' : ''}>{nm(m.white)}</b> vs <b className={m.winner === m.black ? 'win' : m.winner ? 'out' : ''}>{nm(m.black)}</b></span>
              <span>{m.winner || m.draw ? m.game.reason : 'Playing'}</span>
            </li>
          ))}
          {v.players.filter(p => p.status === 'safe').map(p => <li key={p.id}><span>🛡️ {p.nickname}</span><span>Safe this round</span></li>)}
        </ul>
      </div>
    </main>
  );

  const mg = myMatch && !myMatch.winner && !myMatch.draw ? myMatch.game : null;
  const color = myMatch && myMatch.white === v.me ? 'w' : 'b';
  const opponent = myMatch ? player(color === 'w' ? myMatch.black : myMatch.white) : null;
  const emoteFor = id => [...(myMatch?.emotes || [])].reverse().find(e => e.playerId === id && now - e.at < 5000)?.symbol;
  return (
    <main className="c">
      <div className="bar"><span>Round {v.round}</span><span>{alive.length} left</span><span>Round timer {fmt(v.roundEndsAt - now)}</span></div>
      {mg ? <>
        <div className="match-players">
          <PlayerBadge player={me} color={color === 'w' ? 'White' : 'Red'} emote={emoteFor(v.me)} />
          <span className="versus">VS</span>
          <PlayerBadge player={opponent} color={color === 'w' ? 'Red' : 'White'} emote={emoteFor(opponent?.id)} />
        </div>
        <p className={'turn' + (mg.turn === color ? ' mine' : '')}>{mg.turn === color ? 'Your turn' : `${opponent?.nickname}'s turn`} · {fmt(mg.deadline - now)}</p>
        <Board game={mg} flip={color === 'b'} canMove={mg.turn === color && !busy} onMove={move} />
        <div className="match-actions">
          <button type="button" className="emote-toggle" aria-expanded={emotesOpen} aria-controls="emote-picker" onClick={() => setEmotesOpen(x => !x)}>☺ Emotes</button>
          <button type="button" className="leave" onClick={() => setLeaveOpen(true)}>Leave match</button>
        </div>
        {emotesOpen && <div id="emote-picker" className="emote-picker" aria-label="Send an emote">
          {EMOTES.map(symbol => <button type="button" key={symbol} disabled={busy} aria-label={`Send ${symbol}`} onClick={async () => { if (await act({ action: 'emote', symbol })) setEmotesOpen(false); }}>{symbol}</button>)}
        </div>}
      </> : myMatch?.draw ? <div className="msg">Time’s up — you both advance!<span>Next round starts when the other games finish.</span></div>
        : me?.status === 'safe' ? <div className="msg">🛡️ You're safe this round. Sit tight!</div>
        : me?.status === 'eliminated' ? <><div className="msg">You're out. Watch the rest!</div>{featured && <Board game={featured.game} />}</>
        : me ? <div className="msg">You won! Next round starting…</div>
        : featured && <Board game={featured.game} />}
      {actionErr && <p className="err" role="alert">{actionErr}</p>}
      {leaveOpen && <div className="modal-backdrop" onClick={() => setLeaveOpen(false)}>
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="leave-title" onClick={e => e.stopPropagation()}>
          <h2 id="leave-title">Leave this match?</h2>
          <p>Your opponent will win this game, and you’ll be eliminated from the tournament.</p>
          <div className="modal-actions"><button type="button" autoFocus onClick={() => setLeaveOpen(false)}>Stay in match</button><button type="button" className="leave" disabled={busy} onClick={confirmLeave}>{busy ? 'Leaving…' : 'Leave & forfeit'}</button></div>
        </div>
      </div>}
    </main>
  );
}
