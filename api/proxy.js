export default async function handler(req, res) {
  const allowedDomain = "bd71.vercel.app";
  const referer = req.headers.referer || "";

  // Block Direct Browser Access
  if (!referer.includes(allowedDomain)) {
    return res.status(200).send(`
      <html>
      <body style="background:black;color:red;text-align:center;padding-top:40px;font-family:sans-serif;">
        <h2>🚫 Access Denied</h2>
        <p>This stream can only be played from:</p>
        <h3 style="color:#00eaff;">bd71.vercel.app</h3>
      </body>
      </html>
    `);
  }

  // Master URL or Segment URL
  let streamUrl = req.query.url;

  // Segment handler
  if (req.query.segment) {
    streamUrl = "https://cloudfrontnet.vercel.app" + req.query.segment;
  }

  if (!streamUrl) {
    return res.status(400).send("Proxy Error: Missing Stream URL");
  }

  try {
    const response = await fetch(streamUrl);
    const type = response.headers.get("content-type");
    const buffer = await response.arrayBuffer();

    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "no-store");

    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).send("Proxy Error: Stream Unavailable");
  }
}
