#!/usr/bin/env node
// Story QA — audits a finished playthrough for protocol compliance, length,
// continuity, and choice quality. These are the checks a machine can make
// honestly; the taste questions live in docs/STORY_QA.md.
//
//   node test/story-qa.js path/to/transcript.json
//
// Transcript format:
// {
//   "meta": { "world","story","character":{name,archetype,trait},
//             "targetChapters":10, "hardCap":14,
//             "bannedTerms":["London"],          // optional world-breakers
//             "usage":[{in,out}]                 // optional, per chapter
//   },
//   "turns": [ { "action": null|"player action text", "raw": "<model output>" } ]
// }

const fs = require("fs");

const FAIL = "FAIL", WARN = "WARN", INFO = "INFO";
const findings = [];
const add = (sev, check, msg) => findings.push({ sev, check, msg });

// ---------- parsing ----------
function parseTurn(raw, i) {
  const stateM = raw.match(/<state>\s*([\s\S]*?)\s*<\/state>/);
  const choiceM = raw.match(/<choices>\s*([\s\S]*?)\s*<\/choices>/);
  const prose = raw.split(/<state>|<choices>/)[0].trimEnd();
  let ledger = null, choices = null;
  if (!stateM) add(FAIL, "protocol", `ch${i}: no <state> block`);
  else {
    try { ledger = JSON.parse(stateM[1]); }
    catch (e) { add(FAIL, "protocol", `ch${i}: <state> is not valid JSON — ${e.message}`); }
  }
  if (!choiceM) add(FAIL, "protocol", `ch${i}: no <choices> block`);
  else {
    try { choices = JSON.parse(choiceM[1]); }
    catch (e) { add(FAIL, "protocol", `ch${i}: <choices> is not valid JSON — ${e.message}`); }
  }
  if ((raw.match(/<state>/g) || []).length > 1) add(FAIL, "protocol", `ch${i}: multiple <state> blocks`);
  if ((raw.match(/<choices>/g) || []).length > 1) add(FAIL, "protocol", `ch${i}: multiple <choices> blocks`);
  if (/<\/?(state|choices)>/.test(prose)) add(FAIL, "protocol", `ch${i}: tag leaked into visible prose`);
  return { prose, ledger, choices, raw };
}

const words = (s) => (s.trim().match(/\S+/g) || []).length;

// ---------- checks ----------
function checkLedgerShape(t, i) {
  if (!t.ledger) return;
  const L = t.ledger;
  const shape = {
    title: (v) => typeof v === "string" && v.trim(),
    act: (v) => Number.isInteger(v) && v >= 1 && v <= 3,
    condition: (v) => typeof v === "string",
    inventory: Array.isArray,
    companions: Array.isArray,
    threads: Array.isArray,
  };
  for (const [k, ok] of Object.entries(shape)) {
    if (!(k in L)) add(FAIL, "ledger", `ch${i}: ledger missing "${k}"`);
    else if (!ok(L[k])) add(FAIL, "ledger", `ch${i}: ledger "${k}" has wrong type/value (${JSON.stringify(L[k])})`);
  }
  for (const c of L.companions || []) {
    if (!c || typeof c.name !== "string" || !c.name.trim())
      add(FAIL, "ledger", `ch${i}: companion entry without a name`);
    else if (typeof c.standing !== "string" || !c.standing.trim())
      add(WARN, "ledger", `ch${i}: companion "${c.name}" has no standing`);
  }
  if ((L.threads || []).length > 5)
    add(FAIL, "ledger", `ch${i}: ${L.threads.length} open threads (cap is 5)`);
}

