export default async function handler(req, res) {
  const referer = req.headers.referer || "";
  const allowedDomain = "bd71.vercel.app";

  // Direct open protection
  if (!referer || !referer.includes(allowedDomain)) {
    return res.status(403).send("Proxy Error: Direct access forbidden");
  }

  const url = req.query.url;
  if (!url) return res.status(400).send("Proxy Error: Missing URL");

  try {
    const response = await fetch(url);
    const contentType = response.headers.get("content-type");
    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "no-store");

    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).send("Proxy Error: Stream unavailable");
  }
}
