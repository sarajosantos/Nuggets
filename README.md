# Nuggets Adventure 📖

An AI-powered choose-your-own-adventure platform. Pick a scenario, create a character, and get a novella-style story written live by Claude — with three choices at the end of every chapter, plus the option to write your own action.

## How it works

- **Frontend** (`public/`) — vanilla HTML/CSS/JS. Three screens: scenario picker → character builder → story reader. Story text streams in word by word; progress is saved to `localStorage` so you can resume.
- **Backend** (`server.js`) — a small Express server that keeps the Anthropic API key server-side and streams chapters to the browser over Server-Sent Events. It's stateless: the client sends the full story history with each request.
- **Story engine** — a system prompt instructs Claude (`claude-opus-4-8`) to write 400–700 word chapters in second person, maintain continuity, end each chapter at a decision point, and emit exactly three choices in a machine-readable `<choices>[...]</choices>` tag. An empty array signals the story's ending.

## Running it

```bash
npm install
cp .env.example .env   # add your ANTHROPIC_API_KEY
npm start              # http://localhost:3000
```

No API key? The app automatically runs in **demo mode** with canned story content so you can preview the whole flow. Set `DEMO_MODE=1` to force it.

## Configuration

| Env var | Default | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | — | Enables live story generation |
| `STORY_MODEL` | `claude-opus-4-8` | Which Claude model narrates |
| `PORT` | `3000` | Server port |
| `DEMO_MODE` | auto | `1` forces canned demo content |

## Ideas for where to take it next

- **Accounts & story library** — save finished stories, share them by link
- **Illustrations** — generate a cover image per story
- **Stats & inventory** — have the model track items/health in structured output alongside prose
- **Text-to-speech** narration mode
- **Custom scenarios** — let players write their own premise
- **Cost controls** — per-user rate limiting before opening to the public
