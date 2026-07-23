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
  return { userId, credits: pack.credits, packId, sessionId: session.id };
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
  validateHistory,
};
