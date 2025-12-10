import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl;
  const referer = req.headers.get("referer") || "";

  // Stream folders list — only these will be locked
  const protectedPaths = [
    "/doraemon",
    "/sonyaath",
    "/kolkatamovies",
    "/bollywood1",
    "/bollywood2",
    "/jiocinema",
    "/cartoons",
    "/dorymon"
  ];

  // Domain allowed to load stream
  const allowedDomain = "bd71.vercel.app";

  for (const path of protectedPaths) {
    if (url.pathname.startsWith(path)) {

      // If referer NOT from bd71 → block
      if (!referer.includes(allowedDomain)) {
        return new NextResponse(
          `
          <html>
          <body style="background:black;color:red;text-align:center;padding-top:40px;font-family:sans-serif;">
            <h2>🚫 Access Denied</h2>
            <p>This stream can only be played from:</p>
            <h3 style="color:#00eaff;">${allowedDomain}</h3>
          </body>
          </html>
          `,
          {
            status: 403,
            headers: { "Content-Type": "text/html" }
          }
        );
      }
    }
  }

  return NextResponse.next();
}
