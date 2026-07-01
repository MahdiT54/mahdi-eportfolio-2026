import { Ratelimit } from "@upstash/ratelimit";
import { getChatStorePrefix, getRedis } from "@/lib/upstash";

const redis = getRedis();

const rateLimitPrefix = getChatStorePrefix();

const perGuest = new Ratelimit({
  redis, // same as redis: redis         (when key: val matches, it returns the val)
  limiter: Ratelimit.slidingWindow(15, "1 h"),
  prefix: `${rateLimitPrefix}:guest`,
  enableProtection: true,
}); // check console.upstashio > data browser > rate limit > chat:guest & chat:ip =)

const perIp = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 h"),
  prefix: `${rateLimitPrefix}:ip`,
  enableProtection: true,
});

const perGuestDaily = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(25, "24 h"),
  prefix: `${rateLimitPrefix}:guest:daily`,
  enableProtection: true,
});

const perIpDaily = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, "24 h"),
  prefix: `${rateLimitPrefix}:ip:daily`,
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
  const [guestHour, guestDay] = await Promise.all([
    perGuest.limit(guestId),
    perGuestDaily.limit(guestId),
  ]);

  const ipHour =
    clientIp === "unknown"
      ? { success: true, remaining: Infinity, reset: Date.now() }
      : await perIp.limit(clientIp);

  const ipDay =
    clientIp === "unknown"
      ? { success: true, remaining: Infinity, reset: Date.now() }
      : await perIpDaily.limit(clientIp);

  const checks = [guestHour, guestDay, ipHour, ipDay];

  if (checks.some((c) => !c.success)) {
    const retryAfterSeconds = Math.ceil(
      Math.max(...checks.map((c) => c.reset - Date.now())) / 1000,
    );
    return { success: false, retryAfterSeconds };
  }

  return {
    success: true,
    remaining: Math.min(...checks.map((c) => c.remaining)),
  };
}
