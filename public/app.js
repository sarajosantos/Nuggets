// Plotwick — frontend. Story state lives here (and in localStorage
// as a multi-story library); the server streams chapters and stores shares.

// Each world carries a genre-appropriate accent used to color its card
// (ornament, label, border, and a faint plate wash) and its cover fallback —
// plus its own character-creation cast: a world-specific question, a name in
// the world's register, six archetypes in its voice, and six genre traits.
const SCENARIOS = [
  {
    id: "fantasy",
    ornament: "⚜",
    genre: "Epic fantasy",
    accent: "#5FB08A", // emerald
    title: "The Shattered Crown",
    premise:
      "The old king is dead, his crown broken into five shards scattered across a fractured realm. Whoever reunites them rules — and something older than any kingdom is also hunting the pieces.",
    tone: "Epic fantasy: sweeping, perilous, wondrous. Moral choices with real costs.",
    question: "Who answers when the crown calls?",
    namePlaceholder: "e.g. Maeryn of the Vale",
    names: [
      "Maeryn of the Vale", "Corvan Ashthorne", "Sable Wren", "Aldric Thorne",
      "Elira Dawnmere", "Bram Holloway", "Yssolde Fenn", "Gareth Stormcairn",
      "Nima Silverbrook", "Roderick Vale", "Thessaly Marsh", "Kaelen Frost",
      "Wynne Blackbriar", "Osric Hale", "Liora of Emberfell", "Draven Ironwood",
    ],
    archetypes: [
      { title: "The Knight-Errant", ornament: "⚔", blurb: "Sworn to a king now dead. The oath didn't die with him." },
      { title: "The Hedge-Witch", ornament: "☽", blurb: "Small magics, old debts, a talent for surviving both." },
      { title: "The Exiled Heir", ornament: "♜", blurb: "The crown is your birthright. Half the realm disagrees." },
      { title: "The Loremaster", ornament: "✒", blurb: "You know what the shards truly are. You wish you didn't." },
      { title: "The Sellsword", ornament: "⚑", blurb: "Loyal to coin, so far. Nothing worthier has paid." },
      { title: "The Gravesinger", ornament: "❧", blurb: "You sing the dead to rest. Lately they sing back." },
    ],
    traits: ["Oathbound", "Cunning", "Merciful", "Vengeful", "Fated", "Unyielding"],
  },
  {
    id: "scifi",
    ornament: "✦",
    genre: "Sci-fi thriller",
    accent: "#5AA0DC", // steel-cyan
    title: "Signal from Europa",
    premise:
      "A repeating signal from beneath Europa's ice has gone silent — along with the twelve-person research station that found it. Your ship is six days out, and the only one close enough to answer.",
    tone: "Hard sci-fi thriller: claustrophobic, awe-struck, scientifically grounded dread.",
    question: "Who wakes when the klaxon sounds?",
    namePlaceholder: "e.g. Idris Okonkwo",
    names: [
      "Idris Okonkwo", "Commander Yuki Sato", "Dr. Priya Nair", "Anton Volkov",
      "Mara Castellanos", "Ren Takahashi", "Nadia Osei", "Elias Vance",
      "Dr. Wen Liu", "Sofia Marchetti", "Kai Bergström", "Amara Diallo",
      "Theo Reyes", "Ingrid Halvorsen", "Rashid Al-Amin", "Petra Novak",
    ],
    archetypes: [
      { title: "The Commander", ornament: "✦", blurb: "Twelve people were yours to protect. You're six days late." },
      { title: "The Ship's Engineer", ornament: "⚙", blurb: "The ship talks in its sleep. You always listen." },
      { title: "The Xenobiologist", ornament: "☿", blurb: "You prayed for first contact. Careful what answers." },
      { title: "The Flight Surgeon", ornament: "✚", blurb: "You can patch a body in vacuum. Minds are harder." },
      { title: "The Comms Officer", ornament: "≋", blurb: "You heard the signal first. It's still in your head." },
      { title: "The Company Observer", ornament: "♄", blurb: "Someone must protect the investment. Even from the crew." },
    ],
    traits: ["Methodical", "Haunted", "Curious", "Steady", "Ambitious", "Sleepless"],
  },
  {
    id: "mystery",
    ornament: "♞",
    genre: "Murder mystery",
    accent: "#CC6058", // claret
    title: "The Glass House Murders",
    premise:
      "A reclusive tycoon is found dead in his famous glass mansion the night of a storm, seven guests trapped inside with the body — and every one of them, including you, has something to hide.",
    tone: "Golden-age murder mystery: sharp dialogue, red herrings, a ticking clock until dawn.",
    question: "Who were you, before tonight?",
    namePlaceholder: "e.g. Vivian Ashcombe",
    names: [
      "Vivian Ashcombe", "Inspector Cyril Hale", "Dorothea Vane", "Julian Pemberton",
      "Beatrice Locke", "Reginald Crane", "Estelle Mercer", "Ambrose Kite",
      "Lady Rosalind Frey", "Dr. Hugh Merrow", "Cordelia Sparrow", "Gerald Ashby",
      "Margot Ellery", "Sebastian Vale", "Ottoline Crisp", "Nigel Barrow",
    ],
    archetypes: [
      { title: "The Detective, Retired", ornament: "♞", blurb: "You came for the wine. Murder followed you in." },
      { title: "The Society Columnist", ornament: "✎", blurb: "You know every secret here. One is worth killing for." },
      { title: "The Heir", ornament: "♦", blurb: "The will names you first. Tonight, that's called motive." },
      { title: "The Family Doctor", ornament: "⚗", blurb: "Thirty years of house calls. Some cures stayed quiet." },
      { title: "The Butler", ornament: "♟", blurb: "Unseen, indispensable, and last to see him alive." },
      { title: "The Widow", ornament: "♛", blurb: "His third. The first two are why you're careful." },
    ],
    traits: ["Observant", "Discreet", "Charming", "Desperate", "Ruthless", "Nervy"],
  },
  {
    id: "horror",
    ornament: "☾",
    genre: "Gothic horror",
    accent: "#A17FD4", // spectral violet
    title: "The Hollow Below",
    premise:
      "Your grandmother's will left you the house on Merrow Lane — and a letter begging you to brick up the cellar without ever opening the door at the bottom of the stairs. The door is already open.",
    tone: "Gothic horror: slow-burn dread, family secrets, the uncanny bleeding into the everyday.",
    question: "Who inherits the house on Merrow Lane?",
    namePlaceholder: "e.g. Wren Halloway",
    names: [
      "Wren Halloway", "Silas Ambrose", "Tabitha Vane", "Elowen Marsh",
      "Jasper Coldwell", "Merritt Fen", "Cassia Bell", "Lucian Graves",
      "Verity Ashe", "Emory Sable", "Rosanna Pike", "Barnaby Frost",
      "Delphine Crow", "Hollis Merrow", "Ivy Blackwood", "Ezra Hallow",
    ],
    archetypes: [
      { title: "The Grandchild", ornament: "☾", blurb: "She left you the house because you never asked why." },
      { title: "The Lapsed Seminarian", ornament: "†", blurb: "You stopped believing. The house means to fix that." },
      { title: "The Debunker", ornament: "✒", blurb: "Forty hauntings debunked. This one knows your name." },
      { title: "The Herbalist", ornament: "✿", blurb: "She taught you the garden. Never what it was fed." },
      { title: "The Restorer", ornament: "♫", blurb: "Old houses sing to you. This one is screaming." },
      { title: "The Twin", ornament: "☍", blurb: "Your sister vanished here. The door remembers her." },
    ],
    traits: ["Haunted", "Stubborn", "Skeptical", "Tender", "Morbid", "Unblinking"],
  },
  {
    id: "western",
    ornament: "✪",
    genre: "Western",
    accent: "#CE8149", // copper / rust
    title: "Red Dust Reckoning",
    premise:
      "You ride into the copper town of Providencia with a debt to settle and a name you no longer use. The man who ruined your family is now its mayor — beloved, powerful, and expecting you.",
    tone: "Revisionist western: dusty, morally gray, tense standoffs and hard-won loyalty.",
    question: "Who rides into Providencia?",
    namePlaceholder: "e.g. Ellis Marner",
    names: [
      "Ellis Marner", "Cassidy Boone", "Jethro Vance", "Della Ríos",
      "Wade Calloway", "Josephine Hart", "Amos Deering", "Rosa Delgado",
      "Silas Crane", "Etta McCue", "Clemente Vargas", "Hattie Fox",
      "Levi Ransom", "Nora Bell", "Gideon Pike", "Marisol Ochoa",
    ],
    archetypes: [
      { title: "The Gunhand", ornament: "✪", blurb: "Fast enough to be famous. Tired enough to quit." },
      { title: "The Circuit Judge", ornament: "⚖", blurb: "You carry the law in a saddlebag. It rides light here." },
      { title: "The Cardsharp", ornament: "♠", blurb: "You win because you must. Someone remembers losing." },
      { title: "The Homesteader", ornament: "⚒", blurb: "They burned the claim. You kept the deed and the anger." },
      { title: "The Printer", ornament: "✎", blurb: "Truth is a lit match in a dry town." },
      { title: "The Preacher", ornament: "✟", blurb: "You buried the gun with your past. This town sells shovels." },
    ],
    traits: ["Weathered", "Loyal", "Vengeful", "Quiet", "Hot-headed", "Honest"],
  },
  {
    id: "regency",
    ornament: "❧",
    genre: "Regency intrigue",
    accent: "#D07CA6", // rose
    title: "A Season of Masks",
    premise:
      "London, 1813. You arrive for the Season with a dazzling reputation, an empty purse, and one chance to secure your family's future — while a rival from your past threatens to expose everything.",
    tone: "Regency romance with intrigue: wit, longing, ballroom politics, secrets behind fans.",
    question: "Who arrives for the Season?",
    namePlaceholder: "e.g. Miss Georgiana Hale",
    names: [
      "Miss Georgiana Hale", "Lady Arabella Finch", "Mr. Percival Grey",
      "Miss Cordelia Wynter", "Captain Frederick Ashworth", "Lady Honoria Vane",
      "Miss Emmeline Carr", "Mr. Julian Ravensworth", "Miss Sophronia Blythe",
      "Lord Edmund Fairfax", "Miss Adelaide Pryce", "Mrs. Rosamund Kell",
      "Mr. Theodore Sinclair", "Miss Beatrix Lovell", "Lady Millicent Rowe",
      "Mr. Augustus Vane",
    ],
    archetypes: [
      { title: "The Penniless Beauty", ornament: "❧", blurb: "Your face opens doors your accounts would close." },
      { title: "The Widowed Countess", ornament: "♕", blurb: "Married up, buried well. Society calls it luck." },
      { title: "The Secret Novelist", ornament: "✒", blurb: "All London reads your scandals. None suspect the author." },
      { title: "The Half-Pay Officer", ornament: "⚔", blurb: "Waterloo made you a hero. Peace made you poor." },
      { title: "The Matchmaker", ornament: "❁", blurb: "Eleven marriages arranged. Yours remains unwritten." },
      { title: "The Fortune Hunter", ornament: "♠", blurb: "Charm is capital. You mean to invest it well." },
    ],
    traits: ["Witty", "Prudent", "Passionate", "Scheming", "Devoted", "Scandalous"],
  },
];

