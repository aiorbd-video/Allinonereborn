const ALLOWED = "https://bd71.vercel.app";

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  const referer = req.headers.referer || "";
  if (!origin.startsWith(ALLOWED) || !referer.startsWith(ALLOWED))
    return res.status(403).send("Segment Access Denied");

  const url = decodeURIComponent(req.query.u);
  try {
    const fetchRes = await fetch(url);
    const buf = Buffer.from(await fetchRes.arrayBuffer());

    res.setHeader("Access-Control-Allow-Origin", ALLOWED);
    res.setHeader("Content-Type", "video/mp2t");
    return res.send(buf);
  } catch {
    return res.status(500).send("Segment Error");
  }
}
