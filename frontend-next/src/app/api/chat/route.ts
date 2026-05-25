import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { query, strategy, collection, chat_history } = await req.json();

    const response = await fetch("http://127.0.0.1:8000/api/query/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        strategy,
        collection,
        top_k: 5,
        chat_history: chat_history || [],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: errorText || `FastAPI error ${response.status}` },
        { status: response.status }
      );
    }

    const stream = new ReadableStream({
      async start(controller) {
        if (!response.body) {
          controller.close();
          return;
        }
        const reader = response.body.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } catch (e) {
          controller.error(e);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no", // prevent buffering in reverse proxies
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch stream" }, { status: 500 });
  }
}