// Fallback cast for "Write your own" worlds, where we can't know the setting.
const ARCHETYPES = [
  { title: "The Rogue", ornament: "♠", blurb: "Quick hands, quicker wit. Rules are suggestions." },
  { title: "The Scholar", ornament: "✒", blurb: "Knowledge is your weapon — and your weakness." },
  { title: "The Soldier", ornament: "⚔", blurb: "Discipline and steel. You've seen too much." },
  { title: "The Diplomat", ornament: "🕊", blurb: "Words open doors that force never could." },
  { title: "The Outcast", ornament: "☄", blurb: "You belong nowhere, which means you see everything." },
  { title: "The Visionary", ornament: "☉", blurb: "You glimpse what others can't — or won't." },
];

const TRAITS = ["Brave", "Cunning", "Compassionate", "Ruthless", "Curious", "Haunted"];
const DEFAULT_QUESTION = "Who are you?";
// Register-neutral names for "Write your own" worlds.
const DEFAULT_NAMES = [
  "Rowan Ashford", "Mira Okafor", "Kestrel Vance", "Soren Adeyemi",
  "Juno Marlowe", "Cassian Reed", "Lira Nakamura", "Ambrose Cole",
  "Nadia Frost", "Elian Vasquez", "Sable Quinn", "Tobias Wren",
];

