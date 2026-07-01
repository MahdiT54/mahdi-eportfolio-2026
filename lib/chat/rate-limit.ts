import { Ratelimit } from "@upstash/ratelimit"; // upstash packages
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv(); // redis.fromEnv() will auto read env variables

const perGuest = new Ratelimit({
  redis, // same as redis: redis         (when key: val matches, it returns the val)
  limiter: Ratelimit.slidingWindow(15, "1 h"),
  prefix: "chat:guest",
  enableProtection: true,
}); // check console.upstashio > data browser > rate limit > chat:guest & chat:ip =)

const perIp = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 h"),
  prefix: "chat:ip",
  enableProtection: true,
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
