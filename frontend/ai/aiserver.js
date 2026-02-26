import http from "http";
import https from "https";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { URL } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..");

function loadEnv() {
  const envPath = path.join(rootDir, ".env");
  if (!fs.existsSync(envPath)) return;
  const txt = fs.readFileSync(envPath, "utf8");
  txt.split(/\r?\n/).forEach(line => {
    const m = /^([A-Za-z_][A-Za-z0-9_]*?)=(.*)$/.exec(line.trim());
    if (!m) return;
    const k = m[1];
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  });
}
loadEnv();

function localPaper(payload) {
  const title = payload.title || "Exam";
  const institute = payload.institute || "";
  const duration = payload.duration || "";
  const types = Array.isArray(payload.types) && payload.types.length ? payload.types : ["mcq", "short", "long"];
  const count = Number(payload.count) > 0 ? Number(payload.count) : 10;
  const dist = payload.distribution || {};
  const perType = Math.max(1, Math.floor(count / types.length));
  const marks = payload.marks || { mcq: 1, short: 5, long: 10 };
  const mk = t => (t === "mcq" ? marks.mcq : t === "short" ? marks.short : marks.long);
  const makeQ = (t, i) => {
    if (t === "mcq") {
      return { text: `${payload.subject.toUpperCase()} concept ${i} explain karo`, options: ["Option A", "Option B", "Option C", "Option D"], marks: mk(t) };
    }
    return { text: `${payload.subject.toUpperCase()} question ${i} detail me likho`, marks: mk(t) };
  };
  const sections = types.map((t, idx) => {
    const n = dist[t] && dist[t] > 0 ? dist[t] : perType;
    return {
      name: ["A", "B", "C", "D"][idx] || String(idx + 1),
      type: t,
      questions: Array.from({ length: n }, (_, i) => makeQ(t, i + 1))
    };
  });
  return {
    title,
    institute,
    duration,
    instructions: payload.instructions ? payload.instructions.split("\n").filter(Boolean) : [],
    sections
  };
}

function send(res, status, headers, body) {
  res.writeHead(status, headers);
  res.end(body);
}

function typeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html";
  if (ext === ".css") return "text/css";
  if (ext === ".js") return "application/javascript";
  if (ext === ".json") return "application/json";
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  return "text/plain";
}

function serveStatic(req, res, file) {
  const filePath = path.join(rootDir, file);
  if (!fs.existsSync(filePath)) return send(res, 404, { "Content-Type": "text/plain" }, "Not found");
  const data = fs.readFileSync(filePath);
  send(res, 200, { "Content-Type": typeFor(filePath) }, data);
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  };
}

