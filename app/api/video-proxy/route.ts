import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("Missing url parameter", { status: 400 });
  }

  const rangeHeader = request.headers.get("range");

  try {
    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    };
    if (rangeHeader) {
      headers["Range"] = rangeHeader;
    }

    const res = await fetch(url, { headers });

    if (!res.ok && res.status !== 206) {
      return new NextResponse("Failed to fetch video", { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "video/mp4";
    const contentLength = res.headers.get("content-length");
    const contentRange = res.headers.get("content-range");

    const buffer = await res.arrayBuffer();

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
      "Accept-Ranges": "bytes",
    };

    if (rangeHeader && res.status === 206 && contentRange) {
      responseHeaders["Content-Range"] = contentRange;
      return new NextResponse(buffer, {
        status: 206,
        headers: responseHeaders,
      });
    }

    if (contentLength) {
      responseHeaders["Content-Length"] = contentLength;
    }

    return new NextResponse(buffer, {
      headers: responseHeaders,
    });
  } catch {
    return new NextResponse("Failed to fetch video", { status: 500 });
  }
}
