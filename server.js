// Plotwick — AI choose-your-own-adventure server.
// Holds the Anthropic API key server-side and streams story chapters to the
// browser over Server-Sent Events. Story state lives on the client; every
// request carries the full history, so chapter generation is stateless.
// The server also acts as the hidden "story director": it computes a pacing
// directive for each chapter so stories follow a real narrative arc instead
// of meandering or ending abruptly.

require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const Anthropic = require("@anthropic-ai/sdk");

const PORT = process.env.PORT || 3000;
const MODEL = process.env.STORY_MODEL || "claude-opus-4-8";
const TARGET_CHAPTERS = Number(process.env.TARGET_CHAPTERS) || 10;
const HARD_CAP_CHAPTERS = TARGET_CHAPTERS + 4;
const RATE_LIMIT_PER_HOUR = Number(process.env.RATE_LIMIT_PER_HOUR) || 40;
// Demo mode serves canned story content so the UI works with no API key.
const DEMO_MODE =
  process.env.DEMO_MODE === "1" ||
  (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN);

const app = express();
// Behind a reverse proxy (Railway, Render, Fly, etc.) req.ip is otherwise the
// proxy's address for every request, which would collapse per-IP rate
// limiting into one shared bucket. Trust the first hop's X-Forwarded-For.
app.set("trust proxy", 1);

const client = DEMO_MODE ? null : new Anthropic();

// Supabase (optional): accounts + cloud library + share storage + credits.
// SUPABASE_URL + SUPABASE_ANON_KEY enable auth (browser signs in directly;
// this server only verifies tokens). SUPABASE_SERVICE_ROLE_KEY additionally
// moves share storage into Postgres and enables server-side credit spending.
let supabaseAuth = null;
let supabaseAdmin = null;
// Normalize the project URL: trim stray whitespace and any trailing slash.
// A trailing slash makes supabase-js build "…/ /auth/v1/…" (double slash),
// which the API gateway rejects with "Invalid path specified in request URL".
const SUPABASE_URL = (process.env.SUPABASE_URL || "").trim().replace(/\/+$/, "");
if (SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  const { createClient } = require("@supabase/supabase-js");
  const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
  supabaseAuth = createClient(SUPABASE_URL, process.env.SUPABASE_ANON_KEY, noSession);
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    supabaseAdmin = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, noSession);
  }
}

// Stripe (optional): pay-per-story credits. Requires the service-role key too,
// since granting/spending credits is done server-side against Supabase.
// Credit packs are defined HERE, on the server — the client can never set its
// own price. Prices are in the smallest currency unit (cents).
//
// ⚠️ PLACEHOLDER PRICING — review these before charging real money. A full
// story costs us roughly ~$1 in API calls, so a credit is priced above that
// for margin. Tune the numbers, then keep them in sync with what you tell users.
const CREDIT_PACKS = {
  starter: { credits: 5, price: 800, label: "5 stories" },    // $8.00
  reader:  { credits: 15, price: 2000, label: "15 stories" }, // $20.00
  patron:  { credits: 40, price: 4500, label: "40 stories" }, // $45.00
};
const CURRENCY = process.env.STRIPE_CURRENCY || "usd";

let stripe = null;
if (process.env.STRIPE_SECRET_KEY && supabaseAdmin) {
  stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
}

// Credits are enforced whenever the server can actually spend them safely
// (i.e. the service-role key is configured). Without it — local dev, self-host
// — generation stays open and free, exactly as before.
const CREDITS_ENFORCED = !!supabaseAdmin && !DEMO_MODE;

// Admin accounts (comma-separated emails) get unlimited stories and are never
// charged — for story testing and staff use. Matching is case-insensitive.
// These emails still sign in normally; they simply bypass the credit gate.
const ADMIN_EMAILS = new Set(
  (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean),
);
function isAdmin(user) {
  return !!(user && user.email && ADMIN_EMAILS.has(user.email.toLowerCase()));
}

