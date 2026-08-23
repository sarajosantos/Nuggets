"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.join(__dirname, "..");
const APP_JS = path.join(ROOT, "public", "app.js");
const DEFAULT_URL = "https://nuggets-development.up.railway.app/api/catalog";

function extractBundledCatalog(source) {
  const marker = "const SCENARIOS = ";
  const start = source.indexOf(marker);
  const end = source.indexOf("\n];", start);
  if (start === -1 || end === -1) throw new Error("could not extract SCENARIOS from public/app.js");
  return new vm.Script(`(${source.slice(start + marker.length, end + 2)})`).runInNewContext({});
}

function resolvedStory(world, story) {
  return {
    title: story.title,
    premise: story.premise,
    tone: story.tone || world.tone,
    question: story.question || world.question,
    namePlaceholder: story.namePlaceholder || world.namePlaceholder,
    names: story.names?.length ? story.names : world.names,
    traits: story.traits?.length ? story.traits : world.traits,
    archetypes: story.archetypes?.length ? story.archetypes : world.archetypes,
  };
}

function equal(left, right) {
  const canonical = (value) => {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === "object") {
      return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
    }
    return value;
  };
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

function auditCatalog(expected, live) {
  const issues = [];
  for (const expectedWorld of expected) {
    const liveWorld = live.find((world) => world.id === expectedWorld.id);
    if (!liveWorld) {
      issues.push(`${expectedWorld.id}: world is missing`);
      continue;
    }
    for (const field of ["ornament", "genre", "accent", "tone", "question", "namePlaceholder", "names", "traits", "archetypes"]) {
      if (!equal(expectedWorld[field], liveWorld[field])) issues.push(`${expectedWorld.id}: world ${field} differs`);
    }
    if (expectedWorld.stories.length !== liveWorld.stories.length) {
      issues.push(`${expectedWorld.id}: expected ${expectedWorld.stories.length} stories, found ${liveWorld.stories.length}`);
    }
    for (const expectedStory of expectedWorld.stories) {
      const liveStory = liveWorld.stories.find((story) => story.title === expectedStory.title);
      if (!liveStory) {
        issues.push(`${expectedWorld.id} / ${expectedStory.title}: story is missing`);
        continue;
      }
      const expectedResolved = resolvedStory(expectedWorld, expectedStory);
      const liveResolved = resolvedStory(liveWorld, liveStory);
      for (const field of Object.keys(expectedResolved)) {
        if (!equal(expectedResolved[field], liveResolved[field])) {
          issues.push(`${expectedWorld.id} / ${expectedStory.title}: resolved ${field} differs`);
        }
      }
    }
  }
  for (const liveWorld of live) {
    if (!expected.some((world) => world.id === liveWorld.id)) issues.push(`${liveWorld.id}: unexpected published world`);
  }
  return issues;
}

async function main() {
  const url = process.argv[2] || DEFAULT_URL;
  const expected = extractBundledCatalog(fs.readFileSync(APP_JS, "utf8"));
  const response = await fetch(url);
  if (!response.ok) throw new Error(`catalog request failed with ${response.status}`);
  const body = await response.json();
  const live = Array.isArray(body.worlds) ? body.worlds : [];
  const issues = auditCatalog(expected, live);
  console.log(`Audited ${live.length} worlds and ${live.reduce((count, world) => count + (world.stories?.length || 0), 0)} stories.`);
  if (issues.length) {
    for (const issue of issues) console.error(`- ${issue}`);
    process.exitCode = 1;
  } else {
    console.log("Catalog integrity check passed.");
  }
}

if (require.main === module) main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

module.exports = { auditCatalog, extractBundledCatalog, resolvedStory };
