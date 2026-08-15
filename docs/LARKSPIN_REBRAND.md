# Larkspin — redesign brief

Plotwick becomes **Larkspin**. This is not a wordmark swap: the name being
retired is the source of the product's entire visual metaphor *and* the name of
the thing we sell. This brief settles both, specifies the new identity, and lays
out a migration that touches no database.

A rendered version of this brief is published as an artifact; this file is the
canonical copy.

| | |
|---|---|
| Wordmark | Plotwick → Larkspin |
| Brand strings | 187 occurrences across 26 files |
| Database migrations | None needed |
| Blocking decisions | Six (see the last section) |

## The audit — what we are actually changing

Plotwick is an AI choose-your-own-adventure site. A reader picks one of six
worlds (or writes their own premise), builds a character, and Claude writes a
complete story live — three choices at the end of every chapter, plus a
free-text action. A hidden pacing director pushes each story through setup,
reversal, and climax so it actually ends. It is 18+, in founding-reader beta,
and sells complete stories rather than tokens.

The current identity is coherent and deliberate. `public/style.css` opens by
naming it: *"the midnight reading room — a single, deliberate dark world: warm
ink ground, candle-gold accent, book typography."* That is a real design
position, executed consistently: printer's ornaments, drop caps, running heads,
an asterism at the ending, book-plate cards, a "Publisher's ledger" for staff.

Which is the problem. The identity is not decorative — it is a candle in a dark
room, and the candle is **named in the brand**. So the rebrand splits cleanly.

### Survives intact — earned, and not the name's to take

- **Crimson Pro** for prose. The reading experience is the product; do not touch
  the face people read 8,000 words in.
- **The six world accents** — emerald, steel-cyan, claret, spectral violet,
  copper, rose. They make the shelf read as different books rather than one deck.
- **Dark-only.** Right for immersive reading, right for the genre mix, and the
  sharpest differentiator against every white chatbot UI.
- **The prose voice.** "Where will the next opening line find you?" is the best
  writing in the product.
- **Book typography** — drop caps, running heads, the asterism ending.

### Brand-locked — dies with the word "wick"

- **Candle gold** `#d9a648` as "the one accent". The accent's whole rationale was
  candlelight.
- **"Light a Wick →"**, the primary CTA on character creation.
- **"Wick"** as the unit of sale — 187 occurrences, and the subject of Decision 1.
- **The 📖 emoji favicon**, a data-URI placeholder that has outlived its excuse.
- **❦**, the fleuron header rule — printer's-shop solemnity Larkspin does not want.

## The name — what Larkspin licenses, and what it forbids

**Lark** is three things at once: a songbird that sings on the way up, the dawn
it sings at, and *a lark* — something undertaken for the joy of it. **Spin** is
two: to *spin a yarn*, and the turn or twist a story takes. Together the name
reads as *a story spun for the joy of it*, which is an unusually accurate
description of the product. Plotwick described the mechanism. Larkspin describes
the feeling.

There is a free association worth taking: **larkspur**, the tall blue-violet
delphinium. It hands us a secondary colour with a legitimate claim to the name.

The consequence is the part that matters. Larkspin is **outdoors, in air, at
first light**. Plotwick was **indoors, still, at midnight**. Every candle,
ink-well, and hushed-room cue in the current design belongs to the old name and
reads as inherited the moment the wordmark changes. The name does not merely
permit a new visual direction — it obsoletes the old one.

## Decision 1 — what replaces "Wick"

A story is currently called a **Wick**: a complete interactive story, one Wick
per story, opening to real ending. It is the unit of sale ($3.99 / $15 for five
/ $36 for fifteen), the unit of the free grant, the unit in the ledger, and the
noun in the primary CTA. It was derived from *Plot·wick*. Cut the parent and the
child is an orphan.

This has happened before, and the codebase kept the receipt. The ledger's
welcome-grant reason is still `welcome_novella`, frozen deliberately —
`supabase/schema.sql:59` explains that it is a stored enum in live rows, so
renaming it would orphan history and break reconciliation, and notes: *"The
reader-facing term is 'Wick'; this identifier is data, not copy."* Larkspin will
be the **third** name for this thing. The rule that survived the last rename is
the rule that should govern this one.