// The Stripe webhook must read the RAW request body to verify the signature,
// so it is mounted BEFORE express.json(). Everything else gets parsed JSON.
if (stripe && process.env.STRIPE_WEBHOOK_SECRET) {
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
}

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Resolve the signed-in user from a Bearer token, if any.
async function userFromReq(req) {
  if (!supabaseAuth) return null;
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) return null;
  try {
    const { data, error } = await supabaseAuth.auth.getUser(header.slice(7));
    return error ? null : data.user;
  } catch {
    return null;
  }
}

const MAX_CHAPTER_TOKENS = 8000;

// ----------------------------------------------------------------------
// Story engine: system prompt + pacing director
// ----------------------------------------------------------------------

function buildSystemPrompt(scenario, character) {
  return `You are the narrator and story director of an interactive novella — a "choose your own adventure" story told in rich, literary prose.

SCENARIO
Title: ${scenario.title}
Premise: ${scenario.premise}
Genre & tone: ${scenario.tone}

PROTAGONIST
Name: ${character.name}
Archetype: ${character.archetype}${character.archetypeBlurb ? ` — ${character.archetypeBlurb}` : ""}
Defining trait: ${character.trait}

HOW TO WRITE EACH CHAPTER
- Write in second person ("you"), present tense, addressing the protagonist.
- Each chapter is 400–700 words of vivid, novella-quality prose (the finale may run to 900): concrete sensory detail, real dialogue, momentum. No headers, no meta-commentary, no recaps of previous chapters, no moralizing summaries.
- Weave the protagonist's archetype and trait into how events unfold and how other characters react.
- Every chapter must change the situation irreversibly — something is gained, lost, revealed, or broken. Never write a chapter where the status quo survives.
- End every chapter at a genuine decision point where what happens next is truly uncertain.
- The player may type a free-form action instead of picking a listed choice. Honor it faithfully if it is at all plausible in the fiction; if it is impossible, let the attempt fail interestingly rather than refusing it. Player choices decide HOW events unfold — but you, the director, ensure the story always moves.

STORY STRUCTURE — YOU ARE THE DIRECTOR
The story follows a classical arc. A private pacing note accompanies each turn telling you where the story should be — obey it. Broad shape:
- Act I (setup): ground the protagonist in motion, land the inciting incident, first complication.
- Act II (rising action): escalating obstacles, allies and adversaries with their own agendas, and a midpoint revelation that reframes what the story is really about.
- Act III (convergence): threads converge, the cost of every earlier choice comes due, climax, resolution.
Endings may be triumphant, bittersweet, or tragic — whatever the player's accumulated choices have earned. The finale must visibly pay off specific choices the player made.

STATE LEDGER (continuity)
After the prose, output a state ledger inside <state> tags as a single JSON object:
<state>{"title": "...", "act": 1, "condition": "...", "inventory": ["..."], "companions": [{"name": "...", "standing": "..."}], "threads": ["..."]}</state>
- title: an evocative, unique novella title you invent in chapter 1 and keep IDENTICAL in every later chapter.
- act: 1, 2, or 3.
- condition: the protagonist's physical/emotional state in a short phrase.
- inventory: significant items currently carried (not clutter).
- companions: named characters currently travelling with or bound to the protagonist, with a one-word standing (loyal, wary, hostile, smitten...).
- threads: open plot questions. Keep at most 5 open; you must close every thread before or during the finale.
Before writing each chapter, re-read the most recent state ledger and the full history, and honor both exactly. Named characters, injuries, items, promises — all of it persists.

CHOICES (output format — follow exactly)
After the state ledger, output the available choices as a JSON array of exactly 3 strings inside <choices> tags:
<choices>["First option", "Second option", "Third option"]</choices>
- Each choice is a concrete action, under 15 words.
- The three must pull in meaningfully different directions — e.g. one bold/direct, one cautious/clever, one lateral/unexpected. Never three flavors of the same move.
- When — and only when — the story reaches its true ending, write the final scene, then output the ledger followed by an empty array: <choices>[]</choices>`;
}

