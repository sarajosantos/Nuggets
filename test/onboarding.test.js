"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "public", "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "public", "app.js"), "utf8");
const css = fs.readFileSync(path.join(root, "public", "style.css"), "utf8");
const share = fs.readFileSync(path.join(root, "public", "share.js"), "utf8");

test("first-time readers get a complete three-step orientation", () => {
  assert.match(html, /id="activation-intro"/);
  assert.match(html, /aria-label="How Plotwick works"/);
  assert.match(html, /Choose the trouble/);
  assert.match(html, /Become the protagonist/);
  assert.match(html, /Write the next turn/);
});

test("the activation flow offers a wired surprise route", () => {
  assert.match(html, /id="surprise-story"/);
  assert.match(app, /function openSurpriseStory\(\)/);
  assert.match(app, /\$\("surprise-story"\)\.addEventListener\("click", openSurpriseStory\)/);
});

test("character setup explains progress and preserves the selected premise", () => {
  assert.match(html, /aria-label="Story setup progress"/);
  assert.match(html, /id="character-premise"/);
  assert.match(app, /\$\("character-premise"\)\.textContent = s\.premise/);
});

test("returning readers can filter a progress-aware bookshelf", () => {
  assert.match(html, /id="library-filters"/);
  assert.match(app, /role="progressbar"/);
  assert.match(app, /libraryFilter === "finished"/);
  assert.match(app, /function formatLibraryDate\(timestamp\)/);
});

test("finished stories lead into deliberate next-story discovery", () => {
  assert.match(html, /id="ending-summary"/);
  assert.match(html, /id="next-world-btn"/);
  assert.match(app, /function renderEndingRitual\(\)/);
  assert.match(app, /function openAnotherInWorld\(\)/);
});

test("reading view keeps generated covers on the bookshelf only", () => {
  assert.doesNotMatch(app, /renderFrontispiece/);
  assert.doesNotMatch(css, /\.frontispiece/);
  assert.doesNotMatch(share, /story\.cover/);
});