> **Recommendation: Yarn**, with **"Spin a Yarn →"** as the primary CTA.

It is the idiom the brand name is built from, so name and unit reinforce each
other instead of the unit dangling. It keeps the exact meaning "Wick" carried —
one complete told story, not a token or a chapter. And it finally supplies a
*verb*: Plotwick never had a good one, which is why the CTA had to strain for
"Light a Wick."

Alternatives considered:

- **Lark** — charming, but it connotes triviality. Wrong noun to hand someone
  entering gothic horror or a murder mystery.
- **Spin** — collides with loading states, and "a spin" sounds brief,
  undercutting the promise of a complete story with a real ending.
- **No branded unit** ("one story", "story credits") — clearest, and a defensible
  choice. But the branded unit does real work: it is how the packs, the ledger,
  and the pricing all communicate *you buy whole stories, not tokens*.
- **Known risk:** "yarn" is also a JavaScript package manager. Developer-facing
  only; no reader will collide with it.

One string in the set is weak and worth flagging rather than hiding: the header
button `Add Wicks` becomes `Add Yarns`, the least graceful plural in the rename.
"More yarns" or routing straight to "Yarn packs" are both better if the button
can carry a slightly longer label.

## Direction — "First Light"

**Keep the book. Change the hour.** Plotwick was read at midnight by candle.
Larkspin is read in the hour before dawn — when the sky already has colour but
the light has not arrived yet. Still dark, still warm, still a book. But
outdoors, with air in it, and a horizon.

This keeps everything the current design earned and re-grounds the one thing the
name took away. The ground moves from violet-black to a pre-dawn indigo with
real blue in it. The accent stops being a candle flame and becomes the first warm
light on the horizon — close enough to the old gold that founding readers feel
continuity, warm enough that the prose still reads like prose.

**The sunrise ramp** — apricot → rose → larkspur, the sky read left to right.
Reserved for the wordmark and nothing else, so it stays an event.

**The mark** — one continuous stroke that rises, turns once, and releases. A
lark's ascent and a length of spun thread are the same gesture, which is the
whole argument for the name in a single line. Geometric rather than
illustrative, so it holds at favicon size, and it replaces the 📖 emoji
data-URI currently doing that job.

## The system

### House palette

Replaces the `:root` block at the top of `public/style.css`. The discipline of
the current system — *one* house accent, with variety delegated to the world
accents — is correct and is preserved.

| Token | New | Was | Role |
|---|---|---|---|
| Pre-dawn | `#0E1220` | `#131017` | ground |
| Horizon | `#161C2E` | `#1e1826` | raised surface |
| Cloudbank | `#1E2540` | `#251d2f` | cards |
| Ivory | `#E7E4DC` | `#eae4d6` | text (carried over) |
| Overcast | `#8B92AC` | `#9b917f` | muted |
| First light | `#F0A868` | `#d9a648` | the one accent |
| Larkspur | `#9C8DF2` | — | secondary, sparing |
| Oxblood | `#B4524A` | `#9c4d43` | errors only |

The muted tone is the meaningful change beyond the accent: Plotwick's `#9b917f`
was parchment grey — warm, papery, indoors. `#8B92AC` is the same value with the
hue turned toward the sky.

### The six world accents — unchanged

Emerald `#5FB08A`, steel-cyan `#5AA0DC`, claret `#CC6058`, spectral violet
`#A17FD4`, copper `#CE8149`, rose `#D07CA6`. Set per world in `public/app.js`,
driving the card tint, ornament, cover hue, and the reading view's
`--story-accent`. They already read correctly against a bluer ground, they carry
all the colour variety in the product, and they are the reason the house accent
can stay disciplined at one. **Do not touch them.**

### Type

The prose face is sacred; the display face is the brand. One of the three faces
moves.

- **Display: Fraunces**, replacing Cormorant Garamond. Cormorant is beautiful and
  slightly fragile — very high contrast, and it reads "luxury wedding" at display
  sizes. Fraunces is variable with `SOFT` and `WONK` axes, giving exactly the
  small lift of whimsy "lark" implies without tipping into cute. Wordmark sets
  `WONK 1`; everything else sets `WONK 0`, so the personality lives in one place.
