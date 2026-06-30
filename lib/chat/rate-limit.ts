import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const perGuest = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(25, "1 h"),
  prefix: "chat:guest",
});

const perIp = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "1 h"),
  prefix: "chat:ip",
});

function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function checkChatRateLimit(guestId: string, request: Request) {
  const [guest, ip] = await Promise.all([
    perGuest.limit(guestId),
    perIp.limit(getClientIp(request)),
  ]);

  if (!guest.success || !ip.success) {
    const retryAfterSeconds = Math.ceil(
      Math.max(guest.reset - Date.now(), ip.reset - Date.now()) / 1000,
    );
    return { success: false, retryAfterSeconds };
  }
  return { success: true, remaining: Math.min(guest.remaining, ip.remaining) };
}
