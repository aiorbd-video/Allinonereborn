export default async function handler(req, res) {
  // Only allow bd71.vercel.app
  const allowed = "bd71.vercel.app";
  const referer = req.headers.referer || "";

  // Domain Lock
  if (!referer.includes(allowed)) {
    return res.status(200).send(`
      <html>
      <body style="background:black;color:red;text-align:center;padding-top:40px;font-family:sans-serif;">
        <h2>🚫 Access Denied</h2>
        <p>This stream can only be played from:</p>
        <h3 style="color:#00eaff;">${allowed}</h3>
      </body>
      </html>
    `);
  }

  // Master OR Segment
  let streamUrl = req.query.url;

  // Segment support
  if (req.query.segment) {
    streamUrl = "https://cloudfrontnet.vercel.app" + req.query.segment;
  }

  if (!streamUrl) {
    return res.status(400).send("Missing URL");
  }

  try {
    // Range support for HLS
    const response = await fetch(streamUrl, {
      headers: { Range: req.headers.range || "" }
    });

    res.setHeader("Content-Type", response.headers.get("content-type"));
    res.setHeader("Accept-Ranges", "bytes");

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (e) {
    res.status(500).send("Proxy Error");
  }
}