// The hidden director: computes a private pacing note from the chapter
// number. The player never sees these; they keep the arc on track.
function pacingNote(chapterNum) {
  const t = TARGET_CHAPTERS;
  const finaleBy = HARD_CAP_CHAPTERS;
  if (chapterNum >= finaleBy) {
    return `Pacing note (private): This is chapter ${chapterNum}. The story has run long — this chapter IS the finale. Bring events to their climax and full resolution now, close every open thread, and end with <choices>[]</choices>.`;
  }
  if (chapterNum >= t) {
    return `Pacing note (private): Chapter ${chapterNum} of a story targeted at ~${t} chapters. Act III. The climax should happen now or in the next chapter at the latest. Close remaining threads; steer all three choices toward the final confrontation. If this chapter completes the climax, write the resolution and end with <choices>[]</choices>.`;
  }
  if (chapterNum >= t - 2) {
    return `Pacing note (private): Chapter ${chapterNum} of ~${t}. Late Act II / entering Act III. Converge the threads: bring the antagonist or central force into direct contact, make earlier choices come due, and close at least one open thread. Raise the cost of failure to its maximum. No new subplots.`;
  }
  if (chapterNum === Math.ceil(t / 2)) {
    return `Pacing note (private): Chapter ${chapterNum} of ~${t} — the MIDPOINT. Deliver a revelation or reversal that reframes what the story is really about. Something the player believed should turn out to be importantly wrong or incomplete.`;
  }
  if (chapterNum >= 3) {
    return `Pacing note (private): Chapter ${chapterNum} of ~${t}. Act II. Escalate: obstacles harder than the last, stakes more personal. Develop allies/adversaries with their own agendas. You may open at most one new thread, and only if you also advance an existing one.`;
  }
  if (chapterNum === 2) {
    return `Pacing note (private): Chapter 2 of ~${t}. Complete the setup: the consequences of the first choice land, the central problem sharpens, and the protagonist is committed — no easy way back.`;
  }
  return `Pacing note (private): Chapter 1 of ~${t}. Open in motion — no throat-clearing. Ground the protagonist in their world with concrete detail, land the inciting incident, and end on the first meaningful decision. Invent the novella's title for the state ledger.`;
}

// Build the message list for a turn: client history + private pacing note.
// On claude-opus-4-8 the note rides as a mid-conversation system message
// (operator channel, cache-friendly); on other models it's merged into the
// final user turn.
function buildMessages(history, chapterNum) {
  const note = pacingNote(chapterNum);
  if (MODEL.startsWith("claude-opus-4-8")) {
    return [...history, { role: "system", content: note }];
  }
  const msgs = history.map((m) => ({ ...m }));
  const last = msgs[msgs.length - 1];
  last.content = `${last.content}\n\n[${note}]`;
  return msgs;
}

// ----------------------------------------------------------------------
// SSE + rate limiting helpers
// ----------------------------------------------------------------------

function sseStart(res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
}

