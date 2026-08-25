"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "privacy.html"), "utf8");

test("the public privacy policy contains no drafting placeholders", () => {
  assert.doesNotMatch(html, /Draft for legal review|Counsel to|\[PRIVACY|\[OPERATOR|\[MINIMUM AGE/);
  assert.match(html, /Beta privacy note/);
});

test("the privacy policy accurately describes story generation and reader controls", () => {
  assert.match(html, /sent through Larkspin’s server to our AI provider/);
  assert.match(html, /export your Larkspin data/);
  assert.match(html, /permanently delete your account/);
  assert.match(html, /do not sell your personal information/);
});

test("the privacy policy limits Larkspin to adults", () => {
  assert.match(html, /only for people who are 18 or older/);
  assert.match(html, /under 18 may not use the Service, create an account, make a purchase/);
});

test("the privacy policy states the operational retention schedule", () => {
  assert.match(html, /AI usage records are normally deleted after 180 days/);
  assert.match(html, /rate-limit buckets after 48 hours/);
  assert.match(html, /abandoned, uncharged generation sessions after 24 hours/);
  assert.match(html, /resolved abuse reports after 365 days/);
  assert.match(html, /immutable story-credit ledger/);
});
