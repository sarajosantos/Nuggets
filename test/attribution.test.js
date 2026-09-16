"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { normalizeSource, summarizeMonetization } = require("../lib/core");

const root = path.join(__dirname, "..");
const core = fs.readFileSync(path.join(root, "lib", "core.js"), "utf8");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
const app = fs.readFileSync(path.join(root, "public", "app.js"), "utf8");
const html = fs.readFileSync(path.join(root, "views", "index.html"), "utf8");
const share = fs.readFileSync(path.join(root, "views", "share.html"), "utf8");
const privacy = fs.readFileSync(path.join(root, "public", "privacy.html"), "utf8");

// ---------------------------------------------------------------------------
// The validator
// ---------------------------------------------------------------------------

test("a bounded source is kept, and normalized to one spelling", () => {
  assert.equal(normalizeSource("direct"), "direct");
  assert.equal(normalizeSource("tag:booktok-sept"), "tag:booktok-sept");
  assert.equal(normalizeSource("via:reddit.com"), "via:reddit.com");
  // Case and surrounding space must not split one channel into several rows.
  assert.equal(normalizeSource("  TAG:BookTok-Sept  "), "tag:booktok-sept");
});

test("a malformed source is dropped rather than stored", () => {
  for (const value of [
    "",
    "   ",
    "booktok",                     // no prefix — we would not know what it is
    "utm:booktok",                 // not one of the two prefixes
    "tag:",                        // prefix with nothing after it
    "tag:-booktok",                // must open on a letter or digit
    "via:.reddit.com",
    "tag:book tok",                // space
    "tag:book/tok",                // slash
    "via:reddit.com<script>",
    `tag:${"a".repeat(49)}`,       // one past the cap
    "__proto__",
    "constructor",
    null,
    undefined,
    42,
    {},
    ["tag:booktok"],
  ]) {
    assert.equal(normalizeSource(value), null, `expected ${JSON.stringify(value)} to be dropped`);
  }
});

test("the source cap admits a real campaign tag and a real hostname", () => {
  assert.equal(normalizeSource(`tag:${"a".repeat(48)}`), `tag:${"a".repeat(48)}`);
  assert.equal(normalizeSource("via:forum.interactive-fiction.example.org"), "via:forum.interactive-fiction.example.org");
});

// ---------------------------------------------------------------------------
// Writing it down
// ---------------------------------------------------------------------------

test("the server allowlists the source on product events", () => {
  assert.match(server, /normalizeSource\(metadata\.source\)/);
  assert.match(server, /safeMetadata\.source = source/);
});

test("the browser and the server agree on what a source looks like", () => {
  // public/ has no build step, so the pattern cannot be shared as a module. If
  // the two copies drift, the browser sends values the server silently drops
  // and a channel reports zero readers with nothing to explain it.
  const fromCore = core.match(/^const SOURCE_PATTERN = (\/.*\/);$/m);
  const fromApp = app.match(/^const SOURCE_PATTERN = (\/.*\/);$/m);
  assert.ok(fromCore, "lib/core.js should declare SOURCE_PATTERN");
  assert.ok(fromApp, "public/app.js should declare SOURCE_PATTERN");
  assert.equal(fromApp[1], fromCore[1]);
});

test("the browser settles the source before the URL can be rewritten", () => {
  // handleCheckoutReturn() strips the query string. If the source were first
  // read after that, a reader returning from Stripe would lose the tag they
  // arrived with.
  const initBody = app
    .slice(app.indexOf("async function init()"))
    .replace(/\/\/[^\n]*/g, ""); // comments may mention await; code is the claim
  assert.ok(
    initBody.indexOf("readerSource()") < initBody.indexOf("await"),
    "init() should settle the source before its first await",
  );
});

test("first touch wins: stored source is read before the URL", () => {
  const body = app.slice(app.indexOf("function readerSource()"), app.indexOf("function productSessionId()"));
  assert.ok(
    body.indexOf("sessionStorage.getItem(READER_SOURCE_KEY)") < body.indexOf("firstTouchSource()"),
    "readerSource() should prefer the stored value over recomputing from the URL",
  );
});