function sseSend(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

const rateBuckets = new Map(); // ip -> [timestamps]
function rateLimited(ip) {
  const now = Date.now();
  const windowStart = now - 3600_000;
  const hits = (rateBuckets.get(ip) || []).filter((t) => t > windowStart);
  if (hits.length >= RATE_LIMIT_PER_HOUR) {
    rateBuckets.set(ip, hits);
    return true;
  }
  hits.push(now);
  rateBuckets.set(ip, hits);
  return false;
}

// ----------------------------------------------------------------------
// Routes
// ----------------------------------------------------------------------

app.get("/api/config", (_req, res) => {
  res.json({
    demo: DEMO_MODE,
    model: MODEL,
    targetChapters: TARGET_CHAPTERS,
    supabase: supabaseAuth
      ? { url: SUPABASE_URL, anonKey: process.env.SUPABASE_ANON_KEY }
      : null,
    creditsEnforced: CREDITS_ENFORCED,
    payments: stripe && process.env.STRIPE_WEBHOOK_SECRET
      ? {
          currency: CURRENCY,
          packs: Object.fromEntries(
            Object.entries(CREDIT_PACKS).map(([id, p]) => [id, { credits: p.credits, price: p.price, label: p.label }]),
          ),
        }
      : null,
  });
});

// A signed-in user's current credit balance.
app.get("/api/credits", async (req, res) => {
  if (!supabaseAdmin) return res.json({ credits: null, enforced: false });
  const user = await userFromReq(req);
  if (!user) return res.status(401).json({ error: "not signed in" });
  if (isAdmin(user)) {
    return res.json({ credits: "unlimited", enforced: CREDITS_ENFORCED, admin: true });
  }
  const { data, error } = await supabaseAdmin
    .from("profiles").select("credits").eq("id", user.id).maybeSingle();
  if (error) return res.status(500).json({ error: "couldn't read credits" });
  res.json({ credits: data ? data.credits : 0, enforced: CREDITS_ENFORCED });
});

// Refund a charged story start (server-internal helper).
async function refundStart(userId, storyId) {
  try {
    await supabaseAdmin.rpc("refund_story", { p_user_id: userId, p_story_id: storyId });
  } catch (e) {
    console.error("refund_story failed:", e.message);
  }
}

// Body: { scenario, character, history: [{role, content}, ...] }
// history is the raw message list: assistant turns are full chapter text
// (including <state> and <choices> tags), user turns are player actions.
app.post("/api/story", async (req, res) => {
  const { scenario, character, history, storyId } = req.body || {};
  if (!scenario || !character || !Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: "scenario, character and non-empty history are required" });
  }
  // Rate limit per account when signed in, per IP otherwise.
  const user = await userFromReq(req);
  if (!DEMO_MODE && rateLimited(user ? `user:${user.id}` : `ip:${req.ip}`)) {
    return res.status(429).json({
      error: "You've reached the hourly story limit. Take a breath — the tale will wait.",
    });
  }

  // Credit gate: when enforced, a story requires a signed-in user and one
  // credit, spent atomically in the database on the first chapter only.
  // (All of this runs BEFORE sseStart so we can still send real HTTP statuses.)
  let chargedThisCall = false;
  const admin = isAdmin(user);
  if (CREDITS_ENFORCED && !admin) {
    if (!user) {
      return res.status(401).json({ error: "Please sign in to begin a story.", needAuth: true });
    }
    if (!storyId || typeof storyId !== "string") {
      return res.status(400).json({ error: "storyId is required" });
    }
    const { data, error } = await supabaseAdmin.rpc("start_story", {
      p_user_id: user.id,
      p_story_id: storyId,
    });
    if (error) {
      console.error("start_story failed:", error.message);
      return res.status(500).json({ error: "Couldn't check your story credits. Please try again." });
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row || !row.ok) {
      return res.status(402).json({
        error: "You're out of story credits.",
        needCredits: true,
        credits: 0,
      });
    }
    chargedThisCall = !!row.charged;
  }

  const chapterNum = history.filter((m) => m.role === "assistant").length + 1;
  sseStart(res);
  if (CREDITS_ENFORCED && admin) {
    sseSend(res, { type: "credits", credits: "unlimited" });
  } else if (CREDITS_ENFORCED) {
    // Push the (possibly newly-decremented) balance so the UI updates live.
    const { data } = await supabaseAdmin
      .from("profiles").select("credits").eq("id", user.id).maybeSingle();
    if (data) sseSend(res, { type: "credits", credits: data.credits });
  }

  try {
    if (DEMO_MODE) {
      await streamDemoChapter(res, chapterNum);
    } else {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: MAX_CHAPTER_TOKENS,
        thinking: { type: "adaptive" },
        system: buildSystemPrompt(scenario, character),
        messages: buildMessages(history, chapterNum),
      });

      stream.on("text", (text) => sseSend(res, { type: "text", text }));

      const final = await stream.finalMessage();

      if (final.stop_reason === "refusal") {
        if (chargedThisCall) await refundStart(user.id, storyId);
        sseSend(res, {
          type: "error",
          error: "The storyteller declined to continue this scene. Try a different action.",
        });
      } else if (final.stop_reason === "max_tokens") {
        if (chargedThisCall) await refundStart(user.id, storyId);
        sseSend(res, {
          type: "error",
          error: "The chapter ran too long and was cut off. Try again.",
        });
      } else {
        sseSend(res, { type: "done" });
      }
    }
  } catch (err) {
    console.error("story generation failed:", err);
    // The charged first chapter never rendered — give the credit back.
    if (chargedThisCall) await refundStart(user.id, storyId);
    let message = "The storyteller hit a snag. Please try again.";
    if (err instanceof Anthropic.AuthenticationError) {
      message = "Server API key is invalid — check ANTHROPIC_API_KEY.";
    } else if (err instanceof Anthropic.RateLimitError) {
      message = "The storyteller is overwhelmed right now — wait a moment and try again.";
    }
    sseSend(res, { type: "error", error: message });
  }
  res.end();
});

