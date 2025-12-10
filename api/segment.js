const ALLOWED = "https://bd71.vercel.app";

export default async function handler(req, res) {
  try {
    const origin = req.headers.origin || "";
    const referer = req.headers.referer || "";

    if (!origin.startsWith(ALLOWED) || !referer.startsWith(ALLOWED)) {
      return res.status(403).send("Segment Access Denied");
    }

    const raw = req.query.u;
    if (!raw) return res.status(400).send("Missing segment URL");

    const url = decodeURIComponent(raw);

    const upstream = await fetch(url);
    if (!upstream.ok) return res.status(502).send("Segment fetch error");

    const buf = Buffer.from(await upstream.arrayBuffer());

    res.setHeader("Access-Control-Allow-Origin", ALLOWED);
    res.setHeader("Content-Type", "video/mp2t");
    return res.send(buf);
  } catch (e) {
    console.error("SEGMENT CRASH:", e);
    return res.status(500).send("SEGMENT INTERNAL ERROR");
  }
}
