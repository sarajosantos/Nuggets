"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "public", "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "public", "app.js"), "utf8");

test("Story Studio presents archetypes as casting cards rather than JSON", () => {
  assert.match(html, /Default character cast/);
  assert.match(html, /Story-specific cast/);
  assert.match(html, /id="studio-world-archetypes" class="studio-archetype-list"/);
  assert.match(html, /id="studio-story-archetypes" class="studio-archetype-list"/);
  assert.doesNotMatch(html, /Character archetypes[^<]*JSON/i);
  assert.match(app, /data-archetype-field="title"/);
  assert.match(app, /data-archetype-field="blurb"/);
  assert.match(app, /data-archetype-field="ornament"/);
});

test("an empty story cast continues to inherit the world cast", () => {
  assert.match(app, /if \(studioStoryArchetypes\.length\) next\.archetypes/);
  assert.match(app, /else delete next\.archetypes/);
  assert.match(app, /This story uses the world’s default cast/);
});
