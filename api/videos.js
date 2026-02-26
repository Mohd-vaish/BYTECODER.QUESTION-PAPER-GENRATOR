export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }
  try {
    const key = process.env.YOUTUBE_API_KEY || "";
    if (!key) {
      res.status(400).json({ ok: false, error: "YOUTUBE_API_KEY not set" });
      return;
    }
    const q = String(req.query.q || "");
    const lang = String(req.query.lang || "");
    const channel = String(req.query.channel || "");
    const max = Math.min(parseInt(String(req.query.max || "10"), 10) || 10, 25);
    const full = encodeURIComponent(q + (lang ? " " + lang : "") + (channel ? " " + channel : ""));
    const url = `https://www.googleapis.com/youtube/v3/search?key=${encodeURIComponent(key)}&part=snippet&type=video&maxResults=${max}&q=${full}`;
    const resp = await fetch(url);
    const json = await resp.json();
    const items = (json.items || []).map(it => ({
      id: it.id?.videoId || "",
      title: it.snippet?.title || "",
      channel: it.snippet?.channelTitle || "",
      publishedAt: it.snippet?.publishedAt || "",
      thumb: it.snippet?.thumbnails?.medium?.url || it.snippet?.thumbnails?.default?.url || ""
    }));
    res.status(200).json({ ok: true, items });
  } catch (e) {
    res.status(500).json({ ok: false, error: "YouTube request failed" });
  }
}
