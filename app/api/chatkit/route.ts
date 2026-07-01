// import { auth } from "@clerk/nextjs/server";
import { cookies } from "next/headers";
import { checkChatRateLimit } from "@/lib/chat/rate-limit";
import { getPortfolioChatKitServer } from "@/lib/chat/portfolio-chatkit-server";

export const runtime = "nodejs";
export const maxDuration = 60;

const GUEST_COOKIE = "chat_guest_id";

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const guestId = cookieStore.get(GUEST_COOKIE)?.value;

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 },
    );
  }

  if (!guestId) {
    return Response.json({ error: "Guest ID not found" }, { status: 400 });
  }

  const rateLimit = await checkChatRateLimit(guestId, request);
  if (!rateLimit.success) {
    return Response.json(
      { error: "Rate limit exceeded.  Try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      },
    );
  }

  const userId = `guest_${guestId}`;
  const body = await request.text();
  const server = getPortfolioChatKitServer();
  const result = await server.process(body, { userId });

  if (result.isStreaming) {
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of result) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  return Response.json(result.toJSON());
}
