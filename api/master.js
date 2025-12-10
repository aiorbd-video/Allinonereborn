import { readFileSync } from "fs";
import path from "path";

const ALLOWED = "https://bd71.vercel.app";

// Safe load streams.json
let streams = {};
try {
  const filePath = path.join(process.cwd(), "streams.json");
  streams = JSON.parse(readFileSync(filePath, "utf8"));
} catch (e) {
  console.error("streams.json load failed:", e);
}

// custom deny HTML
function deny(res) {
  res.setHeader("Content-Type", "text/html");
  return res.status(403).send(`
  <html><body style="font-family:Arial;text-align:center;padding-top:50px">
    <h1 style="color:red">⛔ Access Denied</h1>
    <p>This stream can only be accessed from:</p>
    <b>${ALLOWED}</b>
  </body></html>`);
}

export default async function handler(req, res) {
  try {
    const origin = req.headers.origin || "";
    const referer = req.headers.referer || "";

    if (!origin.startsWith(ALLOWED) || !referer.startsWith(ALLOWED)) {
      return deny(res);
    }

    // Extract stream name
    const urlPath = req.url.split("?")[0];
    const parts = urlPath.split("/");
    const streamName = parts[parts.length - 2];

    const defaultUrl = streams[streamName];
    if (!defaultUrl) {
      return res.status(404).send("Stream not found: " + streamName);
    }

    const target = req.query.u
      ? decodeURIComponent(req.query.u)
      : defaultUrl;

    // Fetch playlist safely
    const upstream = await fetch(target);
    if (!upstream.ok) {
      return res.status(502).send("Source playlist error");
    }

    const text = await upstream.text();

    // If source is not m3u8 but HTML or empty
    if (!text.includes("#EXTM3U")) {
      return res.status(500).send("Invalid playlist format");
    }

    const base = target.replace(/[^/]+$/, "");

    const rewritten = text
      .split("\n")
      .map((line) => {
        const t = line.trim();
        if (t.startsWith("#") || !t) return line;

        let abs;
        try {
          abs = new URL(t, base).href;
        } catch {
          return line;
        }

        if (abs.endsWith(".m3u8"))
          return `/${streamName}/master.m3u8?u=${encodeURIComponent(abs)}`;

        if (abs.endsWith(".ts"))
          return `/api/segment?u=${encodeURIComponent(abs)}`;

        return abs;
      })
      .join("\n");

    res.setHeader("Access-Control-Allow-Origin", ALLOWED);
    res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
    return res.send(rewritten);
  } catch (error) {
    console.error("MASTER CRASH:", error);
    return res.status(500).send("MASTER INTERNAL ERROR");
  }
}
