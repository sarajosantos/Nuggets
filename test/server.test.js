"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

process.env.DEMO_MODE = "1";
const { app } = require("../server");

const shareFile = path.join(__dirname, "..", "data", "stories.json");
const originalShares = fs.existsSync(shareFile) ? fs.readFileSync(shareFile) : null;

let server;
let base;

test.before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  if (originalShares) fs.writeFileSync(shareFile, originalShares);
  else if (fs.existsSync(shareFile)) fs.unlinkSync(shareFile);
});

test("serves strict browser security headers", async () => {
  const response = await fetch(base);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-security-policy"), /default-src 'self'/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.ok(response.headers.get("x-request-id"));
});

test("serves a crawler-ready public homepage without private interfaces", async () => {
  const response = await fetch(base);
  const html = await response.text();
  assert.match(html, /<meta name="description"/);
  assert.match(html, /property="og:title"/);
  assert.doesNotMatch(html, /Publisher’s ledger/);
  assert.doesNotMatch(html, /Story Studio/);
  assert.doesNotMatch(html, /pilot-feedback-modal/);
  assert.doesNotMatch(html, /ANTHROPIC_API_KEY/);
  assert.doesNotMatch(html, /\{\{PRICE_NOTE_/);
});

test("does not serve staff UI without server authorization", async () => {
  const response = await fetch(`${base}/api/admin/ui`);
  assert.notEqual(response.status, 200);
});

test("reports safe demo configuration", async () => {
  const response = await fetch(`${base}/api/config`);
  const config = await response.json();
  assert.equal(config.demo, true);
  assert.equal(config.creditsEnforced, false);
  assert.equal(config.creditSystem, false);
  assert.equal(config.payments, null);
});

test("rejects malformed story requests before streaming", async () => {
  const response = await fetch(`${base}/api/story`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  assert.equal(response.status, 400);
});

test("streams a server story id and completed demo chapter", async () => {
  const response = await fetch(`${base}/api/story`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      scenario: {
        title: "The Test World",
        premise: "A bounded premise.",
        tone: "Literary suspense",
      },
      character: {
        name: "Wren",
        archetype: "The Witness",
        trait: "Steady",
      },
      history: [{ role: "user", content: "Begin the story." }],
    }),
  });
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /"type":"story","storyId":"[0-9a-f-]+"/);
  assert.match(body, /"type":"done"/);
});

test("renders story-specific sharing metadata for crawlers", async () => {
  const published = await fetch(`${base}/api/share`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: "The Clockwork Orchard",
      scenario: { title: "A Mechanical Spring" },
      character: { name: "Mara", archetype: "The Gardener", trait: "Curious" },
      chapters: [{ prose: "At dawn, every brass pear in the orchard begins to sing." }],
    }),
  });
  assert.equal(published.status, 200);
  const { id } = await published.json();

  const page = await fetch(`${base}/s/${id}`);
  const html = await page.text();
  assert.match(html, /The Clockwork Orchard — Larkspin/);
  assert.match(html, /At dawn, every brass pear in the orchard begins to sing/);
  assert.match(html, new RegExp(`/s/${id}/card\\.png`));
  assert.doesNotMatch(html, /\{\{SHARE_/);

  const card = await fetch(`${base}/s/${id}/card.png`);
  assert.equal(card.status, 200);
  assert.match(card.headers.get("content-type"), /image\/png/);
});