function checkChoices(t, i, isLast) {
  if (!t.choices) return;
  if (isLast) {
    if (t.choices.length !== 0)
      add(FAIL, "choices", `final chapter must end with an empty array, got ${t.choices.length}`);
    return;
  }
  if (t.choices.length !== 3)
    add(FAIL, "choices", `ch${i}: ${t.choices.length} choices (must be exactly 3)`);
  t.choices.forEach((c, n) => {
    if (typeof c !== "string" || !c.trim()) return add(FAIL, "choices", `ch${i}: choice ${n + 1} is empty`);
    const w = words(c);
    if (w > 15) add(WARN, "choices", `ch${i}: choice ${n + 1} is ${w} words (limit 15) — "${c}"`);
  });
  // meaningfully different? high word overlap between two options is a smell
  const setOf = (s) => new Set(s.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/)
    .filter((w) => w.length > 3));
  for (let a = 0; a < t.choices.length; a++) {
    for (let b = a + 1; b < t.choices.length; b++) {
      const A = setOf(t.choices[a]), B = setOf(t.choices[b]);
      if (!A.size || !B.size) continue;
      const shared = [...A].filter((w) => B.has(w)).length;
      const j = shared / new Set([...A, ...B]).size;
      if (j >= 0.6) add(WARN, "choices",
        `ch${i}: choices ${a + 1} and ${b + 1} look like the same move (${Math.round(j * 100)}% overlap)`);
    }
  }
}

function checkLength(turns, meta) {
  const lens = turns.map((t) => words(t.prose));
  lens.forEach((w, idx) => {
    const i = idx + 1, isLast = idx === turns.length - 1;
    const hi = isLast ? 900 : 700;
    if (w < 400) add(WARN, "length", `ch${i}: ${w} words (floor 400)`);
    else if (w > hi) add(WARN, "length", `ch${i}: ${w} words (ceiling ${hi})`);
  });
  const total = lens.reduce((a, b) => a + b, 0);
  const mean = Math.round(total / lens.length);
  add(INFO, "length", `${turns.length} chapters · ${total} words total · ${mean} avg · range ${Math.min(...lens)}–${Math.max(...lens)}`);
  const cap = meta.hardCap || 14, target = meta.targetChapters || 10;
  if (turns.length > cap) add(FAIL, "length", `story ran ${turns.length} chapters, past the hard cap of ${cap}`);
  if (Math.abs(turns.length - target) > 3)
    add(WARN, "length", `story ran ${turns.length} chapters against a target of ~${target}`);
}

function checkArc(turns) {
  const acts = turns.map((t) => t.ledger && t.ledger.act).filter((a) => a != null);
  for (let i = 1; i < acts.length; i++)
    if (acts[i] < acts[i - 1]) add(FAIL, "arc", `act went backwards at ch${i + 1} (${acts[i - 1]} → ${acts[i]})`);
  if (acts.length && acts[acts.length - 1] !== 3)
    add(WARN, "arc", `story ends in act ${acts[acts.length - 1]}, not act 3`);
  if (!acts.includes(2)) add(WARN, "arc", "story never entered act 2");
  const last = turns[turns.length - 1];
  if (last.ledger && (last.ledger.threads || []).length)
    add(FAIL, "arc", `finale leaves ${last.ledger.threads.length} thread(s) open: ${JSON.stringify(last.ledger.threads)}`);
}

function checkTitleStability(turns) {
  const titles = [...new Set(turns.map((t) => t.ledger && t.ledger.title).filter(Boolean))];
  if (titles.length > 1)
    add(FAIL, "continuity", `title drifted across chapters: ${titles.map((t) => `"${t}"`).join(" vs ")}`);
  else if (titles.length) add(INFO, "continuity", `title held steady: "${titles[0]}"`);
}

// Levenshtein, for catching names that drift a letter or two
function ed(a, b) {
  const m = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 0; j <= b.length; j++) m[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return m[a.length][b.length];
}

function checkNameDrift(turns) {
  const names = new Set();
  turns.forEach((t) => (t.ledger && t.ledger.companions || []).forEach((c) => c && c.name && names.add(c.name)));
  const list = [...names];
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) {
      const d = ed(list[i].toLowerCase(), list[j].toLowerCase());
      if (d > 0 && d <= 2)
        add(FAIL, "continuity", `companion name may have drifted: "${list[i]}" vs "${list[j]}" (${d} char diff)`);
    }
  // every ledgered companion should actually appear in the prose somewhere
  const allProse = turns.map((t) => t.prose).join("\n");
  for (const n of list) {
    const first = n.split(/[\s,]+/)[0];
    if (first.length > 2 && !allProse.includes(first))
      add(WARN, "continuity", `companion "${n}" is in the ledger but never named in the prose`);
  }
}

