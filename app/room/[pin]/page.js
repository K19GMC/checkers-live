'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Board from '../../../components/Board.js';

const post = (pin, body) => fetch('/api/t/' + pin, { method: 'POST', body: JSON.stringify(body) }).then(r => r.json());
const fmt = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

export default function Room() {
  const { pin } = useParams();
  const [token, setToken] = useState(null);
  const [v, setV] = useState(null);
  const [skew, setSkew] = useState(0);
  const [n, setN] = useState(0);
  const [, setBeat] = useState(0);

  useEffect(() => { setToken(localStorage.getItem('host:' + pin) || localStorage.getItem('p:' + pin) || ''); }, [pin]);
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

  if (!v) return <main className="c"><h1>Loading…</h1></main>;
  if (v.error) return <main className="c"><h1>Game not found</h1><Link href="/">Back to home</Link></main>;

  const now = Date.now() + skew;
  const nm = id => v.players.find(p => p.id === id)?.nickname ?? '?';
  const alive = v.players.filter(p => p.status !== 'eliminated');
  const me = v.players.find(p => p.id === v.me);
  const myMatch = v.matches.find(m => m.white === v.me || m.black === v.me);
  const featured = v.matches.find(m => !m.winner) || v.matches[0];
  const move = (from, to) => post(pin, { action: 'move', token, from, to }).then(() => setN(x => x + 1));

  if (v.status === 'done') return (
    <main className="c"><div className="trophy">🏆</div><h1>{nm(v.champion)}</h1><p>wins the tournament!</p>
      {v.me === v.champion && <p>That's you. Well played!</p>}<Link href="/">Play again</Link></main>
  );

  if (v.status === 'lobby') return (
    <main className="c">
      <p>Join with this PIN</p><div className="pin">{pin}</div>
      <div className="chips">{v.players.map(p => <span key={p.id} className="chip">{p.nickname}</span>)}</div>
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
            <li key={m.id} className={m.winner ? 'done' : ''}>
              <span><b className={m.winner === m.white ? 'win' : m.winner ? 'out' : ''}>{nm(m.white)}</b> vs <b className={m.winner === m.black ? 'win' : m.winner ? 'out' : ''}>{nm(m.black)}</b></span>
              <span>{m.winner ? m.game.reason : 'Playing'}</span>
            </li>
          ))}
          {v.players.filter(p => p.status === 'safe').map(p => <li key={p.id}><span>🛡️ {p.nickname}</span><span>Safe this round</span></li>)}
        </ul>
      </div>
    </main>
  );

  const mg = myMatch && !myMatch.winner ? myMatch.game : null;
  const color = myMatch && myMatch.white === v.me ? 'w' : 'b';
  const opp = myMatch ? nm(color === 'w' ? myMatch.black : myMatch.white) : '';
  return (
    <main className="c">
      <div className="bar"><span>Round {v.round}</span><span>{alive.length} left</span></div>
      {mg ? <>
        <p className={'turn' + (mg.turn === color ? ' mine' : '')}>{mg.turn === color ? 'Your turn' : `${opp}'s turn`} · {fmt(mg.deadline - now)}</p>
        <Board game={mg} flip={color === 'b'} canMove={mg.turn === color} onMove={move} />
        <p>You are {color === 'w' ? 'White' : 'Red'} vs {opp}</p>
      </> : me?.status === 'safe' ? <div className="msg">🛡️ You're safe this round. Sit tight!</div>
        : me?.status === 'eliminated' ? <><div className="msg">You're out. Watch the rest!</div>{featured && <Board game={featured.game} />}</>
        : me ? <div className="msg">You won! Next round starting…</div>
        : featured && <Board game={featured.game} />}
    </main>
  );
}
