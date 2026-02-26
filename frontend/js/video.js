import { renderPaper } from "./generator.js";
import { bindPrint, setWatermark } from "./print.js";

function qs(name) {
  const u = new URL(window.location.href);
  return u.searchParams.get(name) || "";
}
function setPlayer(query) {
  const player = document.getElementById("player");
  const meta = document.getElementById("hdrMeta");
  const open = document.getElementById("openYoutube");
  const lang = document.getElementById("lang").value;
  const channel = document.getElementById("channel").value.trim();
  if (!query) {
    player.src = "";
    meta.textContent = "Enter a keyword and search.";
    open.textContent = "Open on YouTube";
    open.href = "https://www.youtube.com/";
    return;
  }
  const q = query.trim();
  let full = q;
  if (lang) full += " " + lang;
  if (channel) full += " " + channel;
  player.src = "https://www.youtube.com/embed?listType=search&list=" + encodeURIComponent(full);
  meta.textContent = "Query: " + full;
  open.textContent = "Open on YouTube";
  open.href = "https://www.youtube.com/results?search_query=" + encodeURIComponent(full);
}
document.getElementById("search").addEventListener("click", () => {
  const q = document.getElementById("q").value.trim();
  setPlayer(q);
  searchAPI();
});
const initial = qs("q");
document.getElementById("q").value = initial;
setPlayer(initial);
searchAPI();

let lastPayload = null;
let lastData = null;
try {
  const p = localStorage.getItem("paperPayload");
  const d = localStorage.getItem("paperResult");
  if (p && d) {
    lastPayload = JSON.parse(p);
    lastData = JSON.parse(d);
  }
} catch {}
if (lastPayload && lastData) {
  const out = document.getElementById("paper-output");
  renderPaper(out, lastPayload, lastData);
  if (lastPayload.watermark?.enable && lastPayload.watermark?.text) {
    setWatermark(lastPayload.watermark.text);
  }
  const chips = document.getElementById("chips");
  const s = new Set();
  [lastPayload.topic, lastPayload.subject, lastPayload.chapter, lastPayload.board, lastPayload.book].forEach(x => { if (x) s.add(String(x)); });
  Array.from(s).slice(0, 6).forEach(txt => {
    const c = document.createElement("span");
    c.className = "chip";
    c.textContent = txt;
    c.addEventListener("click", () => {
      document.getElementById("q").value = txt;
      setPlayer(txt);
    });
    chips.appendChild(c);
  });
}

