// Nuggets Adventure — AI choose-your-own-adventure server.
// Holds the Anthropic API key server-side and streams story chapters to the
// browser over Server-Sent Events. Story state lives on the client; every
// request carries the full history, so this server is stateless.

require("dotenv").config();
const express = require("express");
const path = require("path");
const Anthropic = require("@anthropic-ai/sdk");

const PORT = process.env.PORT || 3000;
const MODEL = process.env.STORY_MODEL || "claude-opus-4-8";
// Demo mode serves canned story content so the UI works with no API key.
// Set DEMO_MODE=1 to force it; it also activates automatically when no
// credentials are configured.
const DEMO_MODE =
  process.env.DEMO_MODE === "1" ||
  (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN);

const app = express();
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));

const client = DEMO_MODE ? null : new Anthropic();

const MAX_CHAPTER_TOKENS = 8000;

function buildSystemPrompt(scenario, character) {
  return `You are the narrator of an interactive novella — a "choose your own adventure" story told in rich, literary prose.

SCENARIO
Title: ${scenario.title}
Premise: ${scenario.premise}
Genre & tone: ${scenario.tone}

PROTAGONIST
Name: ${character.name}
Archetype: ${character.archetype}
Defining trait: ${character.trait}

HOW TO WRITE EACH CHAPTER
- Write in second person ("you"), present tense, addressing the protagonist.
- Each chapter should be 400–700 words of vivid, novella-quality prose: concrete sensory detail, real dialogue, momentum. No headers, no meta-commentary, no summarizing the rules.
- Weave the protagonist's archetype and trait into how events unfold and how other characters react.
- End every chapter at a genuine decision point where what happens next is truly uncertain.
- Maintain strict continuity with everything that has happened before. Named characters, injuries, items gained or lost, promises made — all of it persists.
- The player may also type a free-form action instead of picking a listed choice. Honor it faithfully if it is at all plausible in the fiction; if it is impossible, let the attempt fail interestingly rather than refusing it.
- Shape the story as a complete arc: rising stakes, a turning point, and a climax. Aim to reach a satisfying ending after roughly 8–12 chapters. Endings may be triumphant, bittersweet, or tragic — whatever the player's choices have earned.

OUTPUT FORMAT (follow exactly)
After the chapter prose, output the available choices as a JSON array of exactly 3 strings inside <choices> tags, like this:
<choices>["First option", "Second option", "Third option"]</choices>
Each choice should be a concrete action phrased in first person or imperative, under 15 words, and the three should be meaningfully different (not variations of the same move).
When — and only when — the story reaches its true ending, write the final scene, then output an empty array: <choices>[]</choices>`;
}

// SSE helpers -----------------------------------------------------------

function sseStart(res) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
}