// Cover art: Claude designs a minimalist SVG book cover for the story.
app.post("/api/cover", async (req, res) => {
  const { title, scenario, character, accent } = req.body || {};
  if (!title || !scenario) return res.status(400).json({ error: "title and scenario required" });
  const accentHex = /^#[0-9a-fA-F]{6}$/.test(accent || "") ? accent : null;

  if (DEMO_MODE) {
    return res.json({ svg: fallbackCover(title, scenario.title, accentHex) });
  }
  try {
    const palette = accentHex
      ? `Anchor the palette to this accent color: ${accentHex} (use it, and shades/tints of it, for the motif and highlights against the dark ground).`
      : "Choose a restrained palette of 2–4 colors that fits the setting.";
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      thinking: { type: "adaptive" },
      messages: [
        {
          role: "user",
          content: `Design a book cover as a single self-contained SVG, exactly 300 wide by 450 tall (viewBox="0 0 300 450").

The book: "${title}" — an interactive novella. Setting: ${scenario.title}. ${scenario.premise} Protagonist: ${character?.name || "unknown"}, ${character?.archetype || ""}.

Style: minimalist literary cover. Dark, atmospheric background. ${palette} One striking central symbolic motif built from simple geometric shapes or paths (no attempt at realism); the title set in an elegant generic serif font near the top or bottom; a small line reading "an interactive novella". Subtle texture via gradients or opacity is welcome.

Rules: return ONLY the SVG markup, nothing else. Self-contained — no scripts, no external images or fonts (generic font families only).`,
        },
      ],
    });
    const text = response.content.filter((b) => b.type === "text").map((b) => b.text).join("");
    const match = text.match(/<svg[\s\S]*<\/svg>/);
    const svg = match ? sanitizeSvg(match[0]) : null;
    res.json({ svg: svg || fallbackCover(title, scenario.title, accentHex) });
  } catch (err) {
    console.error("cover generation failed:", err.message);
    res.json({ svg: fallbackCover(title, scenario.title, accentHex) });
  }
});

// Convert a #rrggbb hex to an HSL hue (0–359). Returns null on bad input.
function hexToHue(hex) {
  const m = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex || "");
  if (!m) return null;
  const r = parseInt(m[1], 16) / 255, g = parseInt(m[2], 16) / 255, b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  return (h + 360) % 360;
}

function sanitizeSvg(svg) {
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son\w+\s*=\s*'[^']*'/gi, "")
    .replace(/<foreignObject[\s\S]*?<\/foreignObject>/gi, "")
    .replace(/(href|xlink:href)\s*=\s*"(?!#)[^"]*"/gi, "");
}