const LIB_KEY = "plotwick-library-v1";

// ----- state -----
let library = loadLibrary();
let story = null; // the active story object (a member of library.stories)
let draft = { scenario: null, character: { name: "", archetype: null, trait: null } };
let pendingAction = null; // player action that led to the chapter now streaming
let generating = false;
let ttsOn = false;
let sb = null; // Supabase client (null when accounts aren't configured)
let user = null; // signed-in Supabase user
let appConfig = {}; // /api/config result (creditsEnforced, payments, …)
let credits = null; // current credit balance (null = unknown / not enforced)
let pendingStart = false; // user tried to start a story before signing in
let namePool = DEFAULT_NAMES; // name pool for the current world's dice roll

// ----- helpers -----
const $ = (id) => document.getElementById(id);
const screens = {
  scenario: $("screen-scenario"),
  custom: $("screen-custom"),
  character: $("screen-character"),
  story: $("screen-story"),
};

function showScreen(name) {
  Object.entries(screens).forEach(([k, el]) => el.classList.toggle("hidden", k !== name));
  window.scrollTo({ top: 0 });
  if (name !== "story") stopSpeaking();
}

function loadLibrary() {
  try {
    const lib = JSON.parse(localStorage.getItem(LIB_KEY));
    if (lib && lib.stories) return lib;
  } catch { /* fall through */ }
  return { version: 1, stories: {} };
}