// Significant, comparable tokens from a ledger string: drops possessives,
// parentheticals and short words, so "Fairweather's throat atomiser (concealed)"
// can be matched by prose that says "atomiser" or "Fairweather".
function tokens(s) {
  return String(s).toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/['’]s\b/g, "")
    .replace(/[^a-z\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 3);
}
const mentions = (prose, s) => tokens(s).some((t) => prose.includes(t));

function checkSilentDisappearance(turns) {
  // an item/companion that leaves the ledger should be accounted for in the
  // prose of the chapter where it vanished
  const keyOf = (t) => ({
    inv: new Set((t.ledger && t.ledger.inventory) || []),
    comp: new Set(((t.ledger && t.ledger.companions) || []).map((c) => c && c.name).filter(Boolean)),
  });
  for (let i = 1; i < turns.length; i++) {
    if (!turns[i].ledger || !turns[i - 1].ledger) continue;
    const prev = keyOf(turns[i - 1]), now = keyOf(turns[i]);
    const prose = turns[i].prose.toLowerCase();
    for (const item of prev.inv)
      if (!now.inv.has(item) && !mentions(prose, item))
        add(WARN, "continuity", `ch${i + 1}: "${item}" left the inventory without being mentioned`);
    for (const c of prev.comp)
      if (!now.comp.has(c) && !mentions(prose, c))
        add(WARN, "continuity", `ch${i + 1}: companion "${c}" left the ledger without appearing`);
  }
}

function checkVoice(turns, meta) {
  turns.forEach((t, idx) => {
    const i = idx + 1, p = t.prose;
    if (/^\s*(chapter|part)\b/i.test(p)) add(FAIL, "voice", `ch${i}: prose opens with a header`);
    // First person outside quotation marks. Unquoted speech (a recited letter,
    // a line of verse, a hypothetical said aloud) trips this legitimately, so
    // quote the match — a human can judge it at a glance.
    const undialogued = p.replace(/["“][^"”]*["”]/g, "");
    const fp = undialogued.match(/\b(?:I|I['’]m|I['’]ve)\s+\S+(?:\s+\S+){0,6}/);
    if (fp) add(WARN, "voice", `ch${i}: first person outside quote marks — "${fp[0].trim()}…" (verse or reported speech is fine)`);
    if (/^(previously|last time|after everything that had happened|when we last)/i.test(p.trim()))
      add(WARN, "voice", `ch${i}: opens with a recap`);
    if (/\byou (were|had been|walked|turned|said)\b/.test(p) && !/\byou (are|walk|turn|say|feel)\b/.test(p))
      add(WARN, "voice", `ch${i}: reads as past tense rather than present`);
    // world-breaking vocabulary (the "London in a fantasy kingdom" class of bug)
    for (const term of meta.bannedTerms || [])
      if (new RegExp(`\\b${term}\\b`, "i").test(p))
        add(FAIL, "voice", `ch${i}: world-breaking term "${term}" appears in the prose`);
    // the protagonist should stay themselves
    const pcFirst = ((meta.character && meta.character.name) || "").split(/\s+/)[0];
    if (pcFirst && idx === 0 && !p.includes(pcFirst))
      add(INFO, "voice", `ch1: protagonist's name "${pcFirst}" never appears (fine in 2nd person, just noting)`);
  });
}

function checkChoiceFollowThrough(turns) {
  // the action the player took should be visible in the chapter that answers it
  for (let i = 1; i < turns.length; i++) {
    const action = turns[i].action;
    if (!action) continue;
    const keys = action.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/)
      .filter((w) => w.length > 4);
    if (!keys.length) continue;
    const prose = turns[i].prose.toLowerCase();
    const hit = keys.filter((k) => prose.includes(k.slice(0, Math.max(4, k.length - 2)))).length;
    if (hit === 0)
      add(WARN, "agency", `ch${i + 1}: no trace of the player's action — "${action}"`);
  }
  // never offer the identical choice twice
  const seen = new Map();
  turns.forEach((t, idx) => (t.choices || []).forEach((c) => {
    const k = c.toLowerCase().trim();
    if (seen.has(k)) add(WARN, "choices", `choice repeated verbatim in ch${seen.get(k)} and ch${idx + 1}: "${c}"`);
    else seen.set(k, idx + 1);
  }));
}

function checkPayoff(turns) {
  // the finale should call back to specifics established early
  if (turns.length < 4) return;
  const early = turns.slice(0, 3);
  const proper = new Set();
  early.forEach((t) => {
    ((t.ledger && t.ledger.companions) || []).forEach((c) => c && c.name && proper.add(c.name.split(/\s+/)[0]));
    ((t.ledger && t.ledger.inventory) || []).forEach((it) => {
      const h = String(it).split(/\s+/).filter((w) => w.length > 4)[0];
      if (h) proper.add(h);
    });
  });
  const finale = turns[turns.length - 1].prose;
  const hits = [...proper].filter((p) => finale.includes(p));
  if (proper.size && !hits.length)
    add(WARN, "payoff", "finale calls back to nothing established in the first three chapters");
  else if (proper.size)
    add(INFO, "payoff", `finale pays off ${hits.length}/${proper.size} early specifics: ${hits.join(", ")}`);
}

function reportCost(meta, turns) {
  const usage = meta.usage;
  if (!usage || !usage.length) return;
  const inTok = usage.reduce((a, u) => a + (u.in || 0), 0);
  const outTok = usage.reduce((a, u) => a + (u.out || 0), 0);
  const inRate = Number(process.env.MODEL_INPUT_USD_PER_MILLION || 0);
  const outRate = Number(process.env.MODEL_OUTPUT_USD_PER_MILLION || 0);
  const cost = (inTok / 1e6) * inRate + (outTok / 1e6) * outRate;
  add(INFO, "cost", `${inTok} in / ${outTok} out tokens over ${turns.length} chapters` +
    (inRate || outRate ? ` · est $${cost.toFixed(2)} per story` : " · set MODEL_*_USD_PER_MILLION for a cost estimate"));
}

// ---------- run ----------
function main() {
  const path = process.argv[2];
  if (!path) { console.error("usage: node test/story-qa.js <transcript.json>"); process.exit(2); }
  const doc = JSON.parse(fs.readFileSync(path, "utf8"));
  const meta = doc.meta || {};
  const turns = (doc.turns || []).map((t, i) => Object.assign(parseTurn(t.raw, i + 1), { action: t.action }));
  if (!turns.length) { console.error("transcript has no turns"); process.exit(2); }

  turns.forEach((t, i) => {
    checkLedgerShape(t, i + 1);
    checkChoices(t, i + 1, i === turns.length - 1);
  });
  checkLength(turns, meta);
  checkArc(turns);
  checkTitleStability(turns);
  checkNameDrift(turns);
  checkSilentDisappearance(turns);
  checkVoice(turns, meta);
  checkChoiceFollowThrough(turns);
  checkPayoff(turns);
  reportCost(meta, turns);

  const order = { FAIL: 0, WARN: 1, INFO: 2 };
  findings.sort((a, b) => order[a.sev] - order[b.sev] || a.check.localeCompare(b.check));
  const head = `${meta.world || "?"} · ${meta.story || "?"} · ${(meta.character || {}).name || "?"}`;
  console.log(`\nSTORY QA — ${head}\n${"─".repeat(Math.max(20, head.length + 11))}`);
  for (const sev of ["FAIL", "WARN", "INFO"]) {
    const rows = findings.filter((f) => f.sev === sev);
    if (!rows.length) continue;
    console.log(`\n${sev} (${rows.length})`);
    rows.forEach((f) => console.log(`  [${f.check}] ${f.msg}`));
  }
  const fails = findings.filter((f) => f.sev === FAIL).length;
  const warns = findings.filter((f) => f.sev === WARN).length;
  console.log(`\n${fails} blocking · ${warns} worth a look\n`);
  process.exit(fails ? 1 : 0);
}

main();
