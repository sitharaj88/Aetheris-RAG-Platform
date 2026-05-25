import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return proxyRequest(req, params.path);
}

export async function POST(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return proxyRequest(req, params.path);
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  const params = await props.params;
  return proxyRequest(req, params.path);
}

async function proxyRequest(req: NextRequest, pathSegments: string[]) {
  try {
    const path = pathSegments.join("/");
    const url = new URL(req.url);
    const searchParams = url.search;
    const targetUrl = `http://127.0.0.1:8000/api/${path}${searchParams}`;

    const headers = new Headers();
    req.headers.forEach((value, key) => {
      const k = key.toLowerCase();
      // Skip hop-by-hop headers and host
      if (k !== "host" && k !== "connection" && k !== "transfer-encoding") {
        headers.set(key, value);
      }
    });

    let body: BodyInit | null = null;

    if (req.method !== "GET" && req.method !== "HEAD") {
      const contentType = req.headers.get("content-type") || "";

      if (contentType.includes("multipart/form-data")) {
        // For multipart uploads: pass raw bytes and keep original content-type
        // (which includes the boundary). This avoids re-encoding FormData.
        body = await req.arrayBuffer();
      } else {
        body = await req.text();
      }
    }

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
    });

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (key.toLowerCase() !== "content-encoding" && key.toLowerCase() !== "transfer-encoding") {
        responseHeaders.set(key, value);
      }
    });

    if (response.status === 204) {
      return new Response(null, { status: 204, headers: responseHeaders });
    }

    const responseBody = await response.arrayBuffer();
    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders
    });
  } catch (err: any) {
    console.error("Proxy error:", err);
    return NextResponse.json({ error: err.message || "Proxy error" }, { status: 502 });
  }
}