function sseSend(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

// Routes ----------------------------------------------------------------

app.get("/api/config", (_req, res) => {
  res.json({ demo: DEMO_MODE, model: MODEL });
});

// Body: { scenario, character, history: [{role, content}, ...] }
// history is the raw message list: assistant turns are full chapter text
// (including the <choices> tag), user turns are the player's action.
app.post("/api/story", async (req, res) => {
  const { scenario, character, history } = req.body || {};
  if (!scenario || !character || !Array.isArray(history) || history.length === 0) {
    return res.status(400).json({ error: "scenario, character and non-empty history are required" });
  }

  sseStart(res);

  try {
    if (DEMO_MODE) {
      await streamDemoChapter(res, history);
    } else {
      const stream = client.messages.stream({
        model: MODEL,
        max_tokens: MAX_CHAPTER_TOKENS,
        thinking: { type: "adaptive" },
        system: buildSystemPrompt(scenario, character),
        messages: history,
      });

      stream.on("text", (text) => sseSend(res, { type: "text", text }));

      const final = await stream.finalMessage();

      if (final.stop_reason === "refusal") {
        sseSend(res, {
          type: "error",
          error: "The storyteller declined to continue this scene. Try a different action.",
        });
      } else if (final.stop_reason === "max_tokens") {
        sseSend(res, {
          type: "error",
          error: "The chapter ran too long and was cut off. Try again.",
        });
      } else {
        sseSend(res, { type: "done" });
      }
    }
  } catch (err) {
    console.error("story generation failed:", err);
    let message = "The storyteller hit a snag. Please try again.";
    if (err instanceof Anthropic.AuthenticationError) {
      message = "Server API key is invalid — check ANTHROPIC_API_KEY.";
    } else if (err instanceof Anthropic.RateLimitError) {
      message = "The storyteller is overwhelmed right now — wait a moment and try again.";
    }
    sseSend(res, { type: "error", error: message });
  }
  res.end();
});

// Demo mode -------------------------------------------------------------
// Streams canned chapters word-by-word so the whole UI can be exercised
// without an API key.

const DEMO_CHAPTERS = [
  `The rain has been falling for three days when the letter arrives — heavy cream paper, no return address, your name written in a hand you almost recognize. Inside, a single sentence: "They found it, and now they will come for you."

You stand at the window of your rented room a long while, watching the street below. A man in a grey coat has been leaning against the lamppost since noon, and he has not once looked at his newspaper.

The floorboard behind you creaks. You turn slowly. Your landlady, Mrs. Havisham, stands in the doorway holding a tray of tea she never brings. Her eyes flick — just once — toward the wardrobe in the corner, the one you were told never to open.

"You have a visitor downstairs," she says. Her voice is steady, but her hands are not. "I told them you were out. I don't think they believed me."

Below, the man in the grey coat has left the lamppost. The front door bell rings once. Twice.

<choices>["Open the wardrobe Mrs. Havisham glanced at", "Slip out the back window onto the fire escape", "Go downstairs and face the visitor directly"]</choices>`,

  `Your choice sets events in motion faster than you expected. The house seems to hold its breath around you — and then everything happens at once.

Glass breaks somewhere below. Mrs. Havisham seizes your wrist with surprising strength and presses something into your palm: a small brass key, warm as if she'd held it for years. "The station," she whispers. "Platform nine. Ask for the night porter, and show him this. Trust no one who calls you by your first name."

Footsteps on the stairs now — two sets, unhurried, the confident pace of men who believe there is no way out. Through the window, the street lamps flicker in sequence down the block, going dark one by one, as if something is walking the length of the street swallowing light as it comes.

Mrs. Havisham steps in front of the door. "I'll give you a minute," she says. "Make it count." For a moment she looks younger, and you understand with a chill that she has done this before — perhaps many times, perhaps for others like you who did not make it.

The key bites into your palm. The window stands open. The wardrobe door, you notice, has drifted ajar on its own, and from inside comes a faint smell of cold air and pine, as though it opens onto somewhere else entirely.

<choices>["Take the fire escape and run for the station", "Step into the wardrobe", "Stand with Mrs. Havisham and fight"]</choices>`,

  `The night porter's lantern swings shadows across the empty platform as he examines the brass key, turning it over twice. Somewhere behind you, in the city you are leaving, sirens begin to keen.

"Been a long time since I saw one of these," he says at last. He looks at you properly then — through you, almost — and nods as if confirming something. "You'd best come with me. The nine-fifteen doesn't stop here anymore. Not for most people, anyway."

He leads you past the shuttered ticket office to a door marked NO ENTRY, which opens onto a platform that should not exist: gaslit, immaculate, and utterly silent. A train waits there, dark green and gold, windows glowing amber. You can hear it breathing.

"One thing before you board." The porter's voice drops. "Whatever they told you was found — it wasn't lost. It was hidden. There's a difference, and the difference is the whole game. Someone hid it from someone, once, at terrible cost." He hands the key back. "Seat eleven. The compartment will know you."

As you step aboard, you feel the eyes of another passenger on you — a woman in a travelling cloak at the far end of the carriage, her face half in shadow. On the seat beside her rests a letter of heavy cream paper. Exactly like yours.

The train begins to move. There is no going back now — and the story, you sense, is only beginning to show you its true shape. Your journey has carried you as far as the demo can go.

<choices>[]</choices>`,
];

async function streamDemoChapter(res, history) {
  const assistantTurns = history.filter((m) => m.role === "assistant").length;
  const chapter = DEMO_CHAPTERS[Math.min(assistantTurns, DEMO_CHAPTERS.length - 1)];
  const words = chapter.split(/(\s+)/);
  for (const word of words) {
    sseSend(res, { type: "text", text: word });
    await new Promise((r) => setTimeout(r, 12));
  }
  sseSend(res, { type: "done" });
}

app.listen(PORT, () => {
  console.log(`Nuggets Adventure running at http://localhost:${PORT}`);
  console.log(DEMO_MODE
    ? "Mode: DEMO (no API key found — canned story content). Set ANTHROPIC_API_KEY for live stories."
    : `Mode: LIVE (model: ${MODEL})`);
});