- **Prose: Crimson Pro, unchanged.** Not a default — a decision. This is the face
  readers spend an entire story inside, it is built for long-form, and changing
  it risks the one thing the product cannot afford to get wrong.
- **Interface: IBM Plex Sans, unchanged.** A deliberate non-change. Plex is
  legible, quiet, and doing invisible work. Swapping three faces at once buys
  atmosphere we already have and spends risk we do not need to spend. Revisit
  after launch.

### Ornament

- **Retire ❦.** The fleuron header rule is printer's-shop gravity — it belongs to
  the midnight room. The mark takes its place, at the top of every page and in
  the footer.
- **Keep ⁂.** The asterism is the typographically correct end-of-story mark and
  has earned its place. It stays exactly where it is, above "The End."
- **Keep the per-world and per-archetype glyphs** (⚜ ✦ ⚔ ☾ ✒ …). They do real
  work distinguishing eighteen stories and six casts, and they are not candle
  imagery.

### Covers

The generative fallback in `server.js:1254` currently draws an eight-point star
between two circles, hued from the world accent. It works, but it is generic —
it could belong to any product. Re-key it to the mark's language: **one
continuous stroke, seeded by the story id**, so every cover is literally one
spin and no two are alike. Keep the 300×450 frame, keep the hue-from-world-accent
logic, keep it inside the SVG sanitiser's allowlist so the AI-cover path stays
safe.

### Motion

The existing `ink-in` page-load animation stays, re-conceived as light arriving
rather than ink settling: hold the reduced-motion guard, keep it under a second,
keep it off the reading view. The governing rule of the reader — *while a chapter
streams, the page does not move* — is untouched by any of this.

## Voice, and the strings that change

The voice is the strongest asset in the product and mostly survives: literary,
warm, formal without stiffness, never cute. The one shift is register.
Plotwick's voice is *hushed* — reading room, candle, midnight. Larkspin's is
**lighter on its feet**: the same care, a little more delight, less solemnity.

| Where | Plotwick | Larkspin |
|---|---|---|
| wordmark | Plotwick | Larkspin |
| tagline | interactive stories · every one is yours alone | interactive stories · spun for one reader |
| activation | A Wick is a story that changes when you do. | A Yarn is a story that changes when you do. |
| primary CTA | Light a Wick → | Spin a Yarn → |
| buy button | Add Wicks | Add Yarns |
| buy modal | A Wick is a complete interactive story, written for you as you read it. | A Yarn is a complete interactive story, spun for you as you read it. |
| library kicker | Your reading room | What you've spun |
| library title | Your Wicks | Your Yarns |
| fine print | Your Wicks never expire. | Your Yarns never expire. |
| share page | Told with Plotwick — begin your own story | Spun on Larkspin — begin your own story |
| page title | Plotwick — interactive stories | Larkspin — interactive stories |
| account modal | Your Plotwick account | Your Larkspin account |

**Explicitly not changed:** "The opening shelf", "The storyteller is writing…",
"Where will the next opening line find you?", "Publisher's ledger", "Choose your
world", "What do you do?". None are candle-locked and all of them are good.

## Surface by surface

| Surface | File | Work | Hits |
|---|---|---|---|
| Reader app — five screens + four modals | `public/app.js` | Unit noun, CTA, library copy, cover seed | 30 |
| Home, character creation, reader, ledger | `public/index.html` | Wordmark, tagline, favicon, header rule, CTA | 18 |
| Terms | `public/terms.html` | Entity name + unit noun throughout | 19 |
| Privacy | `public/privacy.html` | Entity name + unit noun throughout | 17 |
| Stylesheet | `public/style.css` | Full `:root` replacement, font stacks, header comment | 1 |
| Server — Stripe, export, covers, boot | `server.js` | Line-item names, cover art, export filename | 15 |
| Public share page | `public/share.html`, `share.js` | Wordmark, footer note, report prompt | 4 |
| Schema comments only | `supabase/*.sql` | Comments — **no identifiers, no migration** | 10 |
| Runbooks | `docs/` ×4 | Prose rename | 20 |
| Tests asserting on brand strings | `test/` ×6 | Update fixtures and assertions | 17 |
| Package metadata, README, TODO | root | Name, description, docs | 16 |