// Deterministic decorative cover used in demo mode and as a live fallback.
// When the world's accent hex is known, seed the palette from its hue so the
// cover matches the story's colour; otherwise fall back to a title hash.
function fallbackCover(title, subtitle, accentHex) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let hue = hexToHue(accentHex);
  if (hue === null) {
    let hash = 0;
    for (const ch of String(title)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
    hue = hash % 360;
  }
  const hue2 = (hue + 40) % 360;
  const words = esc(title).split(" ");
  const lines = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > 16) { lines.push(line.trim()); line = w; }
    else line += " " + w;
  }
  if (line.trim()) lines.push(line.trim());
  const titleText = lines.slice(0, 4).map(
    (l, i) => `<text x="150" y="${300 + i * 30}" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="hsl(${hue} 45% 82%)">${l}</text>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450" width="300" height="450">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1">
    <stop offset="0" stop-color="hsl(${hue} 35% 14%)"/><stop offset="1" stop-color="hsl(${hue2} 40% 8%)"/>
  </linearGradient></defs>
  <rect width="300" height="450" fill="url(#bg)"/>
  <circle cx="150" cy="150" r="62" fill="none" stroke="hsl(${hue2} 55% 60%)" stroke-width="1.5" opacity="0.9"/>
  <circle cx="150" cy="150" r="44" fill="hsl(${hue} 50% 30%)" opacity="0.55"/>
  <path d="M150 96 L162 138 L204 150 L162 162 L150 204 L138 162 L96 150 L138 138 Z" fill="hsl(${hue2} 60% 70%)" opacity="0.9"/>
  <rect x="40" y="262" width="220" height="1" fill="hsl(${hue} 30% 50%)" opacity="0.6"/>
  ${titleText}
  <text x="150" y="425" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="12" fill="hsl(${hue} 25% 60%)">an interactive novella · ${esc(subtitle)}</text>
</svg>`;
}

// ----------------------------------------------------------------------
// Payments: buy story credits via Stripe Checkout.
// ----------------------------------------------------------------------

// Create a Stripe Checkout session for a credit pack and return its URL.
app.post("/api/checkout", async (req, res) => {
  if (!stripe) return res.status(400).json({ error: "Payments aren't configured." });
  const user = await userFromReq(req);
  if (!user) return res.status(401).json({ error: "Please sign in first." });

  const pack = CREDIT_PACKS[(req.body || {}).pack];
  if (!pack) return res.status(400).json({ error: "Unknown credit pack." });

  const origin = req.headers.origin || `${req.protocol}://${req.get("host")}`;
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      // Attribute this purchase to the user and pack so the webhook can grant
      // the right credits to the right account.
      client_reference_id: user.id,
      metadata: { user_id: user.id, credits: String(pack.credits) },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: CURRENCY,
            unit_amount: pack.price,
            product_data: { name: `Plotwick — ${pack.label}` },
          },
        },
      ],
      success_url: `${origin}/?checkout=success`,
      cancel_url: `${origin}/?checkout=cancel`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error("checkout session failed:", err.message);
    res.status(500).json({ error: "Couldn't start checkout. Please try again." });
  }
});

// Stripe webhook: the source of truth for granting credits. Mounted with a raw
// body parser above (before express.json) so the signature verifies.
async function handleStripeWebhook(req, res) {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("stripe webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.user_id || session.client_reference_id;
    const credits = parseInt(session.metadata?.credits || "0", 10);
    if (userId && credits > 0) {
      try {
        // Idempotent by event id: replays never double-grant.
        const { error } = await supabaseAdmin.rpc("grant_stripe_credits", {
          p_event_id: event.id,
          p_user_id: userId,
          p_credits: credits,
        });
        // supabase-js reports failures via the returned `error`, not a throw.
        if (error) throw new Error(error.message);
      } catch (err) {
        console.error("grant_stripe_credits failed:", err.message);
        // 500 tells Stripe to retry the webhook later so the paid-for credits
        // still land — never swallow a grant failure with a 200.
        return res.status(500).send("credit grant failed");
      }
    }
  }

  res.json({ received: true });
}

// ----------------------------------------------------------------------
// Shared stories: finished stories can be published to a read-only link.
// Stored in Supabase (shared_stories) when a service-role key is configured;
// otherwise falls back to a simple JSON file.
// ----------------------------------------------------------------------

const DATA_DIR = path.join(__dirname, "data");
const SHARE_FILE = path.join(DATA_DIR, "stories.json");
let sharedStories = {};
try {
  sharedStories = JSON.parse(fs.readFileSync(SHARE_FILE, "utf8"));
} catch { /* first run */ }