test("a campaign tag is normalized but never rewritten", () => {
  // Case and space are cosmetic and safe to fix. Substituting the remaining
  // characters is not: it would let any crafted link mint its own row in the
  // publisher's ledger, which staff read to decide where to spend.
  const body = app.slice(app.indexOf("function normalizeTag("), app.indexOf("function referrerSource("));
  assert.match(body, /\.trim\(\)\.toLowerCase\(\)/);
  assert.doesNotMatch(body, /\.replace\(/);
  assert.match(body, /SOURCE_PATTERN\.test\(`tag:\$\{clean\}`\)/);
});

test("our own pages and the Stripe return leg are not channels", () => {
  assert.match(app, /url\.hostname === window\.location\.hostname/);
  assert.match(app, /params\.has\("checkout"\)/);
});

test("shared stories link home with a source tag", () => {
  // The referrer from a share page is our own host, which is deliberately
  // ignored, so without the tag every reader arriving from a shared story
  // lands in "direct".
  assert.doesNotMatch(share, /href="\/"/);
  assert.match(share, /href="\/\?ref=share"/);
});

// ---------------------------------------------------------------------------
// Reading it back
// ---------------------------------------------------------------------------

test("the ledger breaks the activation funnel down by source", () => {
  const summary = summarizeMonetization({
    events: [
      { event: "world_selected", actor_key: "anon:a", metadata: { source: "tag:booktok" }, created_at: "2026-07-02" },
      { event: "setup_completed", actor_key: "anon:a", metadata: { source: "tag:booktok" }, created_at: "2026-07-02" },
      { event: "story_started", actor_key: "anon:a", metadata: { source: "tag:booktok" }, created_at: "2026-07-02" },
      // Same reader, same source, twice — readers are unique, events are not.
      { event: "world_selected", actor_key: "anon:a", metadata: { source: "tag:booktok" }, created_at: "2026-07-02" },
      { event: "world_selected", actor_key: "anon:b", metadata: { source: "via:reddit.com" }, created_at: "2026-07-02" },
      { event: "purchase_completed", actor_key: "anon:b", metadata: { source: "via:reddit.com" }, created_at: "2026-07-02" },
    ],
    since: "2026-07-01",
  });
  const bySource = Object.fromEntries(summary.sources.map((row) => [row.source, row]));

  assert.equal(summary.sources.length, 2);
  assert.equal(bySource["tag:booktok"].kind, "tag");
  assert.equal(bySource["tag:booktok"].readers, 1);
  assert.equal(bySource["tag:booktok"].funnel.world_selected, 1);
  assert.equal(bySource["tag:booktok"].funnel.story_started, 1);
  assert.equal(bySource["via:reddit.com"].kind, "via");
  assert.equal(bySource["via:reddit.com"].funnel.purchase_completed, 1);

  // The overall funnel still counts everyone, attributed or not.
  assert.equal(summary.funnel.world_selected.readers, 2);
});

test("an event with no source still counts, and a malformed one is ignored on read", () => {
  const summary = summarizeMonetization({
    events: [
      { event: "world_selected", actor_key: "anon:a", created_at: "2026-07-02" },
      { event: "world_selected", actor_key: "anon:b", metadata: {}, created_at: "2026-07-02" },
      { event: "world_selected", actor_key: "anon:c", metadata: { source: "not a source" }, created_at: "2026-07-02" },
      { event: "world_selected", actor_key: "anon:d", metadata: { source: "direct" }, created_at: "2026-07-02" },
    ],
    since: "2026-07-01",
  });
  assert.equal(summary.funnel.world_selected.readers, 4);
  assert.deepEqual(summary.sources.map((row) => row.source), ["direct"]);
  assert.equal(summary.sources[0].kind, "direct");
});

test("sources are ordered by readers so the busiest channel reads first", () => {
  const event = (actor, source) =>
    ({ event: "world_selected", actor_key: actor, metadata: { source }, created_at: "2026-07-02" });
  const summary = summarizeMonetization({
    events: [
      event("anon:a", "tag:quiet"),
      event("anon:b", "via:busy.example"),
      event("anon:c", "via:busy.example"),
    ],
    since: "2026-07-01",
  });
  assert.deepEqual(summary.sources.map((row) => row.source), ["via:busy.example", "tag:quiet"]);
});

// ---------------------------------------------------------------------------
// Telling readers, and telling staff
// ---------------------------------------------------------------------------

test("the publisher's ledger shows where readers come from", () => {
  assert.match(html, /id="admin-sources"/);
  assert.match(html, /Where readers come from/);
  assert.match(app, /\$\("admin-sources"\)\.innerHTML/);
});

test("the privacy policy discloses what is recorded about how a reader arrived", () => {
  assert.match(privacy, /How you found us/);
  assert.match(privacy, /campaign tag in the link you followed/);
  assert.match(privacy, /never the full address/);
  assert.match(privacy, /not to build a profile of you or to track you across other sites/);
  assert.match(privacy, /for the current browsing session only, how you found us/);
});
