"use strict";

(async () => {
  const reader = document.getElementById("reader");
  const reportButton = document.getElementById("report-story");
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
  const id = location.pathname.split("/").pop();
  let story;
  try {
    const res = await fetch(`/api/share/${encodeURIComponent(id)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    story = await res.json();
  } catch {
    reader.innerHTML = '<p class="screen-sub">This story could not be found. It may have been unpublished.</p>';
    return;
  }

  const parts = [];
  if (story.cover) {
    parts.push(`<div class="frontispiece"><img alt="" src="data:image/svg+xml;utf8,${encodeURIComponent(story.cover)}"></div>`);
  }
  parts.push(`<h2 class="share-title">${esc(story.title)}</h2>`);
  parts.push(`<p class="share-byline">A tale of ${esc(story.scenario.title)}, lived by ${esc(story.character.name)}${story.character.archetype ? `, ${esc(story.character.archetype)}` : ""}</p>`);
  parts.push('<article class="story-text">');
  for (const ch of story.chapters) {
    if (ch.action) {
      parts.push(`<p class="player-action">${esc(ch.action)}</p><p class="asterism">⁂</p>`);
    }
    parts.push(`<div class="chapter">${esc(ch.prose).split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join("")}</div>`);
  }
  parts.push("</article>");
  parts.push('<div class="ending"><p class="ending-mark">⁂</p><p class="ending-word">The End</p></div>');
  reader.innerHTML = parts.join("");

  reportButton.classList.remove("hidden");
  reportButton.addEventListener("click", async () => {
    const reason = prompt("What should the Plotwick team review about this story?");
    if (!reason || !reason.trim()) return;
    reportButton.disabled = true;
    try {
      const res = await fetch(`/api/share/${encodeURIComponent(id)}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      reportButton.textContent = "Report received";
    } catch {
      reportButton.textContent = "Report failed — try again";
      reportButton.disabled = false;
    }
  });
})();
