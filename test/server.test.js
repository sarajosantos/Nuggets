"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

process.env.DEMO_MODE = "1";
const { app } = require("../server");

let server;
let base;

test.before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test("serves strict browser security headers", async () => {
  const response = await fetch(base);
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-security-policy"), /default-src 'self'/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "SAMEORIGIN");
  assert.ok(response.headers.get("x-request-id"));
});

test("reports safe demo configuration", async () => {
  const response = await fetch(`${base}/api/config`);
  const config = await response.json();
  assert.equal(config.demo, true);
  assert.equal(config.creditsEnforced, false);
  assert.equal(config.payments, null);
});

test("rejects malformed story requests before streaming", async () => {
  const response = await fetch(`${base}/api/story`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  assert.equal(response.status, 400);
});

test("streams a server story id and completed demo chapter", async () => {
  const response = await fetch(`${base}/api/story`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      scenario: {
        title: "The Test World",
        premise: "A bounded premise.",
        tone: "Literary suspense",
      },
      character: {
        name: "Wren",
        archetype: "The Witness",
        trait: "Steady",
      },
      history: [{ role: "user", content: "Begin the story." }],
    }),
  });
  assert.equal(response.status, 200);
  const body = await response.text();
  assert.match(body, /"type":"story","storyId":"[0-9a-f-]+"/);
  assert.match(body, /"type":"done"/);
});
