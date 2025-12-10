import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl;
  const referer = req.headers.get("referer") || "";

  // STREAM FOLDERS
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

  for (const path of protectedPaths) {
    if (url.pathname.startsWith(path)) {
      
      // ✔ Stream allowed ONLY inside bd71.vercel.app player
      if (!referer.includes("bd71.vercel.app")) {
        return new NextResponse(
          `
          <html>
          <body style="background:black;color:red;text-align:center;padding-top:40px;font-family:sans-serif;">
            <h2>🚫 Access Denied</h2>
            <p>This stream can only be played from:</p>
            <h3 style="color:#00eaff;">bd71.vercel.app</h3>
          </body>
          </html>
          `,
          { status: 403, headers: { "Content-Type": "text/html" } }
        );
      }
    }
  }

  return NextResponse.next();
}
