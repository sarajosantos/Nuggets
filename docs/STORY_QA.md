# Story QA

How to tell whether a Plotwick story is actually any good. Two halves: the
checks a machine can make honestly, and the ones only a reader can.

## 1. The automated pass

```bash
node tools/story-qa.js path/to/transcript.json
```

Exits non-zero if anything **blocking** is found. It reports three levels:
`FAIL` (protocol or continuity is broken), `WARN` (worth a human glance), and
`INFO` (measurements you want to see every run).

What it checks:

| Area | Checks |
|---|---|
| **Protocol** | one valid `<state>` and one `<choices>` per chapter; no tags leaking into prose; ledger keys present and correctly typed |
| **Choices** | exactly 3 (empty only in the finale); each under 15 words; no two options that are the same move in different words; no choice repeated verbatim across chapters |
| **Length** | 400–700 words per chapter (finale up to 900); total and average; story lands near `TARGET_CHAPTERS` and never passes the hard cap |
| **Arc** | act never goes backwards, reaches act 3, passes through act 2; **every thread closed by the finale**; threads never exceed 5 |
| **Continuity** | title identical in every chapter; companion names that drift by a letter or two (`Marchmont` → `Marchmond`); ledger entries that never appear in the prose; items and companions that vanish without explanation |
| **Voice** | no chapter headers; no recap openings; present tense holds; first person outside quote marks; per-world banned terms (the "London in a fantasy kingdom" class of bug) |
| **Agency** | the player's chosen action leaves a visible trace in the chapter that answers it |
| **Payoff** | the finale calls back to specifics established in the first three chapters |
| **Cost** | tokens in/out per story; set `MODEL_INPUT_USD_PER_MILLION` and `MODEL_OUTPUT_USD_PER_MILLION` for a dollar estimate |

### Capturing a transcript from a real playthrough

Play a story to the end on the live site, then in the browser console:

```js
// dumps the most recently updated story in the format story-qa.js expects
(() => {
  const key = Object.keys(localStorage).find(k => k.startsWith("plotwick-library-"));
  const lib = JSON.parse(localStorage.getItem(key));
  const s = Object.values(lib.stories).sort((a, b) => b.updatedAt - a.updatedAt)[0];
  const turns = [];
  s.history.forEach(m => {
    if (m.role === "user") turns.push({ action: m.content, raw: null });
    else {
      if (!turns.length) turns.push({ action: null, raw: null });
      turns[turns.length - 1].raw = m.content;
    }
  });
  copy(JSON.stringify({
    meta: { world: s.scenario.genre, story: s.scenario.title, character: s.character,
            targetChapters: 10, hardCap: 14 },
    turns: turns.filter(t => t.raw),
  }, null, 2));
  console.log("transcript copied to clipboard");
})();
```

Paste into a file and run the checker on it.

## 2. The reader's pass

Nothing above can tell you whether a story is *worth reading*. Score each of
these 1–5 after a full playthrough; anything at 2 or below is a prompt problem,
not a taste problem.

**Opening**
- Does chapter 1 start mid-motion, with no throat-clearing or scene-setting preamble?
- Is there a concrete hook by the end of the first few paragraphs?

**Chapter craft**
- Does *every* chapter change the situation irreversibly — something gained, lost, revealed, or broken?
- Concrete sensory detail rather than abstraction? Dialogue that sounds like speech?
- Does it end at a decision point where you genuinely don't know what you'd do?

**Choices and agency**
- Do the three options pull in real different directions (bold / careful / lateral)?
- Does your choice visibly change what happens next, not just the wording of it?
- When you type a free-form action, is it honored — and when it's impossible, does it fail *interestingly* rather than get refused?

**Character**
- Does your archetype and trait actually change how people treat you and how scenes resolve?
- Does the protagonist stay recognizably the same person throughout?

**Continuity as a reader feels it**
- Do named characters keep their names, histories, injuries, and grudges?
- Does anything contradict an earlier chapter?
- Do promises, debts, and items planted early come back?

**Pacing**
- Does the midpoint (around ch5) genuinely reframe what the story is about?
- Any chapter that feels like it's treading water?
- Does the climax arrive under its own steam rather than because the chapter cap forced it?

**Ending**
- Does the finale pay off *specific* choices you made, by name?
- Does it feel earned — triumphant, bittersweet, or tragic — rather than tidy?
- Are all the open questions actually answered?

**Tone**
- Does it read like the genre promised on the card, all the way through?
- Any modern idiom, anachronism, or vocabulary from a different world?

## 3. The bar

A story is shippable when:

- the automated pass reports **zero** `FAIL`s,
- every `WARN` has been looked at and consciously accepted,
- no reader-pass line scores below 3, and
- the story reached a real ending on its own, inside the chapter cap.

## 4. What still needs a live run

The transcript in this repo's QA history was played by hand against the
production system prompt and its per-chapter pacing notes — which tests the
*prompt*, and everything the checker measures. It does **not** test the live
model's sampling behaviour, latency, or cost, because that needs an API key and
a real playthrough. Before launch, run at least one full story per world on the
live site, capture it with the snippet above, and score it both ways.
