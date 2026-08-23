"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(root, "public", "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "public", "app.js"), "utf8");
const { catalogLimitError, cleanCatalogWorld } = require("../server");

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

test("Studio enforces eight roles and six traits on both client and server", () => {
  assert.match(app, /STUDIO_LIMITS = Object\.freeze\(\{ archetypes: 8, traits: 6 \}\)/);
  assert.match(html, /studio-world-archetype-count[^>]*>0 of 8/);
  assert.match(html, /studio-story-archetype-count[^>]*>0 of 8/);
  assert.match(html, /studio-trait-count[^>]*>0 of 6/);

  const roles = Array.from({ length: 9 }, (_, index) => ({ title: `Role ${index}` }));
  const traits = Array.from({ length: 7 }, (_, index) => `Trait ${index}`);
  assert.match(catalogLimitError({ archetypes: roles }), /up to 8/);
  assert.match(catalogLimitError({ traits }), /up to 6/);
  assert.match(catalogLimitError({ stories: [{ archetypes: roles }] }), /up to 8/);
  assert.equal(cleanCatalogWorld({ archetypes: roles, traits, stories: [] }, "test").archetypes.length, 8);
  assert.equal(cleanCatalogWorld({ archetypes: roles, traits, stories: [] }, "test").traits.length, 6);
});
