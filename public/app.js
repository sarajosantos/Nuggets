// Nuggets Adventure — frontend. All story state lives here (and in
// localStorage); the server is stateless and just streams chapters.

const SCENARIOS = [
  {
    id: "fantasy",
    emoji: "🗡️",
    title: "The Shattered Crown",
    premise:
      "The old king is dead, his crown broken into five shards scattered across a fractured realm. Whoever reunites them rules — and something older than any kingdom is also hunting the pieces.",
    tone: "Epic fantasy: sweeping, perilous, wondrous. Moral choices with real costs.",
  },
  {
    id: "scifi",
    emoji: "🛰️",
    title: "Signal from Europa",
    premise:
      "A repeating signal from beneath Europa's ice has gone silent — along with the twelve-person research station that found it. Your ship is six days out, and the only one close enough to answer.",
    tone: "Hard sci-fi thriller: claustrophobic, awe-struck, scientifically grounded dread.",
  },
  {
    id: "mystery",
    emoji: "🕵️",
    title: "The Glass House Murders",
    premise:
      "A reclusive tycoon is found dead in his famous glass mansion the night of a storm, seven guests trapped inside with the body — and every one of them, including you, has something to hide.",
    tone: "Golden-age murder mystery: sharp dialogue, red herrings, a ticking clock until dawn.",
  },
  {
    id: "horror",
    emoji: "🕯️",
    title: "The Hollow Below",
    premise:
      "Your grandmother's will left you the house on Merrow Lane — and a letter begging you to brick up the cellar without ever opening the door at the bottom of the stairs. The door is already open.",
    tone: "Gothic horror: slow-burn dread, family secrets, the uncanny bleeding into the everyday.",
  },
  {
    id: "western",
    emoji: "🤠",
    title: "Red Dust Reckoning",
    premise:
      "You ride into the copper town of Providencia with a debt to settle and a name you no longer use. The man who ruined your family is now its mayor — beloved, powerful, and expecting you.",
    tone: "Revisionist western: dusty, morally gray, tense standoffs and hard-won loyalty.",
  },
  {
    id: "regency",
    emoji: "🎭",
    title: "A Season of Masks",
    premise:
      "London, 1813. You arrive for the Season with a dazzling reputation, an empty purse, and one chance to secure your family's future — while a rival from your past threatens to expose everything.",
    tone: "Regency romance with intrigue: wit, longing, ballroom politics, secrets behind fans.",
  },
];

const ARCHETYPES = [
  { id: "rogue", emoji: "🃏", title: "The Rogue", blurb: "Quick hands, quicker wit. Rules are suggestions." },
  { id: "scholar", emoji: "📖", title: "The Scholar", blurb: "Knowledge is your weapon — and your weakness." },
  { id: "soldier", emoji: "🛡️", title: "The Soldier", blurb: "Discipline and steel. You've seen too much." },
  { id: "diplomat", emoji: "🕊️", title: "The Diplomat", blurb: "Words open doors that force never could." },
  { id: "outcast", emoji: "🌒", title: "The Outcast", blurb: "You belong nowhere, which means you see everything." },
  { id: "visionary", emoji: "🔮", title: "The Visionary", blurb: "You glimpse what others can't — or won't." },
];

const TRAITS = ["Brave", "Cunning", "Compassionate", "Ruthless", "Curious", "Haunted"];

const SAVE_KEY = "nuggets-adventure-save-v1";

// ----- state -----
let state = {
  scenario: null,
  character: { name: "", archetype: null, trait: null },
  history: [], // raw messages: {role, content}
  chapters: [], // [{prose, action}] for rendering
};
let generating = false;

// ----- element refs -----
const $ = (id) => document.getElementById(id);
const screens = {
  scenario: $("screen-scenario"),
  character: $("screen-character"),
  story: $("screen-story"),
};

function showScreen(name) {
  Object.entries(screens).forEach(([k, el]) => el.classList.toggle("hidden", k !== name));
  window.scrollTo({ top: 0 });
}

// ----- boot -----
init();

async function init() {
  try {
    const cfg = await fetch("/api/config").then((r) => r.json());
    if (cfg.demo) $("demo-banner").classList.remove("hidden");
  } catch { /* config is cosmetic; ignore */ }

  renderScenarios();
  renderArchetypes();
  renderTraits();
  wireEvents();

  if (localStorage.getItem(SAVE_KEY)) $("resume-row").classList.remove("hidden");
}