## Migration

The headline finding from the audit: **the database needs no migration at all.**
Every stored identifier is already brand-neutral — `profiles.credits`,
`credit_ledger`, `story_starts`, `stripe_events`. The schema author saw this
coming and wrote the rule down. The rebrand is a presentation-layer change on top
of an unchanged data layer.

Two identifiers do carry the old name in live paths, and both must be left alone.

> ### Freeze — do not rename
>
> **`plotwick:purchase:`** — `server.js:1440` derives a deterministic UUID from
> this prefix plus the Stripe event id to de-duplicate `purchase_completed`
> analytics rows. Change the prefix and every already-processed event re-keys, so
> a replayed webhook — explicitly in the launch test matrix — writes a *second*
> purchase row. This does not double-grant stories (that is guarded separately by
> `stripe_events.id`, which is Stripe's own id), but it double-counts revenue in
> the Publisher's ledger and breaks the reconciliation the trust work is built on.
> Keep it as a frozen legacy constant with a comment, exactly like
> `welcome_novella`.
>
> **The six `plotwick-*` localStorage keys** — `app.js:467–469, 492, 507–508`.
> These hold every reader's device library, their scroll/page reading preference,
> and their pilot cohort. Renaming the prefix silently empties the shelf of every
> existing reader. Either freeze the keys (invisible, recommended) or extend the
> `LEGACY_LIB_KEY` + `migrateLegacy` hop that already exists for exactly this
> situation.

Safe to change: `integration_identifier: plotwick_<suffix>` on Checkout sessions
(`server.js:1312`) is a per-session attribution string with no historical lookups
against it.

### Phase 0 — freeze the identifiers

Land the two comments above *first*, as their own commit, so no later
find-and-replace can sweep them up. This is the only step with money and reader
data behind it.

### Phase 1 — identity: assets and tokens

Mark as inline SVG, favicon replacing the emoji data-URI, the new `:root` block,
Fraunces swapped in for Cormorant in the font link and `--display`. No copy yet
— this alone should already look like Larkspin.

### Phase 2 — language: the copy sweep

Wordmark and unit noun across the four HTML files and `app.js`, then the
policies. **Not** a blind find-and-replace: "Wick" appears inside frozen
identifiers and schema comments that must survive.

### Phase 3 — commerce: Stripe and the domain

Stripe line-item names, `PUBLIC_APP_URL`, Checkout return URLs, then
`larkspin.com` with permanent redirects from the old host. **Every
already-published `/s/:id` share link must keep resolving** — readers have those
in the wild and a dead share link is a broken promise, not a redirect problem.

### Phase 4 — housekeeping: tests, docs, metadata

Six test files assert on brand strings; `test/fixtures/monetization-preview.html`
needs regenerating. Then `package.json`, README, TODO, the four runbooks, and the
schema comments.

### Phase 5 — people: tell the founding readers

There is an active beta with a feedback loop and readers holding purchased
balances. A silent overnight rename reads as a different company took the site.
One short note — same story engine, same library, same balance, new name — costs
nothing and protects the trust the pilot is built on.

## Six decisions

Everything above is executable once these are settled. Only the first is
genuinely open; the rest are recommendations that need a yes.

| # | Decision | Recommendation |
|---|---|---|
| 1 | What replaces "Wick" as the unit of sale? | Yarn |
| 2 | Does Larkspin stay dark-only, with no light theme? | Yes |
| 3 | Does the interface face change alongside the display face? | No |
| 4 | Do published `/s/:id` share links survive the domain move? | Always |
| 5 | Do existing balances get renamed under readers mid-beta? | Display only |
| 6 | Rebrand before or after `STORY_CREDITS_ENABLED=1`? | Before |

On six: the payment test matrix is the last open P0 item in `TODO.md`, and the
rebrand changes Stripe line-item names and return URLs. Renaming first means the
matrix is run once, against the names that will actually be in production.
Renaming after means running it twice or shipping a rename never tested end to
end.

---

This brief is the plan, not the change — no product code has been touched.
Settle Decision 1 and the rest follows in the order above; Phase 0 lands as its
own commit before anything else moves.