function saveLibrary() {
  try {
    localStorage.setItem(LIB_KEY, JSON.stringify(library));
  } catch (e) {
    console.warn("couldn't save library:", e);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ----- boot -----
init();

async function init() {
  try {
    appConfig = await fetch("/api/config").then((r) => r.json());
    if (appConfig.demo) $("demo-banner").classList.remove("hidden");
  } catch { /* cosmetic */ }

  renderScenarios();
  renderLibrary();
  wireEvents();
  wirePayments();
  initSupabase(appConfig); // async; UI works without it
  handleCheckoutReturn(); // show a message if we just came back from Stripe
}

// ----- screen 1: home -----
function renderScenarios() {
  const grid = $("scenario-grid");
  grid.innerHTML = "";
  for (const s of SCENARIOS) {
    grid.appendChild(scenarioCard(s, () => {
      draft.scenario = s;
      openCharacterScreen();
    }));
  }
  // "Write your own" plate — keeps the house gold accent.
  const custom = document.createElement("button");
  custom.className = "card scenario-card";
  custom.innerHTML = `<span class="ornament">☙</span><span class="eyebrow">Your imagination</span><h3>Write your own</h3><p>Bring a premise; the storyteller does the rest.</p>`;
  custom.addEventListener("click", () => {
    updateCustomContinue();
    showScreen("custom");
  });
  grid.appendChild(custom);
}

function scenarioCard(s, onClick) {
  const card = document.createElement("button");
  card.className = "card scenario-card";
  if (s.accent) card.style.setProperty("--card-accent", s.accent);
  card.innerHTML = `<span class="ornament">${s.ornament}</span><span class="eyebrow">${escapeHtml(s.genre)}</span><h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.premise)}</p>`;
  card.addEventListener("click", onClick);
  return card;
}

function renderLibrary() {
  const entries = Object.values(library.stories).sort((a, b) => b.updatedAt - a.updatedAt);
  $("library-section").classList.toggle("hidden", entries.length === 0);
  const grid = $("library-grid");
  grid.innerHTML = "";
  for (const st of entries) {
    const card = document.createElement("div");
    card.className = "library-card";
    const coverHtml = st.cover
      ? `<img alt="" src="data:image/svg+xml;utf8,${encodeURIComponent(st.cover)}">`
      : `<span>${st.scenario.ornament || "❦"}</span>`;
    card.innerHTML = `
      <div class="cover">${coverHtml}</div>
      <div class="lib-body">
        <h3>${escapeHtml(st.title || st.scenario.title)}</h3>
        <p class="lib-meta">${escapeHtml(st.scenario.title)} · ${st.done ? "finished" : `chapter ${st.chapters.length}`}</p>
        <div class="lib-actions">
          <button class="btn btn-primary btn-small" data-act="open">${st.done ? "Read" : "Resume"}</button>
          <button class="btn btn-ghost btn-small" data-act="delete">Delete</button>
        </div>
      </div>`;
    card.querySelector('[data-act="open"]').addEventListener("click", () => openStory(st.id));
    card.querySelector('[data-act="delete"]').addEventListener("click", () => {
      if (confirm(`Delete "${st.title || st.scenario.title}" from your library?`)) {
        delete library.stories[st.id];
        saveLibrary();
        cloudDeleteStory(st.id);
        renderLibrary();
      }
    });
    grid.appendChild(card);
  }
}

// ----- screen 1b: custom scenario -----
function updateCustomContinue() {
  const ok = $("custom-title").value.trim() && $("custom-premise").value.trim();
  $("custom-continue").disabled = !ok;
}

function submitCustomScenario() {
  draft.scenario = {
    id: "custom",
    ornament: "☙",
    genre: "Your own",
    title: $("custom-title").value.trim(),
    premise: $("custom-premise").value.trim(),
    tone: $("custom-tone").value.trim() || "Let the premise suggest the genre; write it with conviction.",
  };
  openCharacterScreen();
}

// ----- screen 2: character -----
// The cast is world-specific: question, name placeholder, archetypes, and
// traits all come from the chosen world (generic fallbacks for custom ones).
// Selections reset on entry since each world has a different cast.
function openCharacterScreen() {
  const s = draft.scenario;
  $("character-question").textContent = s.question || DEFAULT_QUESTION;
  $("character-scenario-label").textContent = `${s.ornament} ${s.title}`;
  $("char-name").placeholder = s.namePlaceholder || "e.g. Rowan Ashford";
  namePool = (s.names && s.names.length) ? s.names : DEFAULT_NAMES;
  draft.character.archetype = null;
  draft.character.archetypeBlurb = null;
  draft.character.trait = null;
  renderArchetypes(s.archetypes || ARCHETYPES, s.accent);
  renderTraits(s.traits || TRAITS);
  showScreen("character");
  updateBeginButton();
}

function renderArchetypes(archetypes, accent) {
  const grid = $("archetype-grid");
  grid.innerHTML = "";
  for (const a of archetypes) {
    const card = document.createElement("button");
    card.className = "card";
    if (accent) card.style.setProperty("--card-accent", accent);
    card.innerHTML = `<span class="ornament">${a.ornament}</span><h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(a.blurb)}</p>`;
    card.addEventListener("click", () => {
      draft.character.archetype = a.title;
      draft.character.archetypeBlurb = a.blurb;
      grid.querySelectorAll(".card").forEach((c) => c.classList.toggle("selected", c === card));
      updateBeginButton();
    });
    grid.appendChild(card);
  }
}

function renderTraits(traits) {
  const row = $("trait-row");
  row.innerHTML = "";
  for (const t of traits) {
    const chip = document.createElement("button");
    chip.className = "chip";
    chip.textContent = t;
    chip.addEventListener("click", () => {
      draft.character.trait = t;
      row.querySelectorAll(".chip").forEach((c) => c.classList.toggle("selected", c === chip));
      updateBeginButton();
    });
    row.appendChild(chip);
  }
}

function updateBeginButton() {
  draft.character.name = $("char-name").value.trim();
  const c = draft.character;
  $("begin-btn").disabled = !(c.name && c.archetype && c.trait);
}

// Roll a random name from the current world's pool (never the one already shown).
function rollName() {
  const current = $("char-name").value.trim();
  const pool = namePool.filter((n) => n !== current);
  const name = pool[Math.floor(Math.random() * pool.length)] || namePool[0];
  $("char-name").value = name;
  updateBeginButton();
}

// ----- events -----
function wireEvents() {
  $("char-name").addEventListener("input", updateBeginButton);
  $("roll-name").addEventListener("click", rollName);
  $("back-to-scenarios").addEventListener("click", () => showScreen("scenario"));
  $("custom-back").addEventListener("click", () => showScreen("scenario"));
  ["custom-title", "custom-premise", "custom-tone"].forEach((id) =>
    $(id).addEventListener("input", updateCustomContinue));
  $("custom-continue").addEventListener("click", submitCustomScenario);
  $("logo").addEventListener("click", () => { if (!generating) goHome(); });

  $("begin-btn").addEventListener("click", startStory);
  $("new-story-btn").addEventListener("click", goHome);
  $("abandon-btn").addEventListener("click", () => {
    if (generating) return;
    if (story && !story.done && !confirm("Leave this story? It stays in your library.")) return;
    goHome();
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

  $("journal-toggle").addEventListener("click", () => {
    const j = $("journal");
    const show = j.classList.contains("hidden");
    j.classList.toggle("hidden", !show);
    $("journal-toggle").setAttribute("aria-pressed", String(show));
  });

  $("tts-toggle").addEventListener("click", () => {
    ttsOn = !ttsOn;
    $("tts-toggle").setAttribute("aria-pressed", String(ttsOn));
    if (!ttsOn) stopSpeaking();
    else if (story && story.chapters.length) speak(story.chapters[story.chapters.length - 1].prose);
  });

  $("share-btn").addEventListener("click", shareStory);
  $("copy-link-btn").addEventListener("click", async () => {
    const input = $("share-link");
    input.select();
    try { await navigator.clipboard.writeText(input.value); } catch { document.execCommand("copy"); }
    $("copy-link-btn").textContent = "Copied";
    setTimeout(() => { $("copy-link-btn").textContent = "Copy"; }, 1500);
  });
}

function goHome() {
  story = null;
  renderLibrary();
  showScreen("scenario");
}

// ----- story lifecycle -----
function startStory() {
  updateBeginButton();
  if ($("begin-btn").disabled) return;

  // When credits are enforced, a story requires a signed-in account with at
  // least one credit. Guide the player to sign in / top up before we build the
  // story object, and remember their intent so we can resume automatically.
  if (appConfig.creditsEnforced) {
    if (!user) {
      pendingStart = true;
      authMessage("Sign in (or create a free account) to begin — new readers get a few stories on the house.", true);
      openAuthModal();
      return;
    }
    if (credits !== null && credits <= 0) {
      openBuyModal();
      return;
    }
  }

  story = {
    id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    scenario: draft.scenario,
    character: { ...draft.character },
    history: [
      {
        role: "user",
        content: "Begin the story. Write the opening chapter and introduce the protagonist in the middle of their world.",
      },
    ],
    chapters: [],
    title: null,
    cover: null,
    state: null,
    done: false,
  };
  library.stories[story.id] = story;
  pendingAction = null;
  openStoryScreen();
  requestChapter();
}

function openStory(id) {
  story = library.stories[id];
  if (!story) return;
  pendingAction = null;
  openStoryScreen();
  renderAllChapters();
  updateJournal(story.state);
  renderFrontispiece();
  if (story.done) {
    $("ending-area").classList.remove("hidden");
  } else {
    const last = [...story.history].reverse().find((m) => m.role === "assistant");
    const choices = last ? parseChoices(last.content) : null;
    if (last) showChoices(choices);
    else requestChapter();
  }
}

function openStoryScreen() {
  $("story-title").textContent = story.title || `${story.scenario.title} · ${story.character.name}`;
  $("story-text").innerHTML = "";
  $("choices-area").classList.add("hidden");
  $("ending-area").classList.add("hidden");
  $("share-result").classList.add("hidden");
  $("error-area").classList.add("hidden");
  $("journal").classList.add("hidden");
  $("journal-toggle").setAttribute("aria-pressed", "false");
  // Tint the whole reading view with this world's accent (custom → house gold).
  const el = $("screen-story");
  if (story.scenario.accent) el.style.setProperty("--story-accent", story.scenario.accent);
  else el.style.removeProperty("--story-accent");
  updateChapterCount();
  showScreen("story");
}

function chooseAction(action, isCustom) {
  $("custom-action").value = "";
  hideChoices();
  appendPlayerAction(action);
  pendingAction = action;
  story.history.push({
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
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({
        storyId: story.id,
        scenario: {
          title: story.scenario.title,
          premise: story.scenario.premise,
          tone: story.scenario.tone,
        },
        character: story.character,
        history: story.history,
      }),
    });
    if (res.status === 402) {
      // Out of credits — offer to buy more.
      const body = await res.json().catch(() => ({}));
      setCredits(0);
      generating = false;
      $("typing-indicator").classList.add("hidden");
      proseEl.remove();
      openBuyModal();
      return;
    }
    if (res.status === 401) {
      generating = false;
      $("typing-indicator").classList.add("hidden");
      proseEl.remove();
      pendingStart = true;
      openAuthModal();
      return;
    }
    if (res.status === 429) {
      const body = await res.json().catch(() => ({}));
      throw Object.assign(new Error("rate limited"), { userMessage: body.error });
    }
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
        } else if (evt.type === "credits") {
          setCredits(evt.credits);
        } else if (evt.type === "error") {
          failed = evt.error;
        }
      }
    }
  } catch (err) {
    console.error(err);
    failed = err.userMessage || "Couldn't reach the storyteller. Check your connection and try again.";
  }

  generating = false;
  $("typing-indicator").classList.add("hidden");

  if (failed || !fullText.trim()) {
    proseEl.remove();
    showError(failed || "The storyteller returned an empty page. Try again.");
    if (appConfig.creditsEnforced) refreshCredits(); // a failed first chapter is refunded
    return;
  }

  // Commit the chapter.
  const prose = visiblePart(fullText);
  story.history.push({ role: "assistant", content: fullText });
  story.chapters.push({ prose, action: pendingAction });
  pendingAction = null;

  const ledger = parseLedger(fullText);
  if (ledger) {
    story.state = ledger;
    if (ledger.title) {
      const firstTime = !story.title;
      story.title = ledger.title;
      if (firstTime) fetchCover(); // async; fills in when ready
    }
    $("story-title").textContent = story.title || $("story-title").textContent;
    updateJournal(ledger);
  }

  story.updatedAt = Date.now();
  persistStory(story);
  updateChapterCount();
  speak(prose);

  showChoices(parseChoices(fullText));
}

