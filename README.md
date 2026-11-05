# Checkers Live

A real-time knockout checkers tournament you play in the browser. Join with a PIN, get paired each round, and win or you're out.

Built with Next.js 15, React 19, and Upstash Redis.

## Features

- **Live tournaments** — players are paired randomly each round; losers are eliminated.
- **Odd player out gets a bye** — one player sits out each round as "safe" when the count is odd.
- **Timed games** — 45 seconds per move, 6 minutes per round. Running out of time or leaving forfeits the game; a round timeout is a draw and both players advance.
- **Watch the bracket** — the host sees every match, the featured board, and who is left.
- **Emotes** — send a quick reaction to your opponent.
- **Avatar picker** — choose a numbered avatar or take a photo with your device camera.
- **Mobile friendly** — the board scales and flips for the red player.

## How to play

1. Open the app and enter a nickname.
2. Pick an avatar — a preset or a camera photo.
3. Enter the game PIN and join, or host a new game to get a PIN.
4. The host starts the tournament once at least two players have joined.
5. Make your moves before the timer runs out. Win your match to advance.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router) |
| UI | React 19, plain CSS |
| Storage | Upstash Redis (in-memory fallback for local dev) |
| Runtime | Node.js 20 |
| Packaging | Docker / Next.js standalone output |

## Getting started

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

### Production build

```bash
npm run build
npm start
```

`npm run build` also runs `scripts/package-standalone.mjs`, which copies the standalone server and static assets into `dist/` with `dist/boot.js` as the entry point.

## Configuration

Storage is optional for local development. Without it, game state lives in an in-memory `Map` inside the server process and is lost on restart — fine for a single local instance, not for serverless or multiple instances.

Set either pair of environment variables to use Upstash Redis:

```bash
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
# or the Vercel KV aliases
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
```

Games expire after 6 hours.

> **Camera note:** browsers only allow `getUserMedia` on secure origins. Camera avatars work on `localhost` and over HTTPS, but not over a plain-HTTP LAN address.

## Docker

```bash
docker build -t checkers-live .
docker run --rm -p 3000:3000 \
  -e UPSTASH_REDIS_REST_URL=... \
  -e UPSTASH_REDIS_REST_TOKEN=... \
  checkers-live
```

Then open <http://localhost:3000>.

## Project structure

```
app/
  page.js                 Join / host screen
  room/[pin]/page.js      Lobby, match, bracket, and results
  api/t/route.js          Create a tournament
  api/t/[pin]/route.js    Poll state and submit actions
components/
  Board.js                Checkers board and move selection
  Avatar.js               Preset and photo avatars
  AvatarCamera.js         Camera capture modal
lib/
  checkers.js             Board, legal moves, and game rules
  tournament.js           Rounds, pairing, byes, and forfeits
  social.js               Avatars and emotes
  store.js                Redis / in-memory persistence
scripts/
  package-standalone.mjs  Build the standalone distribution
```

## Rules

- American checkers on an 8×8 board; white moves first.
- Kings move and capture in all four diagonal directions.
- Captures are multi-hop: a jump that can continue must continue.
- Promotion happens when a piece reaches the far row.
- Captures are highlighted but optional (`FORCE_CAPTURES` in `lib/checkers.js` enables mandatory jumps).
- 40 quiet moves trigger a draw; the player with more pieces wins, ties are a coin flip.