function callOpenAI(payload) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.OPENAI_API_KEY || "";
    if (!apiKey) {
      reject(new Error("OPENAI_API_KEY not set"));
      return;
    }
    const data = JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      temperature: 0.6,
      messages: [
        { role: "system", content: "You generate structured exam papers. Return JSON with keys: title,institute,duration,instructions:[string],sections:[{name,type,questions:[{text,options,marks}]}]. Hinglish tone, concise." },
        { role: "user", content: `Subject: ${payload.subject}. Board: ${payload.board || ""}. Book: ${payload.book || ""}. Chapter: ${payload.chapter || ""}. Topic: ${payload.topic || ""}. Additional Instructions: ${payload.addlInstructions || ""}. Difficulty: ${payload.difficulty}. Total: ${payload.count}. Types: ${(payload.types || []).join(",")}. Title: ${payload.title || "Final Exam"}. Institute: ${payload.institute || ""}. Duration: ${payload.duration || ""}. Instructions: ${payload.instructions || ""}. Marks: ${JSON.stringify(payload.marks || {})}. JSON only.` }
      ]
    });
    const options = {
      hostname: "api.openai.com",
      path: "/v1/chat/completions",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "Content-Length": Buffer.byteLength(data)
      }
    };
    const req = https.request(options, resp => {
      let body = "";
      resp.on("data", chunk => body += chunk);
      resp.on("end", () => {
        try {
          const json = JSON.parse(body);
          const content = json.choices?.[0]?.message?.content || "{}";
          const paper = JSON.parse(content);
          resolve({ ok: true, paper });
        } catch (e) {
          reject(new Error("Invalid response"));
        }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function callGemini(payload) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY || "";
    if (!apiKey) {
      reject(new Error("GEMINI_API_KEY not set"));
      return;
    }
    const prompt = `Subject: ${payload.subject}. Board: ${payload.board || ""}. Book: ${payload.book || ""}. Chapter: ${payload.chapter || ""}. Topic: ${payload.topic || ""}. Additional Instructions: ${payload.addlInstructions || ""}. Difficulty: ${payload.difficulty}. Total: ${payload.count}. Types: ${(payload.types || []).join(",")}. Title: ${payload.title || "Final Exam"}. Institute: ${payload.institute || ""}. Duration: ${payload.duration || ""}. Instructions: ${payload.instructions || ""}. Marks: ${JSON.stringify(payload.marks || {})}. Return strict JSON with keys: title,institute,duration,instructions:[string],sections:[{name,type,questions:[{text,options,marks}]}]. Hinglish tone, concise.`;
    const data = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    });
    const pathWithKey = `/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const options = {
      hostname: "generativelanguage.googleapis.com",
      path: pathWithKey,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(data)
      }
    };
    const req = https.request(options, resp => {
      let body = "";
      resp.on("data", chunk => body += chunk);
      resp.on("end", () => {
        try {
          const json = JSON.parse(body);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          const paper = JSON.parse(text);
          resolve({ ok: true, paper });
        } catch (e) {
          reject(new Error("Invalid response"));
        }
      });
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host}`);
  if (req.method === "OPTIONS") {
    send(res, 204, corsHeaders(), "");
    return;
  }
  if (req.method === "GET" && (u.pathname === "/" || u.pathname === "/index.html")) {
    serveStatic(req, res, "index.html");
    return;
  }
  if (req.method === "GET" && u.pathname === "/video.html") {
    serveStatic(req, res, "video.html");
    return;
  }
  if (req.method === "GET" && u.pathname === "/health") {
    send(res, 200, { "Content-Type": "application/json" }, JSON.stringify({ ok: true }));
    return;
  }
  if (req.method === "GET" && u.pathname.startsWith("/css/")) {
    serveStatic(req, res, u.pathname.slice(1));
    return;
  }
  if (req.method === "GET" && u.pathname.startsWith("/js/")) {
    serveStatic(req, res, u.pathname.slice(1));
    return;
  }
  if (req.method === "GET" && u.pathname === "/api/videos") {
    const key = process.env.YOUTUBE_API_KEY || "";
    if (!key) {
      send(res, 400, { "Content-Type": "application/json", ...corsHeaders() }, JSON.stringify({ ok: false, error: "YOUTUBE_API_KEY not set" }));
      return;
    }
    const q = u.searchParams.get("q") || "";
    const lang = u.searchParams.get("lang") || "";
    const channel = u.searchParams.get("channel") || "";
    const max = Math.min(parseInt(u.searchParams.get("max") || "10", 10) || 10, 25);
    const full = encodeURIComponent(q + (lang ? " " + lang : "") + (channel ? " " + channel : ""));
    const pathStr = `/youtube/v3/search?key=${encodeURIComponent(key)}&part=snippet&type=video&maxResults=${max}&q=${full}`;
    const options = {
      hostname: "www.googleapis.com",
      path: pathStr,
      method: "GET",
      headers: { "Accept": "application/json" }
    };
    const r = https.request(options, resp => {
      let body = "";
      resp.on("data", c => body += c);
      resp.on("end", () => {
        try {
          const json = JSON.parse(body);
          const items = (json.items || []).map(it => ({
            id: it.id?.videoId || "",
            title: it.snippet?.title || "",
            channel: it.snippet?.channelTitle || "",
            publishedAt: it.snippet?.publishedAt || "",
            thumb: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url || ""
          }));
          send(res, 200, { "Content-Type": "application/json", ...corsHeaders() }, JSON.stringify({ ok: true, items }));
        } catch (e) {
          send(res, 500, { "Content-Type": "application/json", ...corsHeaders() }, JSON.stringify({ ok: false, error: "Invalid YouTube response" }));
        }
      });
    });
    r.on("error", () => {
      send(res, 500, { "Content-Type": "application/json", ...corsHeaders() }, JSON.stringify({ ok: false, error: "YouTube request failed" }));
    });
    r.end();
    return;
  }
  if (req.method === "POST" && u.pathname === "/api/generate") {
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const payload = JSON.parse(body || "{}");
        const provider = (process.env.PROVIDER || "openai").toLowerCase();
        try {
          const result = provider === "gemini" ? await callGemini(payload) : await callOpenAI(payload);
          const paper = result.paper || {};
          if (!paper.sections || !Array.isArray(paper.sections) || paper.sections.length === 0) {
            const lp = localPaper(payload);
            const response = JSON.stringify({ ok: true, paper: lp, meta: { subject: payload.subject, difficulty: payload.difficulty, count: payload.count, types: payload.types, source: provider + "-fallback" } });
            send(res, 200, { "Content-Type": "application/json", ...corsHeaders() }, response);
            return;
          }
          const response = JSON.stringify({ ...result, meta: { ...(result.meta || {}), source: provider } });
          send(res, 200, { "Content-Type": "application/json", ...corsHeaders() }, response);
        } catch (e) {
          const paper = localPaper(payload);
          const response = JSON.stringify({ ok: true, paper, meta: { subject: payload.subject, difficulty: payload.difficulty, count: payload.count, types: payload.types, source: "local" } });
          send(res, 200, { "Content-Type": "application/json", ...corsHeaders() }, response);
        }
      } catch (e) {
        send(res, 500, { "Content-Type": "application/json", ...corsHeaders() }, JSON.stringify({ ok: false, error: e.message }));
      }
    });
    return;
  }
  send(res, 404, { "Content-Type": "text/plain" }, "Not found");
});

let currentPort = process.env.PORT ? Number(process.env.PORT) : 3000;
let attempts = 0;
function start() {
  server.listen(currentPort, () => {
    console.log(`Server running: http://localhost:${currentPort}/`);
  });
}
server.on("error", (err) => {
  if (err && err.code === "EADDRINUSE" && attempts < 5) {
    attempts += 1;
    currentPort += 1;
    start();
    return;
  }
  throw err;
});
start();
