import { cookies } from "next/headers";
import { getClientIp } from "@/lib/chat/rate-limit";
import { getPortfolioChatKitServer } from "@/lib/chat/portfolio-chatkit-server";

export const runtime = "nodejs";
export const maxDuration = 60;

const GUEST_COOKIE = "chat_guest_id";

export async function POST(request: Request) {
  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OPENAI_API_KEY not configured" },
      { status: 500 },
    );
  }

  const cookieStore = await cookies();
  const guestId = cookieStore.get(GUEST_COOKIE)?.value;

  if (!guestId) {
    return Response.json({ error: "Guest ID not found" }, { status: 400 });
  }

  const userId = `guest_${guestId}`;
  const clientIp = getClientIp(request);
  const body = await request.text();

  const server = getPortfolioChatKitServer();
  const result = await server.process(body, { userId, guestId, clientIp });

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