function download(filename, mime, content) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
function toMarkdown() {
  if (!lastData) return "";
  const p = lastData.paper || {};
  let md = `# ${p.title || "Exam"}\n`;
  if (lastPayload?.institute) md += `\n${lastPayload.institute}\n`;
  if (p.duration || lastPayload?.duration) md += `\nDuration: ${p.duration || lastPayload?.duration}\n`;
  if (lastPayload?.subject) md += `\nSubject: ${String(lastPayload.subject).toUpperCase()} (${lastPayload?.difficulty})\n`;
  if (lastPayload?.board) md += `\nBoard: ${lastPayload.board}\n`;
  if (lastPayload?.book) md += `\nBook: ${lastPayload.book}\n`;
  if (lastPayload?.chapter) md += `\nChapter: ${lastPayload.chapter}\n`;
  const instr = p.instructions || [];
  if (instr.length) {
    md += `\n## Instructions\n`;
    instr.forEach(i => md += `- ${i}\n`);
  }
  const sections = p.sections || [];
  sections.forEach((s, si) => {
    md += `\n## Section ${s.name || si + 1} (${s.type})\n`;
    (s.questions || []).forEach((q, qi) => {
      md += `\n${qi + 1}. ${q.text} (${q.marks || 0} marks)\n`;
      const opts = q.options || [];
      opts.forEach((o, oi) => {
        md += `   - ${String.fromCharCode(65 + oi)}. ${o}\n`;
      });
    });
  });
  return md;
}
function downloadJSON() {
  if (!lastData) return;
  const payload = lastPayload || {};
  const out = { payload, ...lastData };
  download(`paper-${payload.subject || "subject"}.json`, "application/json", JSON.stringify(out, null, 2));
}
function downloadHTML() {
  const output = document.getElementById("paper-output");
  if (!output || !output.innerHTML.trim()) return;
  const title = (lastData?.paper?.title || lastPayload?.title || "Exam") + "";
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><meta name="viewport" content="width=device-width, initial-scale=1"/><style>body{margin:24px;font-family:Segoe UI,Helvetica Neue,Inter,Arial,sans-serif;color:#222;background:#fff}.paper{max-width:880px;margin:0 auto}.hdr{display:grid;grid-template-columns:1fr 1fr;gap:8px;border-bottom:1px dashed #e0e3ea;padding-bottom:12px;margin-bottom:14px}.meta{color:#667;font-size:13px}.section{margin-top:14px}.q{margin:8px 0;font-weight:600}.opts{margin:6px 0 12px 18px}.opts li{margin:4px 0}</style></head><body><div class="paper">${output.innerHTML}</div></body></html>`;
  download(`paper-${lastPayload?.subject || "subject"}.html`, "text/html", html);
}
function downloadMD() {
  const md = toMarkdown();
  if (!md) return;
  download(`paper-${lastPayload?.subject || "subject"}.md`, "text/markdown", md);
}
function downloadTXT() {
  const md = toMarkdown();
  if (!md) return;
  download(`paper-${lastPayload?.subject || "subject"}.txt`, "text/plain", md);
}
bindPrint("print");
document.getElementById("download-html").addEventListener("click", downloadHTML);
document.getElementById("copyLink").addEventListener("click", async () => {
  const q = document.getElementById("q").value.trim();
  const lang = document.getElementById("lang").value;
  const channel = document.getElementById("channel").value.trim();
  let full = q;
  if (lang) full += " " + lang;
  if (channel) full += " " + channel;
  const href = "https://www.youtube.com/results?search_query=" + encodeURIComponent(full);
  try {
    await navigator.clipboard.writeText(href);
  } catch {
    const t = document.createElement("textarea");
    t.value = href;
    document.body.appendChild(t);
    t.select();
    document.execCommand("copy");
    t.remove();
  }
});

async function searchAPI() {
  const q = document.getElementById("q").value.trim();
  const lang = document.getElementById("lang").value;
  const channel = document.getElementById("channel").value.trim();
  const url = `/api/videos?q=${encodeURIComponent(q)}&lang=${encodeURIComponent(lang)}&channel=${encodeURIComponent(channel)}&max=10`;
  try {
    const res = await fetch(url);
    const statusEl = document.getElementById("status");
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const err = await res.json();
        if (err?.error) msg = err.error;
      } catch {}
      statusEl.textContent = `Videos error: ${msg}`;
      return;
    }
    const data = await res.json();
    const items = data.items || [];
    const wrap = document.getElementById("results");
    wrap.innerHTML = "";
    const statusEl2 = document.getElementById("status");
    if (!items.length) {
      statusEl2.textContent = "No videos found for this query.";
    } else {
      statusEl2.textContent = `Found ${items.length} videos`;
    }
    items.forEach(it => {
      const item = document.createElement("div");
      item.className = "item";
      const img = document.createElement("img");
      img.className = "thumb";
      img.src = it.thumb || "";
      const right = document.createElement("div");
      const t = document.createElement("div");
      t.textContent = it.title || "";
      const m = document.createElement("div");
      m.className = "meta2";
      m.textContent = `${it.channel} • ${new Date(it.publishedAt).toLocaleDateString()}`;
      right.appendChild(t);
      right.appendChild(m);
      item.appendChild(img);
      item.appendChild(right);
      item.addEventListener("click", () => {
        const id = it.id;
        if (id) {
          document.getElementById("player").src = "https://www.youtube.com/embed/" + id;
        }
      });
      wrap.appendChild(item);
    });
  } catch {}
}
