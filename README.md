# Nuggets 📖

An AI-powered choose-your-own-adventure platform. Pick a scenario (or write your own), create a character, and get a novella-style story written live by Claude — with three choices at the end of every chapter, plus the option to write your own action.

## Features

- **Six built-in worlds + custom scenarios** — fantasy, sci-fi, murder mystery, gothic horror, western, Regency intrigue, or bring your own premise.
- **Streaming novella prose** — chapters stream in word by word over Server-Sent Events, typeset like a book (drop caps, running heads, asterism dividers).
- **A hidden "story director"** — the server injects private pacing directives each chapter (setup → escalation → midpoint reversal → convergence → climax) so stories arc properly instead of meandering, and a hard cap forces a finale if a story runs long. Players choose *how* events unfold; the director ensures they *do*.
- **State ledger & journal** — the model maintains hidden JSON state every chapter (title, act, condition, inventory, companions, open plot threads) and re-reads it for continuity. The Journal panel shows the player their condition, items, and companions.
- **Story library** — every story is saved locally; resume in-progress tales or re-read finished ones.
- **Share links** — publish a finished story to a read-only link (`/s/:id`) with its cover and full text.
- **Generated cover art** — Claude designs a minimalist SVG book cover per story (with a deterministic fallback).
- **Read aloud** — browser text-to-speech narration toggle.
- **Rate limiting** — per-IP hourly chapter cap for public deployments.
- **Demo mode** — with no API key, the app serves a canned three-chapter preview so the entire UI works out of the box.

## How it works

- **Frontend** (`public/`) — vanilla HTML/CSS/JS, no build step. A deliberate single dark theme ("the midnight reading room"): Cormorant Garamond display, Crimson Pro book prose, candle-gold accent.
- **Backend** (`server.js`) — Express. Keeps the Anthropic API key server-side, streams chapters from `claude-opus-4-8` (adaptive thinking), and stores shared stories in `data/stories.json` (swap for a real database when accounts land). Chapter generation is stateless: the client sends full history each turn.
- **Story protocol** — each model response is `prose + <state>{...}</state> + <choices>[...]</choices>`. An empty choices array signals the ending. Pacing notes ride as mid-conversation system messages on `claude-opus-4-8` (merged into the user turn on other models).

## Running it

```bash
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm start              # http://localhost:3000
```

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Enables live story generation |
| `STORY_MODEL` | `claude-opus-4-8` | Which Claude model narrates |
| `TARGET_CHAPTERS` | `10` | Target story length; finale forced by target + 4 |
| `RATE_LIMIT_PER_HOUR` | `40` | Max chapters per IP per hour |
| `PORT` | `3000` | Server port |
| `DEMO_MODE` | auto | `1` forces canned demo content |

## Roadmap

- **User accounts** — needs a hosting + database decision; the library is per-device until then, share links are already server-side
- **Raster cover art** via an image model, replacing SVG covers
- **Dice-style skill checks** driven by archetype/trait for mechanical depth
- **Cost dashboards** and per-user quotas before a public launch
