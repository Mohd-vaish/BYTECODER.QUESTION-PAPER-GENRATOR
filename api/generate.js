export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  try {
    const payload = req.body || {};
    const provider = String(process.env.PROVIDER || "openai").toLowerCase();
    const result = await (provider === "gemini" ? callGemini(payload) : callOpenAI(payload));
    const paper = result.paper || {};
    if (!paper.sections || !Array.isArray(paper.sections) || paper.sections.length === 0) {
      const lp = localPaper(payload);
      res.status(200).json({ ok: true, paper: lp, meta: { subject: payload.subject, difficulty: payload.difficulty, count: payload.count, types: payload.types, source: provider + "-fallback" } });
      return;
    }
    res.status(200).json({ ...result, meta: { ...(result.meta || {}), source: provider } });
  } catch (e) {
    const paper = localPaper(req.body || {});
    res.status(200).json({ ok: true, paper, meta: { subject: req.body?.subject, difficulty: req.body?.difficulty, count: req.body?.count, types: req.body?.types, source: "local" } });
  }
}

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
      return { text: `${String(payload.subject || "").toUpperCase()} concept ${i} explain karo`, options: ["Option A", "Option B", "Option C", "Option D"], marks: mk(t) };
    }
    return { text: `${String(payload.subject || "").toUpperCase()} question ${i} detail me likho`, marks: mk(t) };
  };
  const sections = types.map((t, idx) => {
    const n = dist[t] && dist[t] > 0 ? dist[t] : perType;
    return {
      name: ["A", "B", "C", "D"][idx] || String(idx + 1),
      type: t,
      questions: Array.from({ length: n }, (_, i) => makeQ(t, i + 1))
    };
  });
  return { title, institute, duration, instructions: payload.instructions ? String(payload.instructions).split("\n").filter(Boolean) : [], sections };
}

async function callOpenAI(payload) {
  const apiKey = process.env.OPENAI_API_KEY || "";
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  const body = {
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.6,
    messages: [
      { role: "system", content: "You generate structured exam papers. Return JSON with keys: title,institute,duration,instructions:[string],sections:[{name,type,questions:[{text,options,marks}]}]. Hinglish tone, concise." },
      { role: "user", content: `Subject: ${payload.subject}. Board: ${payload.board || ""}. Book: ${payload.book || ""}. Chapter: ${payload.chapter || ""}. Topic: ${payload.topic || ""}. Additional Instructions: ${payload.addlInstructions || ""}. Difficulty: ${payload.difficulty}. Total: ${payload.count}. Types: ${(payload.types || []).join(",")}. Title: ${payload.title || "Final Exam"}. Institute: ${payload.institute || ""}. Duration: ${payload.duration || ""}. Instructions: ${payload.instructions || ""}. Marks: ${JSON.stringify(payload.marks || {})}. JSON only.` }
    ]
  };
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify(body)
  });
  const json = await resp.json();
  const content = json?.choices?.[0]?.message?.content || "{}";
  const paper = JSON.parse(content);
  return { ok: true, paper };
}

async function callGemini(payload) {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");
  const prompt = `Subject: ${payload.subject}. Board: ${payload.board || ""}. Book: ${payload.book || ""}. Chapter: ${payload.chapter || ""}. Topic: ${payload.topic || ""}. Additional Instructions: ${payload.addlInstructions || ""}. Difficulty: ${payload.difficulty}. Total: ${payload.count}. Types: ${(payload.types || []).join(",")}. Title: ${payload.title || "Final Exam"}. Institute: ${payload.institute || ""}. Duration: ${payload.duration || ""}. Instructions: ${payload.instructions || ""}. Marks: ${JSON.stringify(payload.marks || {})}. Return strict JSON with keys: title,institute,duration,instructions:[string],sections:[{name,type,questions:[{text,options,marks}]}]. Hinglish tone, concise.`;
  const data = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } };
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const resp = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
  const json = await resp.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  const paper = JSON.parse(text);
  return { ok: true, paper };
}
