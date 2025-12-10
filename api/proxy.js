export default async function handler(req, res) {
  const allowedDomain = "bd71.vercel.app";
  const referer = req.headers.referer || "";

  // ❌ Block if not coming from allowed domain
  if (!referer.includes(allowedDomain)) {
    return res.status(200).send(`
      <html>
        <body style="background:black;color:red;text-align:center;padding-top:40px;">
          <h2>🚫 Access Denied</h2>
          <p>This stream is allowed ONLY from:</p>
          <h3 style="color:#00eaff;">${allowedDomain}</h3>
        </body>
      </html>
    `);
  }

  // Master or Segment
  let streamUrl = req.query.url;
  if (req.query.segment) {
    streamUrl = "https://cloudfrontnet.vercel.app" + req.query.segment;
  }

  if (!streamUrl) return res.status(400).send("Missing stream URL");

  try {
    const response = await fetch(streamUrl, {
      headers: { Range: req.headers.range || "" }
    });

    res.setHeader("Content-Type", response.headers.get("content-type"));
    res.setHeader("Accept-Ranges", "bytes");

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (err) {
    res.status(500).send("Proxy Error");
  }
}
