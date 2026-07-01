import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const perGuest = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "1 h"),
  prefix: "chat:guest",
});

const perIp = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "1 h"),
  prefix: "chat:ip",
});

export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function checkChatRateLimit(guestId: string, clientIp: string) {
  const guest = await perGuest.limit(guestId);

  // On localhost, IP is often "unknown" — don't bucket all dev traffic together
  const ip =
    clientIp === "unknown"
      ? { success: true, remaining: Infinity, reset: Date.now() }
      : await perIp.limit(clientIp);

  if (!guest.success || !ip.success) {
    const retryAfterSeconds = Math.ceil(
      Math.max(guest.reset - Date.now(), ip.reset - Date.now()) / 1000,
    );
    return { success: false, retryAfterSeconds };
  }

  return { success: true, remaining: Math.min(guest.remaining, ip.remaining) };
}
