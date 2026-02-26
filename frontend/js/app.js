import { readValues } from "./ui.js";
import { validate } from "./validation.js";
import { renderPaper } from "./generator.js";
import { bindPrint, setWatermark } from "./print.js";

let lastPayload = null;
let lastData = null;

async function generate() {
  const status = document.getElementById("status");
  const output = document.getElementById("paper-output");
  const payload = readValues();
  const err = validate(payload);
  if (err) {
    status.textContent = err;
    return;
  }
  if (payload.watermark?.enable && payload.watermark?.text) {
    setWatermark(payload.watermark.text);
  } else {
    setWatermark("");
  }
  status.textContent = "Generating (AI or local fallback)...";
  document.getElementById("generate").disabled = true;
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || `HTTP ${res.status}`);
    }
    const data = await res.json();
    renderPaper(output, payload, data);
    lastPayload = payload;
    lastData = data;
    try {
      localStorage.setItem("paperPayload", JSON.stringify(payload));
      localStorage.setItem("paperResult", JSON.stringify(data));
    } catch {}
    status.textContent = data.meta?.source === "local" ? "Ready (local fallback used)" : "Ready (AI)";
  } catch (e) {
    status.textContent = "Error: " + e.message;
  } finally {
    document.getElementById("generate").disabled = false;
  }
}

document.getElementById("generate").addEventListener("click", generate);
if (document.getElementById("print")) bindPrint("print");

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
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><meta name="viewport" content="width=device-width, initial-scale=1"/><style>body{margin:24px;font-family:Inter,Arial,sans-serif;color:#222;background:#fff}.paper{max-width:880px;margin:0 auto}.hdr{display:grid;grid-template-columns:1fr 1fr;gap:8px;border-bottom:1px dashed #e0e3ea;padding-bottom:12px;margin-bottom:14px}.meta{color:#667;font-size:13px}.section{margin-top:14px}.q{margin:8px 0;font-weight:600}.opts{margin:6px 0 12px 18px}.opts li{margin:4px 0}</style></head><body><div class="paper">${output.innerHTML}</div></body></html>`;
  download(`paper-${lastPayload?.subject || "subject"}.html`, "text/html", html);
}

if (document.getElementById("download-json")) document.getElementById("download-json").addEventListener("click", downloadJSON);
if (document.getElementById("download-html")) document.getElementById("download-html").addEventListener("click", downloadHTML);

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
if (document.getElementById("download-md")) document.getElementById("download-md").addEventListener("click", downloadMD);
if (document.getElementById("download-txt")) document.getElementById("download-txt").addEventListener("click", downloadTXT);

const themes = {
  cream: {
    "--bg": "#f7f2e7", "--bg2": "#f3eddc", "--surface": "#ffffff", "--card": "#fff8ee",
    "--border": "#e6dcc6", "--text": "#2b2b2b", "--muted": "#6e6b5e", "--primary": "#2ecc71",
    "--primary2": "#27ae60", "--accent": "#e74c3c", "--accent2": "#c0392b"
  },
  navy: {
    "--bg": "#0b1021", "--bg2": "#101735", "--surface": "#0f1b3d", "--card": "#111d42",
    "--border": "#20315f", "--text": "#e6eaf5", "--muted": "#a9b3d6", "--primary": "#4f7cff",
    "--primary2": "#7aa2ff", "--accent": "#13c29a", "--accent2": "#10a685"
  },
  gray: {
    "--bg": "#f4f5f7", "--bg2": "#eef0f2", "--surface": "#ffffff", "--card": "#ffffff",
    "--border": "#dde1e7", "--text": "#222", "--muted": "#667", "--primary": "#444",
    "--primary2": "#222", "--accent": "#888", "--accent2": "#666"
  }
};
function applyTheme(name) {
  const vars = themes[name] || themes.cream;
  const root = document.documentElement;
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
}
document.getElementById("theme").addEventListener("change", e => applyTheme(e.target.value));
applyTheme(document.getElementById("theme").value || "cream");

function buildVideoQuery() {
  const topic = document.getElementById("topic")?.value.trim();
  const subject = document.getElementById("subject")?.value;
  const chapter = document.getElementById("chapter")?.value.trim();
  const book = document.getElementById("book")?.value.trim();
  let q = topic || "";
  const extras = [subject, chapter, book].filter(Boolean).join(" ");
  if (!q) q = extras;
  else if (extras) q = q + " " + extras;
  return q;
}
if (document.getElementById("video")) {
  document.getElementById("video").addEventListener("click", () => {
    const q = buildVideoQuery();
    const url = "./video.html" + (q ? `?q=${encodeURIComponent(q)}` : "");
    window.open(url, "_blank");
  });
}