// ----- parsing -----
function visiblePart(fullText) {
  return fullText.split(/<state>|<choices>/)[0].trimEnd();
}

function parseLedger(text) {
  const m = text.match(/<state>\s*([\s\S]*?)\s*<\/state>/);
  if (!m) return null;
  try {
    const obj = JSON.parse(m[1]);
    return typeof obj === "object" && obj ? obj : null;
  } catch {
    return null;
  }
}

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

// ----- choices & endings -----
function showChoices(choices) {
  if (choices && choices.length === 0) {
    finishStory();
    return;
  }
  const btns = $("choice-buttons");
  btns.innerHTML = "";
  // If the model flubbed the format, offer a neutral continue.
  for (const choice of choices && choices.length ? choices : ["Continue"]) {
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

function finishStory() {
  story.done = true;
  story.updatedAt = Date.now();
  persistStory(story);
  $("ending-area").classList.remove("hidden");
  keepInView();
}

function showError(msg) {
  $("error-text").textContent = msg;
  $("error-area").classList.remove("hidden");
}

// ----- sharing -----
async function shareStory() {
  if (!story) return;
  $("share-btn").disabled = true;
  try {
    const res = await fetch("/api/share", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({
        title: story.title || story.scenario.title,
        scenario: { title: story.scenario.title },
        character: story.character,
        chapters: story.chapters,
        cover: story.cover,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { id } = await res.json();
    $("share-link").value = `${location.origin}/s/${id}`;
    $("share-result").classList.remove("hidden");
  } catch (err) {
    console.error(err);
    alert("Couldn't publish the story right now. Try again in a moment.");
  }
  $("share-btn").disabled = false;
}

// ----- cover art -----
async function fetchCover() {
  if (!story || story.cover || !story.title) return;
  const forStory = story;
  try {
    const res = await fetch("/api/cover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: forStory.title,
        scenario: { title: forStory.scenario.title, premise: forStory.scenario.premise },
        character: forStory.character,
        accent: forStory.scenario.accent || null,
      }),
    });
    const { svg } = await res.json();
    if (svg) {
      forStory.cover = svg;
      forStory.updatedAt = Date.now();
      persistStory(forStory);
      if (story === forStory) renderFrontispiece();
    }
  } catch (err) {
    console.warn("cover fetch failed:", err);
  }
}

function renderFrontispiece() {
  let el = document.querySelector(".frontispiece");
  if (!story || !story.cover) { if (el) el.remove(); return; }
  if (!el) {
    el = document.createElement("div");
    el.className = "frontispiece";
    $("story-text").prepend(el);
  }
  el.innerHTML = `<img alt="Cover of ${escapeHtml(story.title || "")}" src="data:image/svg+xml;utf8,${encodeURIComponent(story.cover)}">`;
}

// ----- journal -----
function updateJournal(ledger) {
  if (!ledger) return;
  $("j-condition").textContent = ledger.condition || "—";
  const inv = $("j-inventory");
  inv.innerHTML = (ledger.inventory || []).length
    ? ledger.inventory.map((i) => `<li>${escapeHtml(i)}</li>`).join("")
    : "<li>—</li>";
  const comp = $("j-companions");
  comp.innerHTML = (ledger.companions || []).length
    ? ledger.companions.map((c) => `<li>${escapeHtml(c.name || "")} <span class="standing">${escapeHtml(c.standing || "")}</span></li>`).join("")
    : "<li>—</li>";
}

// ----- read aloud -----
function speak(text) {
  if (!ttsOn || !("speechSynthesis" in window)) return;
  stopSpeaking();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.98;
  speechSynthesis.speak(utterance);
}

function stopSpeaking() {
  if ("speechSynthesis" in window) speechSynthesis.cancel();
}

// ----- rendering -----
function renderProse(el, text) {
  el.innerHTML = text
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

function appendPlayerAction(action) {
  const div = document.createElement("div");
  div.innerHTML = `<p class="player-action">${escapeHtml(action)}</p><p class="asterism">⁂</p>`;
  $("story-text").appendChild(div);
}

function renderAllChapters() {
  const container = $("story-text");
  container.innerHTML = "";
  for (const ch of story.chapters) {
    if (ch.action) {
      const div = document.createElement("div");
      div.innerHTML = `<p class="player-action">${escapeHtml(ch.action)}</p><p class="asterism">⁂</p>`;
      container.appendChild(div);
    }
    const el = document.createElement("div");
    el.className = "chapter";
    renderProse(el, ch.prose);
    container.appendChild(el);
  }
  window.scrollTo({ top: story.done ? 0 : document.body.scrollHeight });
}

function updateChapterCount() {
  const n = story ? story.chapters.length : 0;
  $("chapter-count").textContent = n ? `Chapter ${n}` : "";
}

function keepInView() {
  const nearBottom = window.innerHeight + window.scrollY > document.body.scrollHeight - 320;
  if (nearBottom) window.scrollTo({ top: document.body.scrollHeight });
}

// ----- accounts & cloud library (Supabase) -----
// Loaded only when the server reports Supabase config; without it the app
// runs exactly as before, with the library in localStorage alone.

async function initSupabase(cfg) {
  if (!cfg.supabase) return;
  try {
    await loadScript("/vendor/supabase.js"); // vendored @supabase/supabase-js UMD build
    sb = window.supabase.createClient(cfg.supabase.url, cfg.supabase.anonKey);
  } catch (err) {
    console.warn("Supabase unavailable:", err);
    return;
  }

  $("account-bar").classList.remove("hidden");
  wireAuthEvents();

  sb.auth.onAuthStateChange((_event, session) => setUser(session ? session.user : null));
  const { data } = await sb.auth.getSession();
  setUser(data.session ? data.session.user : null);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(s);
  });
}

function wireAuthEvents() {
  $("account-btn").addEventListener("click", () => {
    if (user) {
      sb.auth.signOut(); // library stays local; onAuthStateChange updates UI
    } else {
      openAuthModal();
    }
  });
  $("auth-close").addEventListener("click", closeAuthModal);
  $("auth-modal").addEventListener("click", (e) => {
    if (e.target === $("auth-modal")) closeAuthModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAuthModal();
  });
  $("signin-btn").addEventListener("click", () => submitAuth("signin"));
  $("signup-btn").addEventListener("click", () => submitAuth("signup"));
  $("auth-password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitAuth("signin");
  });
}