function persistShares() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(SHARE_FILE, JSON.stringify(sharedStories));
}

app.post("/api/share", async (req, res) => {
  const { title, scenario, character, chapters, cover } = req.body || {};
  if (
    typeof title !== "string" || title.length > 200 ||
    !scenario || !character ||
    !Array.isArray(chapters) || chapters.length === 0 || chapters.length > 60 ||
    chapters.some((c) => typeof c.prose !== "string" || c.prose.length > 20000)
  ) {
    return res.status(400).json({ error: "invalid story payload" });
  }
  const id = crypto.randomBytes(5).toString("hex");
  const record = {
    title,
    scenario: { title: String(scenario.title || "").slice(0, 120) },
    character: {
      name: String(character.name || "").slice(0, 60),
      archetype: String(character.archetype || "").slice(0, 60),
      trait: String(character.trait || "").slice(0, 60),
    },
    chapters: chapters.map((c) => ({
      prose: c.prose,
      action: c.action ? String(c.action).slice(0, 300) : null,
    })),
    cover: typeof cover === "string" && cover.length < 200000 ? sanitizeSvg(cover) : null,
    createdAt: new Date().toISOString(),
  };

  if (supabaseAdmin) {
    const user = await userFromReq(req);
    const { error } = await supabaseAdmin
      .from("shared_stories")
      .insert({ id, user_id: user ? user.id : null, data: record });
    if (error) {
      console.error("share insert failed:", error.message);
      return res.status(500).json({ error: "couldn't publish the story" });
    }
    return res.json({ id });
  }

  if (Object.keys(sharedStories).length >= 5000) {
    return res.status(507).json({ error: "share storage is full" });
  }
  sharedStories[id] = record;
  persistShares();
  res.json({ id });
});

app.get("/api/share/:id", async (req, res) => {
  if (supabaseAdmin) {
    const { data, error } = await supabaseAdmin
      .from("shared_stories")
      .select("data")
      .eq("id", req.params.id)
      .maybeSingle();
    if (error) return res.status(500).json({ error: "couldn't load the story" });
    if (!data) return res.status(404).json({ error: "story not found" });
    return res.json(data.data);
  }
  const story = sharedStories[req.params.id];
  if (!story) return res.status(404).json({ error: "story not found" });
  res.json(story);
});

app.get("/s/:id", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "share.html"));
});

// ----------------------------------------------------------------------
// Demo mode: canned chapters (with state ledgers) streamed word-by-word so
// the whole UI can be exercised without an API key.
// ----------------------------------------------------------------------