// ----- screen 1: scenarios -----
function renderScenarios() {
  const grid = $("scenario-grid");
  grid.innerHTML = "";
  for (const s of SCENARIOS) {
    const card = document.createElement("button");
    card.className = "card";
    card.innerHTML = `<span class="card-emoji">${s.emoji}</span><h3>${s.title}</h3><p>${s.premise}</p>`;
    card.addEventListener("click", () => {
      state.scenario = s;
      $("character-scenario-label").textContent = `${s.emoji} ${s.title}`;
      showScreen("character");
      updateBeginButton();
    });
    grid.appendChild(card);
  }
}

// ----- screen 2: character -----
function renderArchetypes() {
  const grid = $("archetype-grid");
  grid.innerHTML = "";
  for (const a of ARCHETYPES) {
    const card = document.createElement("button");
    card.className = "card";
    card.dataset.id = a.id;
    card.innerHTML = `<span class="card-emoji">${a.emoji}</span><h3>${a.title}</h3><p>${a.blurb}</p>`;
    card.addEventListener("click", () => {
      state.character.archetype = a.title;
      grid.querySelectorAll(".card").forEach((c) => c.classList.toggle("selected", c === card));
      updateBeginButton();
    });
    grid.appendChild(card);
  }
}

function renderTraits() {
  const row = $("trait-row");
  row.innerHTML = "";
  for (const t of TRAITS) {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = t;
    chip.addEventListener("click", () => {
      state.character.trait = t;
      row.querySelectorAll(".chip").forEach((c) => c.classList.toggle("selected", c === chip));
      updateBeginButton();
    });
    row.appendChild(chip);
  }
}

function updateBeginButton() {
  const c = state.character;
  c.name = $("char-name").value.trim();
  $("begin-btn").disabled = !(c.name && c.archetype && c.trait);
}

// ----- events -----
function wireEvents() {
  $("char-name").addEventListener("input", updateBeginButton);
  $("back-to-scenarios").addEventListener("click", () => showScreen("scenario"));
  $("logo").addEventListener("click", () => { if (!generating) showScreen("scenario"); });

  $("begin-btn").addEventListener("click", startStory);
  $("resume-btn").addEventListener("click", resumeStory);
  $("new-story-btn").addEventListener("click", resetToStart);
  $("abandon-btn").addEventListener("click", () => {
    if (generating) return;
    if (confirm("Abandon this story? Your progress will be lost.")) resetToStart();
  });
  $("retry-btn").addEventListener("click", () => {
    $("error-area").classList.add("hidden");
    requestChapter();
  });

  $("custom-action-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const action = $("custom-action").value.trim();
    if (action) chooseAction(action, true);
  });
}

// ----- story flow -----
function startStory() {
  updateBeginButton();
  if ($("begin-btn").disabled) return;

  state.history = [
    {
      role: "user",
      content: "Begin the story. Write the opening chapter and introduce the protagonist in the middle of their world.",
    },
  ];
  state.chapters = [];
  openStoryScreen();
  requestChapter();
}

function resumeStory() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (!saved || !saved.scenario) throw new Error("bad save");
    state = saved;
    openStoryScreen();
    renderAllChapters();
    const last = lastAssistantText();
    if (last) showChoices(parseChoices(last));
    else requestChapter();
  } catch {
    localStorage.removeItem(SAVE_KEY);
    alert("Couldn't restore your saved story.");
    resetToStart();
  }
}

function resetToStart() {
  localStorage.removeItem(SAVE_KEY);
  state = { scenario: null, character: { name: "", archetype: null, trait: null }, history: [], chapters: [] };
  $("story-text").innerHTML = "";
  $("resume-row").classList.add("hidden");
  $("ending-area").classList.add("hidden");
  $("choices-area").classList.add("hidden");
  $("error-area").classList.add("hidden");
  showScreen("scenario");
}

function openStoryScreen() {
  $("story-title").textContent = `${state.scenario.title} · ${state.character.name}`;
  $("story-text").innerHTML = "";
  $("choices-area").classList.add("hidden");
  $("ending-area").classList.add("hidden");
  $("error-area").classList.add("hidden");
  updateChapterCount();
  showScreen("story");
}

function chooseAction(action, isCustom) {
  $("custom-action").value = "";
  hideChoices();
  appendPlayerAction(action);
  state.history.push({
    role: "user",
    content: isCustom
      ? `The player writes their own action: "${action}". Honor it within the fiction.`
      : `The player chooses: "${action}"`,
  });
  requestChapter();
}