function openAuthModal() {
  $("auth-message").classList.add("hidden");
  $("auth-modal").classList.remove("hidden");
  $("auth-email").focus();
}

function closeAuthModal() {
  $("auth-modal").classList.add("hidden");
}

async function submitAuth(mode) {
  const email = $("auth-email").value.trim();
  const password = $("auth-password").value;
  if (!email || !password) {
    return authMessage("Enter your email and a password.");
  }
  $("signin-btn").disabled = $("signup-btn").disabled = true;
  try {
    if (mode === "signup") {
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) return authMessage(error.message);
      if (!data.session) {
        return authMessage("Almost there — check your email to confirm your account, then sign in.", true);
      }
    } else {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) return authMessage(error.message);
    }
    closeAuthModal();
  } finally {
    $("signin-btn").disabled = $("signup-btn").disabled = false;
  }
}

function authMessage(text, gentle) {
  const el = $("auth-message");
  el.textContent = text;
  el.classList.toggle("gentle", !!gentle);
  el.classList.remove("hidden");
}

function setUser(u) {
  const changed = (u && u.id) !== (user && user.id);
  user = u;
  $("account-email").textContent = u ? u.email : "";
  $("account-email").classList.toggle("hidden", !u);
  $("account-btn").textContent = u ? "Sign out" : "Sign in";
  if (u && changed) syncWithCloud();
  if (!u) renderLibrary();

  // Show the "Buy stories" button once signed in on a payments-enabled site.
  const buyBtn = $("buy-btn");
  if (buyBtn) buyBtn.classList.toggle("hidden", !(u && appConfig.payments));

  // Credits follow the signed-in user.
  if (u) {
    refreshCredits().then(() => {
      // If they clicked "Begin" before signing in, pick up where they left off.
      if (pendingStart) {
        pendingStart = false;
        startStory();
      }
    });
  } else {
    setCredits(null);
    pendingStart = false;
  }
}

