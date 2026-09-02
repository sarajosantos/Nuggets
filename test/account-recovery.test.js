"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const html = fs.readFileSync(path.join(__dirname, "..", "public", "index.html"), "utf8");
const app = fs.readFileSync(path.join(__dirname, "..", "public", "app.js"), "utf8");

test("readers can request and complete password recovery", () => {
  assert.match(html, /id="forgot-password-btn"/);
  assert.match(html, /id="save-password-btn"/);
  assert.match(app, /resetPasswordForEmail\(email, \{ redirectTo \}\)/);
  assert.match(app, /event === "PASSWORD_RECOVERY"/);
  assert.match(app, /updateUser\(\{ password \}\)/);
  assert.match(app, /if \(mode === "recovery"\) saveRecoveredPassword\(\)/);
});

test("signed-in readers can request an email change", () => {
  assert.match(html, /id="account-new-email"/);
  assert.match(html, /id="change-email-btn"/);
  assert.match(app, /updateUser\(\{ email \}\)/);
});

test("public support links use the Larkspin inbox", () => {
  assert.match(html, /mailto:support@larkspin\.com/);
  for (const file of ["privacy.html", "terms.html"]) {
    const content = fs.readFileSync(path.join(__dirname, "..", "public", file), "utf8");
    assert.match(content, /mailto:support@larkspin\.com/);
  }
});