async function requestChapter() {
  generating = true;
  $("typing-indicator").classList.remove("hidden");
  $("error-area").classList.add("hidden");

  const proseEl = document.createElement("div");
  proseEl.className = "chapter";
  $("story-text").appendChild(proseEl);

  let fullText = "";
  let failed = null;

  try {
    const res = await fetch("/api/story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scenario: { title: state.scenario.title, premise: state.scenario.premise, tone: state.scenario.tone },
        character: state.character,
        history: state.history,
      }),
    });
    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let idx;
      while ((idx = buf.indexOf("\n\n")) >= 0) {
        const line = buf.slice(0, idx).trim();
        buf = buf.slice(idx + 2);
        if (!line.startsWith("data: ")) continue;
        const evt = JSON.parse(line.slice(6));
        if (evt.type === "text") {
          fullText += evt.text;
          renderProse(proseEl, visiblePart(fullText));
          keepInView();
        } else if (evt.type === "error") {
          failed = evt.error;
        }
      }
    }
  } catch (err) {
    console.error(err);
    failed = "Couldn't reach the storyteller. Check your connection and try again.";
  }

  generating = false;
  $("typing-indicator").classList.add("hidden");

  if (failed || !fullText.trim()) {
    proseEl.remove();
    showError(failed || "The storyteller returned an empty page. Try again.");
    return;
  }

  state.history.push({ role: "assistant", content: fullText });
  state.chapters.push({ prose: visiblePart(fullText) });
  saveGame();
  updateChapterCount();

  const choices = parseChoices(fullText);
  showChoices(choices);
}

// ----- choices & endings -----
function parseChoices(text) {
  const m = text.match(/<choices>\s*(\[[\s\S]*?\])\s*<\/choices>/);
  if (!m) return null;
  try {
    const arr = JSON.parse(m[1]);
    return Array.isArray(arr) ? arr.filter((c) => typeof c === "string") : null;
  } catch {
    return null;
  }
}

function showChoices(choices) {
  if (choices && choices.length === 0) {
    // Empty array = the story has ended.
    $("ending-area").classList.remove("hidden");
    localStorage.removeItem(SAVE_KEY);
    return;
  }
  const btns = $("choice-buttons");
  btns.innerHTML = "";
  // If the model flubbed the format, still let the player type an action.
  for (const choice of choices || []) {
    const b = document.createElement("button");
    b.className = "choice-btn";
    b.textContent = choice;
    b.addEventListener("click", () => chooseAction(choice, false));
    btns.appendChild(b);
  }
  $("choices-area").classList.remove("hidden");
  keepInView();
}

function hideChoices() {
  $("choices-area").classList.add("hidden");
}

function showError(msg) {
  $("error-text").textContent = msg;
  $("error-area").classList.remove("hidden");
}

// ----- rendering -----
function visiblePart(fullText) {
  return fullText.split("<choices>")[0].trimEnd();
}

function renderProse(el, text) {
  el.innerHTML = text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function appendPlayerAction(action) {
  const div = document.createElement("div");
  div.innerHTML = `<p class="player-action">➤ ${escapeHtml(action)}</p><p class="chapter-break">· · ·</p>`;
  $("story-text").appendChild(div);
}

function renderAllChapters() {
  const container = $("story-text");
  container.innerHTML = "";
  state.chapters.forEach((ch, i) => {
    if (i > 0) {
      const actionMsg = state.history.filter((m) => m.role === "user")[i];
      const action = actionMsg ? actionMsg.content.match(/"([\s\S]*)"/) : null;
      const div = document.createElement("div");
      div.innerHTML = `<p class="player-action">➤ ${escapeHtml(action ? action[1] : "…")}</p><p class="chapter-break">· · ·</p>`;
      container.appendChild(div);
    }
    const el = document.createElement("div");
    el.className = "chapter";
    renderProse(el, ch.prose);
    container.appendChild(el);
  });
  window.scrollTo({ top: document.body.scrollHeight });
}

function updateChapterCount() {
  const n = state.chapters.length;
  $("chapter-count").textContent = n ? `Chapter ${n}` : "";
}

function keepInView() {
  // Only auto-scroll if the reader is already near the bottom.
  const nearBottom = window.innerHeight + window.scrollY > document.body.scrollHeight - 300;
  if (nearBottom) window.scrollTo({ top: document.body.scrollHeight });
}

function lastAssistantText() {
  for (let i = state.history.length - 1; i >= 0; i--) {
    if (state.history[i].role === "assistant") return state.history[i].content;
  }
  return null;
}

function saveGame() {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
