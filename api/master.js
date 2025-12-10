import streams from "../streams.json" assert { type: "json" };

const ALLOWED = "https://bd71.vercel.app";

function deny(res) {
  res.setHeader("Content-Type", "text/html");
  return res.status(403).send(`
    <html><body style="text-align:center;padding:40px;font-family:Arial">
      <h1 style="color:red">Access Denied</h1>
      <p>Only allowed from:</p>
      <b>${ALLOWED}</b>
    </body></html>
  `);
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  if (!origin.startsWith(ALLOWED) || !referer.startsWith(ALLOWED)) return deny(res);

  // URL pattern: /streamName/master.m3u8
  const path = req.url.split("?")[0].split("/");
  const streamName = path[path.length - 2]; // example: dormemon

  const defaultUrl = streams[streamName];

  if (!defaultUrl)
    return res.status(404).send(`Unknown stream: ${streamName}`);

  const target = req.query.u ? decodeURIComponent(req.query.u) : defaultUrl;

  try {
    const upstream = await fetch(target);
    const text = await upstream.text();
    const base = target.replace(/[^/]+$/, "");

    const rewritten = text.split("\n").map(line => {
      const t = line.trim();
      if (!t || t.startsWith("#")) return line;

      const abs = new URL(t, base).href;

      if (abs.endsWith(".m3u8"))
        return `/${streamName}/master.m3u8?u=${encodeURIComponent(abs)}`;

      if (abs.endsWith(".ts"))
        return `/api/segment?u=${encodeURIComponent(abs)}`;

      return abs;
    }).join("\n");

    res.setHeader("Access-Control-Allow-Origin", ALLOWED);
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    return res.send(rewritten);

  } catch (err) {
    return res.status(500).send("Error loading playlist");
  }
}
