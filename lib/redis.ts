import { Redis } from '@upstash/redis';

/**
 * Upstash REST 기반 Redis 클라이언트.
 * 서버(API Route)에서만 import 하세요. 브라우저 번들에 들어가면 안 됩니다.
 */
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || ''
});
