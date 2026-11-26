'use client';
import { useEffect, useRef, useState } from 'react';
import { legalMoves } from '../lib/checkers.js';

export default function Board({ game, flip = false, canMove = false, onMove }) {
  const [sel, setSel] = useState(null);
  const boardRef = useRef(null);
  const prevBoard = useRef(null);

  // When the board changes by exactly one move, land the moved piece.
  useEffect(() => {
    const before = prevBoard.current;
    prevBoard.current = game.board;
    if (!before) return undefined;
    let dest = null;
    let destCount = 0;
    let srcCount = 0;
    for (let r = 0; r < 8; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        const was = before[r][c];
        const now = game.board[r][c];
        if (!was && now) { dest = [r, c]; destCount += 1; }
        else if (was && !now) srcCount += 1;
      }
    }
    if (destCount !== 1 || srcCount > 2) return undefined;
    const el = boardRef.current?.querySelector(`[data-sq="${dest[0]}-${dest[1]}"] .pc`);
    if (!el) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const { gsap } = await import('gsap');
        if (cancelled) return;
        gsap.fromTo(
          el,
          { scale: 0.72, y: -6 },
          { scale: 1, y: 0, duration: 0.26, ease: 'power2.out', clearProps: 'transform' }
        );
      } catch {
        // The move already happened; the landing is optional.
      }
    })();
    return () => { cancelled = true; };
  }, [game.board]);

  const moves = canMove ? legalMoves(game) : [];
  const captures = moves.filter(m => m.cap);
  const from = canMove ? (game.chain || sel) : null;
  const targets = from ? moves.filter(m => m.from[0] === from[0] && m.from[1] === from[1]) : [];
  const movable = c => moves.some(m => m.from[0] === c[0] && m.from[1] === c[1]);
  const hasCaptureFrom = c => captures.some(m => m.from[0] === c[0] && m.from[1] === c[1]);

  function click(r, c) {
    if (targets.some(m => m.to[0] === r && m.to[1] === c)) { onMove(from, [r, c]); setSel(null); }
    else if (!game.chain) setSel(movable([r, c]) ? [r, c] : null);
  }

  const idx = [0, 1, 2, 3, 4, 5, 6, 7];
  const order = flip ? [...idx].reverse() : idx;

  return (
    <div className="board-wrap">
      {captures.length > 0 && (
        <p className="capture-tip" role="status">
          <strong>Capture available</strong>
          <span>Suggested, not required</span>
        </p>
      )}
      <div
        className="board"
        role="grid"
        aria-label="Checkers board"
        ref={boardRef}
        data-impeccable-ignore="hard-offset-shadow"
      >
        {order.map(r => order.map(c => {
          const p = game.board[r][c];
          const isSel = from && from[0] === r && from[1] === c;
          const isTgt = targets.some(m => m.to[0] === r && m.to[1] === c);
          const isCapTgt = targets.some(m => m.cap && m.to[0] === r && m.to[1] === c);
          const label = `${p ? (p.toLowerCase() === 'w' ? 'White' : 'Red') + (p === p.toUpperCase() ? ' king' : ' piece') : 'Empty'}, row ${r + 1}, column ${c + 1}${hasCaptureFrom([r, c]) ? ', capture available' : ''}`;
          const pieceClass = p
            ? 'pc ' + p.toLowerCase() + (p === p.toUpperCase() ? ' king' : '') + (movable([r, c]) ? ' can' : '')
            : '';
          return (
            <button
              type="button"
              key={r + '-' + c}
              data-sq={r + '-' + c}
              disabled={!canMove}
              aria-label={label}
              aria-pressed={isSel ? 'true' : undefined}
              className={'sq' + ((r + c) % 2 ? ' d' : '') + (isSel ? ' sel' : '') + (isTgt ? ' tgt' : '') + (isCapTgt ? ' cap-tgt' : '') + (hasCaptureFrom([r, c]) ? ' cap-source' : '')}
              onClick={() => click(r, c)}
            >
              {p && <span className={pieceClass}>{p === p.toUpperCase() ? '♛' : ''}</span>}
            </button>
          );
        }))}
      </div>
    </div>
  );
}