// ----- credits display -----
function setCredits(n) {
  credits = n;
  const pill = $("credits-pill");
  if (!pill) return;
  if (n === null || !appConfig.creditsEnforced) {
    pill.classList.add("hidden");
    return;
  }
  pill.classList.remove("hidden");
  const word = n === 1 ? "story" : "stories";
  pill.textContent = `${n} ${word} left`;
  pill.classList.toggle("empty", n <= 0);
}

async function refreshCredits() {
  if (!appConfig.creditsEnforced || !user) {
    setCredits(null);
    return;
  }
  try {
    const res = await fetch("/api/credits", { headers: await authHeader() });
    if (!res.ok) return;
    const body = await res.json();
    setCredits(body.credits);
  } catch { /* leave as-is */ }
}

async function authHeader() {
  if (!sb) return {};
  try {
    const { data } = await sb.auth.getSession();
    return data.session ? { Authorization: `Bearer ${data.session.access_token}` } : {};
  } catch {
    return {};
  }
}

// Two-way merge: newest updatedAt wins; local stories missing from the cloud
// are pushed up, cloud stories missing locally are pulled down.
async function syncWithCloud() {
  if (!sb || !user) return;
  try {
    const { data: rows, error } = await sb.from("stories").select("id, data");
    if (error) throw error;
    const cloud = new Map(rows.map((r) => [r.id, r.data]));

    for (const [id, cloudStory] of cloud) {
      const local = library.stories[id];
      if (!local || (cloudStory.updatedAt || 0) > (local.updatedAt || 0)) {
        library.stories[id] = cloudStory;
      }
    }
    for (const st of Object.values(library.stories)) {
      const c = cloud.get(st.id);
      if (!c || (st.updatedAt || 0) > (c.updatedAt || 0)) {
        await cloudSaveStory(st);
      }
    }
    saveLibrary();
    renderLibrary();
  } catch (err) {
    console.warn("cloud sync failed:", err);
  }
}

