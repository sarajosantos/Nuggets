"use strict";

const crypto = require("crypto");
const sanitizeHtml = require("sanitize-html");

const MAX_HISTORY_MESSAGES = 31;
const MAX_HISTORY_CONTENT = 20_000;
const MAX_HISTORY_TOTAL = 250_000;

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
    );
  }
  return value;
}

function hashValue(value) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(canonicalize(value)))
    .digest("hex");
}

function cleanStoryInputs(scenario, character) {
  if (!scenario || !character) return null;
  const cleaned = {
    scenario: {
      title: stringWithin(scenario.title, 1, 120),
      premise: stringWithin(scenario.premise, 1, 1_000),
      tone: stringWithin(scenario.tone, 1, 300),
    },
    character: {
      name: stringWithin(character.name, 1, 60),
      archetype: stringWithin(character.archetype, 1, 80),
      archetypeBlurb: optionalStringWithin(character.archetypeBlurb, 300),
      trait: stringWithin(character.trait, 1, 60),
    },
  };
  return Object.values(cleaned.scenario).some((v) => v === null) ||
    Object.entries(cleaned.character).some(([key, value]) => key !== "archetypeBlurb" && value === null)
    ? null
    : cleaned;
}

function validateHistory(history, { firstChapter = false } = {}) {
  if (!Array.isArray(history) || history.length === 0 || history.length > MAX_HISTORY_MESSAGES) {
    return { ok: false, error: "invalid story history length" };
  }
  let total = 0;
  for (let i = 0; i < history.length; i += 1) {
    const message = history[i];
    const expectedRole = i % 2 === 0 ? "user" : "assistant";
    if (!message || message.role !== expectedRole || typeof message.content !== "string") {
      return { ok: false, error: "story history roles must alternate user and assistant" };
    }
    if (!message.content.trim() || message.content.length > MAX_HISTORY_CONTENT) {
      return { ok: false, error: "story history message is invalid" };
    }
    total += message.content.length;
  }
  if (total > MAX_HISTORY_TOTAL || history[history.length - 1].role !== "user") {
    return { ok: false, error: "story history is too large or incomplete" };
  }
  if (firstChapter && history.length !== 1) {
    return { ok: false, error: "a new story must begin with one opening instruction" };
  }
  return { ok: true };
}

function sanitizeSvg(svg) {
  if (typeof svg !== "string" || svg.length > 200_000) return null;
  if (
    /<(?:script|foreignObject|iframe|image|use|animate|set)\b/i.test(svg) ||
    /\b(?:href|src|style|on\w+)\s*=/i.test(svg)
  ) return null;
  const cleaned = sanitizeHtml(svg, {
    allowedTags: [
      "svg", "defs", "title", "desc", "g", "rect", "circle", "ellipse",
      "line", "polyline", "polygon", "path", "text", "tspan",
      "linearGradient", "radialGradient", "stop", "clipPath",
    ],
    allowedAttributes: {
      svg: ["xmlns", "viewBox", "width", "height", "role", "aria-label"],
      "*": [
        "id", "x", "y", "x1", "x2", "y1", "y2", "cx", "cy", "r", "rx", "ry",
        "d", "points", "fill", "fill-opacity", "stroke", "stroke-width",
        "stroke-opacity", "opacity", "transform", "offset", "stop-color",
        "stop-opacity", "font-family", "font-size", "font-style", "font-weight",
        "text-anchor", "letter-spacing", "clip-path",
      ],
    },
    allowedSchemes: [],
    allowProtocolRelative: false,
    parser: { lowerCaseTags: false, lowerCaseAttributeNames: false },
  }).trim();
  if (!cleaned.startsWith("<svg") || !cleaned.endsWith("</svg>")) return null;
  if (/\b(?:href|src|style|on\w+)\s*=/i.test(cleaned)) return null;
  return cleaned;
}

function checkoutGrant(event, packs, currency) {
  if (!event || !["checkout.session.completed", "checkout.session.async_payment_succeeded"].includes(event.type)) {
    return null;
  }
  const session = event.data && event.data.object;
  if (!session || session.payment_status !== "paid") return null;
  const packId = session.metadata && session.metadata.pack_id;
  const pack = packs[packId];
  if (!pack) return null;
  if (session.currency !== currency || session.amount_total !== pack.price) return null;
  const userId = (session.metadata && session.metadata.user_id) || session.client_reference_id;
  if (!userId) return null;
  return {
    userId,
    credits: pack.credits,
    packId,
    sessionId: session.id,
    amountTotal: session.amount_total,
    currency: session.currency,
  };
}

