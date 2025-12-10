export default async function handler(req, res) {
  const allowedDomain = "bd71.vercel.app";
  const referer = req.headers.referer || "";

  const streamUrl = req.query.url;

  // ❌ If directly opened in browser → show HTML warning page
  if (!referer || !referer.includes(allowedDomain)) {
    return res.status(200).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Access Denied</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { 
            background: #0d0d0d; 
            color: #ff4444; 
            font-family: Arial; 
            display: flex; 
            justify-content: center; 
            align-items: center;
            flex-direction: column;
            height: 100vh; 
            text-align: center;
          }
          a {
            color: #00eaff;
            font-size: 18px;
            text-decoration: none;
            border: 1px solid #00eaff;
            padding: 8px 16px;
            border-radius: 6px;
          }
        </style>
      </head>
      <body>
        <h2>🚫 Access Forbidden</h2>
        <p>This stream can only be opened from:</p>
        <h3><a href="https://bd71.vercel.app">bd71.vercel.app</a></h3>
        <p>Direct opening or external usage is not allowed.</p>
      </body>
      </html>
    `);
  }

  // ❗ When valid request from your site → fetch stream
  if (!streamUrl) {
    return res.status(400).send("Proxy Error: No Stream URL Provided");
  }

  try {
    const response = await fetch(streamUrl);
    const buffer = await response.arrayBuffer();
    const type = response.headers.get("content-type");

    res.setHeader("Content-Type", type);
    res.setHeader("Cache-Control", "no-store");

    res.send(Buffer.from(buffer));
  } catch (err) {
    res.status(500).send("Proxy Error: Stream Unavailable");
  }
}