function persistStory(st) {
  saveLibrary();
  cloudSaveStory(st);
}

async function cloudSaveStory(st) {
  if (!sb || !user || !st) return;
  try {
    const { error } = await sb.from("stories").upsert({
      id: st.id,
      user_id: user.id,
      data: st,
      title: st.title || st.scenario.title,
      done: !!st.done,
      updated_at: new Date().toISOString(),
    });
    if (error) console.warn("cloud save failed:", error.message);
  } catch (err) {
    console.warn("cloud save failed:", err);
  }
}

async function cloudDeleteStory(id) {
  if (!sb || !user) return;
  try {
    await sb.from("stories").delete().eq("id", id);
  } catch (err) {
    console.warn("cloud delete failed:", err);
  }
}

// ----- payments (buy story credits via Stripe) -----

function wirePayments() {
  const buy = $("buy-btn");
  if (buy) buy.addEventListener("click", openBuyModal);
  const pill = $("credits-pill");
  if (pill) pill.addEventListener("click", openBuyModal);
  const close = $("buy-close");
  if (close) close.addEventListener("click", closeBuyModal);
  const modal = $("buy-modal");
  if (modal) modal.addEventListener("click", (e) => { if (e.target === modal) closeBuyModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeBuyModal(); });
}

function openBuyModal() {
  const modal = $("buy-modal");
  if (!modal) return;
  if (!appConfig.payments) {
    // Payments not configured on this server — nothing to sell.
    alert("Buying credits isn't set up on this site yet.");
    return;
  }
  if (!user) { pendingStart = false; openAuthModal(); return; }
  renderPacks();
  $("buy-message").classList.add("hidden");
  modal.classList.remove("hidden");
}

function closeBuyModal() {
  const modal = $("buy-modal");
  if (modal) modal.classList.add("hidden");
}

function renderPacks() {
  const grid = $("pack-grid");
  if (!grid || !appConfig.payments) return;
  const cur = appConfig.payments.currency || "usd";
  const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency: cur });
  grid.innerHTML = "";
  for (const [id, pack] of Object.entries(appConfig.payments.packs)) {
    const each = pack.price / pack.credits / 100;
    const btn = document.createElement("button");
    btn.className = "pack";
    btn.innerHTML =
      `<span class="pack-count">${pack.credits}</span>` +
      `<span class="pack-label">${escapeHtml(pack.label)}</span>` +
      `<span class="pack-price">${fmt.format(pack.price / 100)}</span>` +
      `<span class="pack-each">${fmt.format(each)} each</span>`;
    btn.addEventListener("click", () => buyPack(id, btn));
    grid.appendChild(btn);
  }
}

async function buyPack(packId, btn) {
  if (btn) btn.disabled = true;
  buyMessage("Opening secure checkout…", true);
  try {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(await authHeader()) },
      body: JSON.stringify({ pack: packId }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.url) throw new Error(body.error || "checkout failed");
    window.location.href = body.url; // Stripe-hosted checkout page
  } catch (err) {
    console.error(err);
    buyMessage("Couldn't start checkout. Please try again.");
    if (btn) btn.disabled = false;
  }
}

function buyMessage(text, gentle) {
  const el = $("buy-message");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("gentle", !!gentle);
  el.classList.remove("hidden");
}

// After returning from Stripe, credits are granted by the webhook (server-side,
// possibly a beat later). Refetch the balance a couple of times to catch up.
function handleCheckoutReturn() {
  const params = new URLSearchParams(location.search);
  const status = params.get("checkout");
  if (!status) return;
  // Clean the URL so a refresh doesn't re-trigger this.
  history.replaceState({}, "", location.pathname);
  if (status === "success") {
    toast("Payment received — your story credits are being added.");
    let tries = 0;
    const poll = setInterval(async () => {
      await refreshCredits();
      if (++tries >= 5) clearInterval(poll);
    }, 1500);
  } else if (status === "cancel") {
    toast("Checkout canceled — no charge was made.");
  }
}

function toast(text) {
  let el = $("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 4000);
}
