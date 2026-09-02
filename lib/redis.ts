import { Redis } from '@upstash/redis';

let _redis: Redis | null = null;

function getRedisClient(): Redis {
  if (_redis) return _redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    // 이 예외는 이제 '요청 처리 중'에만 발생하므로 빌드를 막지 않는다.
    throw new Error(
      'UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN 환경변수가 설정되지 않았습니다.'
    );
  }

  _redis = new Redis({ url, token });
  return _redis;
}

// 기존 코드(`redis.get(...)`, `redis.set(...)`)를 그대로 쓸 수 있도록
// Proxy로 감싸서, 프로퍼티에 처음 접근하는 시점에 실제 클라이언트를 생성한다.
export const redis: Redis = new Proxy({} as Redis, {
  get(_target, prop, _receiver) {
    const client = getRedisClient();
    const value = Reflect.get(client, prop, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});