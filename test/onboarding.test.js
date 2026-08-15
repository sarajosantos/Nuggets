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

test("first-time readers get a concise orientation before the story shelf", () => {
  assert.match(html, /id="activation-intro"/);
  assert.match(html, /Choose a world, become its protagonist/);
  assert.doesNotMatch(html, /reader-ritual/);
});

test("the home page clearly sets beta expectations", () => {
  assert.match(html, /id="beta-notice"/);
  assert.match(html, /Founding reader beta/);
  assert.match(html, /for readers 18 and older/);
  assert.match(html, /Purchasing stories is optional/);
  assert.match(html, /complete stories to read now/);
  assert.match(html, /AI-generated stories can still surprise/);
  assert.match(html, /don’t include sensitive personal information/);
  assert.ok(html.indexOf('id="beta-notice"') < html.indexOf('id="scenario-grid"'));
});

test("account and purchase copy repeats the adult-only requirement", () => {
  assert.match(html, /confirm that you are at least 18 years old/);
  assert.match(html, /For readers 18 and older\. Secure checkout by Stripe/);
});

test("the activation flow offers a wired surprise route after the story shelf", () => {
  assert.match(html, /id="surprise-story"/);
  assert.ok(html.indexOf('id="surprise-story"') > html.indexOf('id="scenario-grid"'));
  assert.match(app, /function openSurpriseStory\(\)/);
  assert.match(app, /\$\("surprise-story"\)\.addEventListener\("click", openSurpriseStory\)/);
  assert.match(app, /\$\("activation-shortcut"\)\.classList\.toggle\("hidden", allEntries\.length > 0\)/);
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

test("the reading toolbar exposes only complete reader controls", () => {
  assert.doesNotMatch(html, /tts-toggle|Read aloud/i);
  assert.doesNotMatch(app, /speechSynthesis|SpeechSynthesisUtterance|ttsOn/);
  assert.match(html, /id="journal-toggle"/);
  assert.match(html, /id="view-toggle"/);
});

test("page view holds the reader's page while a chapter streams", () => {
  assert.match(app, /if \(paged\) detachFromBook\(\);/);
  assert.match(app, /el !== book\.lastElementChild\) book\.appendChild\(el\)/);
  assert.match(app, /pageTotal = generating \? Math\.max\(measuredTotal, pageIndex \+ 1\) : measuredTotal/);
  assert.match(app, /if \(!generating && pageIndex > pageTotal - 1\)/);
});

test("the world shelf stays stable and has generous page-turn controls", () => {
  assert.match(css, /\.world-card\s*\{[^}]*height:\s*23rem/s);
  assert.match(css, /\.world-choose\s*\{[^}]*height:\s*100%/s);
  assert.match(css, /\.carousel-arrow\s*\{[^}]*width:\s*2\.5rem[^}]*height:\s*3\.5rem[^}]*font-size:\s*2\.1rem/s);
  assert.match(css, /\.story-dots\s*\{[^}]*margin-top:\s*auto/s);
  assert.match(app, /id:\s*"romance",\s*ornament:\s*"♡"/s);
});