const DEMO_CHAPTERS = [
  `The rain has been falling for three days when the letter arrives — heavy cream paper, no return address, your name written in a hand you almost recognize. Inside, a single sentence: "They found it, and now they will come for you."

You stand at the window of your rented room a long while, watching the street below. A man in a grey coat has been leaning against the lamppost since noon, and he has not once looked at his newspaper.

The floorboard behind you creaks. You turn slowly. Your landlady, Mrs. Havisham, stands in the doorway holding a tray of tea she never brings. Her eyes flick — just once — toward the wardrobe in the corner, the one you were told never to open.

"You have a visitor downstairs," she says. Her voice is steady, but her hands are not. "I told them you were out. I don't think they believed me."

Below, the man in the grey coat has left the lamppost. The front door bell rings once. Twice.

<state>{"title": "The Letter at Lamplight", "act": 1, "condition": "rattled but unhurt", "inventory": ["the cream-paper letter"], "companions": [{"name": "Mrs. Havisham", "standing": "protective"}], "threads": ["Who sent the letter?", "What was found?", "The forbidden wardrobe"]}</state>
<choices>["Open the wardrobe Mrs. Havisham glanced at", "Slip out the back window onto the fire escape", "Go downstairs and face the visitor directly"]</choices>`,

  `Your choice sets events in motion faster than you expected. The house seems to hold its breath around you — and then everything happens at once.

Glass breaks somewhere below. Mrs. Havisham seizes your wrist with surprising strength and presses something into your palm: a small brass key, warm as if she'd held it for years. "The station," she whispers. "Platform nine. Ask for the night porter, and show him this. Trust no one who calls you by your first name."

Footsteps on the stairs now — two sets, unhurried, the confident pace of men who believe there is no way out. Through the window, the street lamps flicker in sequence down the block, going dark one by one, as if something is walking the length of the street swallowing light as it comes.

Mrs. Havisham steps in front of the door. "I'll give you a minute," she says. "Make it count." For a moment she looks younger, and you understand with a chill that she has done this before — perhaps many times, perhaps for others like you who did not make it.

The key bites into your palm. The window stands open. The wardrobe door, you notice, has drifted ajar on its own, and from inside comes a faint smell of cold air and pine, as though it opens onto somewhere else entirely.

<state>{"title": "The Letter at Lamplight", "act": 2, "condition": "heart pounding, unhurt", "inventory": ["the cream-paper letter", "a warm brass key"], "companions": [{"name": "Mrs. Havisham", "standing": "sacrificing"}], "threads": ["Who sent the letter?", "What was found?", "The men on the stairs", "Platform nine and the night porter"]}</state>
<choices>["Take the fire escape and run for the station", "Step into the wardrobe", "Stand with Mrs. Havisham and fight"]</choices>`,

  `The night porter's lantern swings shadows across the empty platform as he examines the brass key, turning it over twice. Somewhere behind you, in the city you are leaving, sirens begin to keen.

"Been a long time since I saw one of these," he says at last. He looks at you properly then — through you, almost — and nods as if confirming something. "You'd best come with me. The nine-fifteen doesn't stop here anymore. Not for most people, anyway."

He leads you past the shuttered ticket office to a door marked NO ENTRY, which opens onto a platform that should not exist: gaslit, immaculate, and utterly silent. A train waits there, dark green and gold, windows glowing amber. You can hear it breathing.

"One thing before you board." The porter's voice drops. "Whatever they told you was found — it wasn't lost. It was hidden. There's a difference, and the difference is the whole game. Someone hid it from someone, once, at terrible cost." He hands the key back. "Seat eleven. The compartment will know you."

As you step aboard, you feel the eyes of another passenger on you — a woman in a travelling cloak at the far end of the carriage, her face half in shadow. On the seat beside her rests a letter of heavy cream paper. Exactly like yours.

The train begins to move. There is no going back now — and the story, you sense, is only beginning to show you its true shape. Your journey has carried you as far as the demo can go.

<state>{"title": "The Letter at Lamplight", "act": 3, "condition": "resolved, wary", "inventory": ["the cream-paper letter", "a warm brass key"], "companions": [{"name": "The night porter", "standing": "cryptic"}], "threads": []}</state>
<choices>[]</choices>`,
];

async function streamDemoChapter(res, chapterNum) {
  const chapter = DEMO_CHAPTERS[Math.min(chapterNum - 1, DEMO_CHAPTERS.length - 1)];
  const words = chapter.split(/(\s+)/);
  for (const word of words) {
    sseSend(res, { type: "text", text: word });
    await new Promise((r) => setTimeout(r, 8));
  }
  sseSend(res, { type: "done" });
}

app.listen(PORT, () => {
  console.log(`Plotwick running at http://localhost:${PORT}`);
  console.log(DEMO_MODE
    ? "Mode: DEMO (no API key found — canned story content). Set ANTHROPIC_API_KEY for live stories."
    : `Mode: LIVE (model: ${MODEL}, target ~${TARGET_CHAPTERS} chapters, ${RATE_LIMIT_PER_HOUR} chapters/hr/IP)`);
  console.log(`Accounts: ${supabaseAuth ? "on" : "off"} · Credits: ${CREDITS_ENFORCED ? "enforced" : "off"} · Payments: ${stripe && process.env.STRIPE_WEBHOOK_SECRET ? "Stripe" : "off"}`);
});
