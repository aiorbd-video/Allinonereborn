export default async function handler(req, res) {
  const allowedDomain = "bd71.vercel.app";
  const referer = req.headers.referer || "";

  // Direct open block + HTML warning
  if (!referer.includes(allowedDomain)) {
    return res.status(200).send(`
      <html><body style="background:black;color:red;text-align:center;padding-top:40px;">
        <h2>Access Denied</h2>
        <p>This stream can only be played on <b>bd71.vercel.app</b></p>
      </body></html>
    `);
  }

  // URL for master.m3u8 OR segment files
  let streamUrl = req.query.url;

  // ✔ Handle segment proxy
  if (req.query.segment) {
    streamUrl = `https://cloudfrontnet.vercel.app${req.query.segment}`;
  }

  if (!streamUrl) return res.status(400).send("Proxy Error: Missing URL");

  try {
    const response = await fetch(streamUrl);
    const type = response.headers.get("content-type");
    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "no-store");

    res.send(Buffer.from(buffer));

  } catch (err) {
    res.status(500).send("Proxy Error");
  }
}
