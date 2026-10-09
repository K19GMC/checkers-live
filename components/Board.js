'use client';
import { useState } from 'react';
import { legalMoves } from '../lib/checkers.js';

export default function Board({ game, flip = false, canMove = false, onMove }) {
  const [sel, setSel] = useState(null);
  const moves = canMove ? legalMoves(game) : [];
  const from = game.chain || sel;
  const targets = from ? moves.filter(m => m.from[0] === from[0] && m.from[1] === from[1]) : [];
  const movable = c => moves.some(m => m.from[0] === c[0] && m.from[1] === c[1]);

  function click(r, c) {
    if (targets.some(m => m.to[0] === r && m.to[1] === c)) { onMove(from, [r, c]); setSel(null); }
    else if (!game.chain) setSel(movable([r, c]) ? [r, c] : null);
  }
  const idx = [0, 1, 2, 3, 4, 5, 6, 7];
  const order = flip ? [...idx].reverse() : idx;
  return (
    <div className="board" role="grid" aria-label="Checkers board">
      {order.map(r => order.map(c => {
        const p = game.board[r][c];
        const isSel = from && from[0] === r && from[1] === c;
        const isTgt = targets.some(m => m.to[0] === r && m.to[1] === c);
        return (
          <div key={r + '-' + c} className={'sq' + ((r + c) % 2 ? ' d' : '') + (isSel ? ' sel' : '') + (isTgt ? ' tgt' : '')}
               onClick={() => click(r, c)}>
            {p && <div className={'pc ' + p.toLowerCase() + (movable([r, c]) ? ' can' : '')}>{p === p.toUpperCase() ? '♛' : ''}</div>}
          </div>
        );
      }))}
    </div>
  );
}
