"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
const home = fs.readFileSync(path.join(root, "public", "index.html"), "utf8");
const share = fs.readFileSync(path.join(root, "public", "share.html"), "utf8");

test("production cannot silently fall back to a charging demo", () => {
  assert.match(server, /process\.env\.NODE_ENV === "production"/);
  assert.match(server, /ALLOW_DEMO_IN_PRODUCTION !== "1"/);
  assert.match(server, /Refusing to start production in demo mode/);
  assert.doesNotMatch(home, /ANTHROPIC_API_KEY/);
});

test("ordinary homepage responses strip staff and pilot interfaces", () => {
  assert.match(home, /PRIVATE_ADMIN_UI_START/);
  assert.match(home, /PILOT_UI_START/);
  assert.match(server, /const publicHomeTemplate = pilotUi\.publicTemplate/);
  assert.match(server, /app\.get\(\["\/", "\/index\.html"\]/);
  assert.match(server, /express\.static\([^\n]+\{ index: false \}\)/);
});

test("crawler-visible pages include descriptions and sharing metadata", () => {
  assert.match(home, /<meta name="description"/);
  assert.match(home, /property="og:title"/);
  assert.match(home, /property="og:image"/);
  assert.match(share, /\{\{SHARE_TITLE\}\}/);
  assert.match(share, /\{\{SHARE_DESCRIPTION\}\}/);
  assert.match(server, /replaceAll\("\{\{SHARE_TITLE\}\}"/);
  assert.match(server, /app\.get\("\/s\/:id\/card\.png"/);
});

test("the homepage price is rendered on the server", () => {
  assert.match(home, /\{\{PRICE_NOTE_FIGURE\}\}/);
  assert.match(server, /function renderPublicHome\(\)/);
  assert.match(server, /replaceAll\("\{\{PRICE_NOTE_FIGURE\}\}"/);
  assert.match(server, /const singlePrice = displayPrice\(single\.price\)/);
});
