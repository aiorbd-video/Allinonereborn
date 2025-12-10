import { readFileSync } from "fs";
import { join } from "path";

const ALLOWED = "https://bd71.vercel.app";

// Load stream mapping manually from JSON
const streams = JSON.parse(
  readFileSync(join(process.cwd(), "streams.json"), "utf8")
);

function errorHTML() {
  return `
  <html><body style="font-family:Arial;text-align:center;padding:40px">
    <h1 style="color:red">Access Denied</h1>
    <p>Only allowed from:</p>
    <b>${ALLOWED}</b>
  </body></html>`;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";

  if (!origin.startsWith(ALLOWED) || !referer.startsWith(ALLOWED)) {
    res.setHeader("Content-Type", "text/html");
    return res.status(403).send(errorHTML());
  }

  // URL: /streamname/master.m3u8
  const path = req.url.split("?")[0].split("/");
  const streamName = path[path.length - 2];

  const defaultUrl = streams[streamName];

  if (!defaultUrl) {
    return res.status(404).send("Unknown stream: " + streamName);
  }

  const target = req.query.u
    ? decodeURIComponent(req.query.u)
    : defaultUrl;

  try {
    const upstream = await fetch(target);
    if (!upstream.ok) return res.status(502).send("Playlist Error");

    const text = await upstream.text();
    const base = target.replace(/[^/]+$/, "");

    const output = text
      .split("\n")
      .map((line) => {
        const t = line.trim();
        if (!t || t.startsWith("#")) return line;

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
    return res.send(output);
  } catch (err) {
    return res.status(500).send("Master Rewrite Error");
  }
}
