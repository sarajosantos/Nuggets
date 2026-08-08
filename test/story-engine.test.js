"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const server = fs.readFileSync(path.join(__dirname, "..", "server.js"), "utf8");

test("the story engine varies prose rhythm without prescribing a house voice", () => {
  assert.match(server, /Vary sentence and paragraph rhythm/);
  assert.match(server, /standalone fragments, italicized punch words, repeated clauses, and dramatic silence beats sparingly/);
  assert.match(server, /avoid relying on the same reveal cadence in consecutive chapters/);
});

test("chapter nine receives a gentle closing reminder without changing story length", () => {
  assert.match(server, /const TARGET_CHAPTERS = Number\(process\.env\.TARGET_CHAPTERS\) \|\| 10/);
  assert.match(server, /const HARD_CAP_CHAPTERS = TARGET_CHAPTERS \+ 4/);
  assert.match(server, /if \(chapterNum === t - 1\)/);
  assert.match(server, /Begin closing gently/);
  assert.match(server, /If the resolution arrives naturally, take it/);
});