function normalizePublicOrigin(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) return null;
    if (url.protocol === "http:" && !["localhost", "127.0.0.1"].includes(url.hostname)) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function summarizeMonetization({
  profiles = [],
  ledger = [],
  events = [],
  usage = [],
  purchases = [],
  sessions = [],
  since = null,
  currency = "usd",
} = {}) {
  const sinceMs = since ? Date.parse(since) : 0;
  const inPeriod = (row) => !sinceMs || Date.parse(row.created_at || 0) >= sinceMs;
  const periodLedger = ledger.filter(inPeriod);
  const reasonTotals = {};
  for (const row of periodLedger) {
    if (!reasonTotals[row.reason]) reasonTotals[row.reason] = { entries: 0, credits: 0 };
    reasonTotals[row.reason].entries += 1;
    reasonTotals[row.reason].credits += Number(row.delta) || 0;
  }

  const eventOrder = [
    "world_selected",
    "setup_completed",
    "story_started",
    "story_completed",
    "checkout_opened",
    "purchase_completed",
  ];
  const funnel = Object.fromEntries(eventOrder.map((event) => [
    event,
    { events: 0, readers: 0 },
  ]));
  const actors = Object.fromEntries(eventOrder.map((event) => [event, new Set()]));
  const worlds = {};
  for (const row of events.filter(inPeriod)) {
    if (!funnel[row.event]) continue;
    funnel[row.event].events += 1;
    if (row.actor_key) actors[row.event].add(row.actor_key);
    if (row.world_id) {
      if (!worlds[row.world_id]) worlds[row.world_id] = { selected: 0, completed: 0 };
      if (row.event === "world_selected") worlds[row.world_id].selected += 1;
      if (row.event === "story_completed") worlds[row.world_id].completed += 1;
    }
  }
  for (const event of eventOrder) funnel[event].readers = actors[event].size;

  const usageTotals = usage.filter(inPeriod).reduce((acc, row) => {
    acc.requests += 1;
    acc.inputTokens += Number(row.input_tokens) || 0;
    acc.outputTokens += Number(row.output_tokens) || 0;
    acc.estimatedCostMicros += Number(row.estimated_cost_micros) || 0;
    if (row.status !== "ok") acc.failed += 1;
    return acc;
  }, { requests: 0, failed: 0, inputTokens: 0, outputTokens: 0, estimatedCostMicros: 0 });

  const paid = purchases.filter((row) =>
    inPeriod(row) && String(row.currency || "").toLowerCase() === currency.toLowerCase());
  const revenueCents = paid.reduce((sum, row) => sum + (Number(row.amount_total) || 0), 0);

  const latestLedger = new Map();
  for (const row of ledger) {
    if (!latestLedger.has(row.user_id)) latestLedger.set(row.user_id, row.balance_after);
  }
  let reconciliationMismatches = 0;
  for (const profile of profiles) {
    const expected = latestLedger.has(profile.id) ? Number(latestLedger.get(profile.id)) : 0;
    if (Number(profile.credits) !== expected) reconciliationMismatches += 1;
  }

  return {
    overview: {
      accounts: profiles.length,
      outstandingCredits: profiles.reduce((sum, row) => sum + (Number(row.credits) || 0), 0),
      storySessions: sessions.length,
      purchases: paid.length,
      revenueCents,
      estimatedCostMicros: usageTotals.estimatedCostMicros,
      contributionBeforeFeesMicros: revenueCents * 10_000 - usageTotals.estimatedCostMicros,
    },
    credits: reasonTotals,
    funnel,
    worlds: Object.entries(worlds)
      .map(([worldId, totals]) => ({ worldId, ...totals }))
      .sort((a, b) => b.selected - a.selected),
    usage: usageTotals,
    reconciliation: {
      profiles: profiles.length,
      mismatches: reconciliationMismatches,
      status: reconciliationMismatches === 0 ? "verified" : "mismatch",
    },
  };
}

function stringWithin(value, min, max) {
  if (typeof value !== "string") return null;
  const clean = value.trim();
  return clean.length >= min && clean.length <= max ? clean : null;
}

function optionalStringWithin(value, max) {
  if (value == null || value === "") return "";
  return stringWithin(value, 1, max);
}

module.exports = {
  checkoutGrant,
  cleanStoryInputs,
  hashValue,
  normalizePublicOrigin,
  sanitizeSvg,
  summarizeMonetization,
  validateHistory,
};
