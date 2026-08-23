"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { repairBuiltinWorldRow } = require("../lib/catalog-repair");
const { extractCatalogue } = require("../tools/build-worlds");

const builtin = {
  id: "fantasy",
  ornament: "♜",
  archetypes: [{ title: "The Exile", blurb: "A lost heir", ornament: "♜" }],
};

test("repairs inherited casts and fallback ornaments without changing stories", () => {
  const stories = [{ title: "The Shattered Crown", premise: "An old oath", custom: true }];
  const row = {
    id: "fantasy",
    draft_data: { ornament: "❦", archetypes: [], stories },
    published_data: { ornament: "❦", archetypes: [], stories },
  };

  const repaired = repairBuiltinWorldRow(row, builtin);
  assert.deepEqual(repaired.draft_data.archetypes, builtin.archetypes);
  assert.equal(repaired.published_data.ornament, "♜");
  assert.deepEqual(repaired.published_data.stories, stories);
  assert.deepEqual(row.published_data, { ornament: "❦", archetypes: [], stories });
});

test("leaves legitimate Studio edits and already-healthy rows untouched", () => {
  const customCast = [{ title: "The Archivist" }];
  const row = {
    id: "fantasy",
    draft_data: { ornament: "★", archetypes: customCast },
    published_data: { ornament: "★", archetypes: customCast },
  };

  assert.equal(repairBuiltinWorldRow(row, builtin), null);
});

test("the generated repair catalog stays in sync with the browser catalog", () => {
  const source = fs.readFileSync(path.join(__dirname, "..", "public", "app.js"), "utf8");
  assert.deepEqual(require("../lib/builtin-catalog.json"), extractCatalogue(source));
});
