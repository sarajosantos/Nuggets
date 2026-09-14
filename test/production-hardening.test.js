"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");
const home = fs.readFileSync(path.join(root, "views", "index.html"), "utf8");
const share = fs.readFileSync(path.join(root, "views", "share.html"), "utf8");

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

test("templates carrying private markup live outside the static root", () => {
  // Anything under public/ is reachable through express.static under every
  // spelling of its path, so a template holding staff UI cannot live there.
  const publicFiles = fs.readdirSync(path.join(root, "public"));
  assert.deepEqual(publicFiles.filter((name) => /^(index|share)\.html$/.test(name)), []);
  assert.match(server, /path\.join\(__dirname, "views", "index\.html"\)/);
  assert.match(server, /path\.join\(__dirname, "views", "share\.html"\)/);

  // And the pages that stay in public/ must hold neither private markup nor
  // placeholders, since they are served verbatim.
  for (const name of publicFiles.filter((f) => f.endsWith(".html"))) {
    const page = fs.readFileSync(path.join(root, "public", name), "utf8");
    assert.doesNotMatch(page, /PRIVATE_ADMIN_UI_START|PILOT_UI_START/, `${name} carries private markup`);
    assert.doesNotMatch(page, /\{\{[A-Z_]+\}\}/, `${name} carries an unsubstituted placeholder`);
  }
});

test("staff access is bound to a user id, not a claimable email address", () => {
  const staffId = "6f1b1d4e-8a2c-4f6e-9b21-2f0a1c7d3e55";
  process.env.ADMIN_USER_IDS = staffId;
  process.env.ADMIN_EMAILS = "staff@larkspin.com";
  // The module reads both lists at load, so evaluate a fresh copy.
  delete require.cache[require.resolve("../server")];
  const { isAdmin } = require("../server");

  assert.equal(isAdmin({ id: staffId }), true, "a listed user id is staff");
  assert.equal(isAdmin({ id: staffId.toUpperCase() }), true, "id matching is case-insensitive");

  // Supabase stamps email_confirmed_at at signup when "Confirm email" is off,
  // so a confirmed address is necessary but never sufficient on its own — the
  // id list is what actually establishes identity.
  assert.equal(
    isAdmin({ id: "11111111-1111-4111-8111-111111111111", email: "staff@larkspin.com" }),
    false,
    "an unconfirmed claim on a staff address is not staff",
  );
  assert.equal(
    isAdmin({ id: "11111111-1111-4111-8111-111111111111", email: "reader@example.com", email_confirmed_at: "2026-09-01T00:00:00Z" }),
    false,
    "an unlisted reader is never staff",
  );
  // The legacy list still works for a confirmed address, under either of the
  // two field names GoTrue has used, so existing staff keep their access.
  for (const confirmed of [{ email_confirmed_at: "2026-09-01T00:00:00Z" }, { confirmed_at: "2026-09-01T00:00:00Z" }]) {
    assert.equal(
      isAdmin({ id: "11111111-1111-4111-8111-111111111111", email: "staff@larkspin.com", ...confirmed }),
      true,
      `a confirmed staff address is staff (${Object.keys(confirmed)[0]})`,
    );
  }
  assert.equal(isAdmin(null), false);
  assert.equal(isAdmin({}), false);
});

test("the staff list warns when it is bound to email addresses alone", () => {
  assert.match(server, /ADMIN_EMAILS\.size && !ADMIN_USER_IDS\.size/);
  assert.match(server, /email_confirmed_at/);
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
