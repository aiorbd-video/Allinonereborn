export default async function handler(req, res) {
  const referer = req.headers.referer || "";

  // Direct access block
  if (!referer.includes("bd71.vercel.app")) {
    return res.status(403).send("Access Denied");
  }

  // Master OR Segment URL
  let streamUrl = req.query.url || req.query.segment;

  if (!streamUrl) {
    return res.status(400).send("Missing URL");
  }

  // Full CloudFront URL build
  if (req.query.segment) {
    streamUrl = "https://cloudfrontnet.vercel.app" + req.query.segment;
  }

  try {
    const response = await fetch(streamUrl, {
      headers: {
        "Range": req.headers.range || ""
      }
    });

    res.setHeader("Content-Type", response.headers.get("content-type"));
    res.setHeader("Accept-Ranges", "bytes");

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (err) {
    res.status(500).send("Proxy Error");
  }
}
