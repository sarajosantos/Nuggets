"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "terms.html"), "utf8");
const shareHtml = fs.readFileSync(path.join(__dirname, "..", "public", "share.html"), "utf8");

test("the public terms contain no drafting placeholders", () => {
  assert.doesNotMatch(html, /Draft for legal review|Counsel to|\[OPERATOR|\[MINIMUM|\[GOVERNING|\[VENUE|\[TIME PERIOD|\[AMOUNT|\[SUPPORT/);
  assert.match(html, /Closed-beta terms/);
});

test("the terms make the adult-only rule unambiguous", () => {
  assert.match(html, /must be at least 18 years old to visit or use Plotwick/);
  assert.match(html, /People under 18 may not use the Service/);
  assert.match(html, /making a purchase, you confirm that you are 18 or older/);
  assert.match(shareHtml, /For readers 18\+/);
});

test("the terms explain beta purchases and failed-story restoration", () => {
  assert.match(html, /one purchased Wick begins one complete story/);
  assert.match(html, /return the Wick automatically/);
  assert.match(html, /mandatory consumer rights/);
});
