import type { Song, Pair } from './types';

export const MAX_VIEW_RATIO = 2.5; // 이 배수 이내여야 "비슷한 조회수"로 간주
export const MIN_VIEW_RATIO = 1.02; // 조회수가 완전히 같으면 문제로 성립하지 않으므로 최소 차이 요구

export function shareGenre(a: Song, b: Song): boolean {
  return a.genres.some((g) => b.genres.includes(g));
}

export function viewRatio(a: Song, b: Song): number {
  if (!a.views || !b.views) return Infinity;
  const hi = Math.max(a.views, b.views);
  const lo = Math.min(a.views, b.views);
  return hi / lo;
}

/**
 * 비슷한 장르 + 비슷한 조회수를 가진 두 곡을 뽑는다.
 * 순수 함수로 만들어서, 지금은 클라이언트 상태(useState)에서 호출하지만
 * 나중에 멀티플레이 서버(방장 권한으로 라운드를 생성하는 쪽)에서도
 * 동일한 함수를 그대로 재사용할 수 있게 했다.
 */
export function pickPair(pool: Song[], usedIds: Set<string>): Pair {
  const available = pool.filter((s) => s.views != null && !usedIds.has(s.id));

  if (available.length < 2) {
    // 다 썼으면 재사용 (usedIds를 호출부에서 초기화해야 함)
    return pickPair(pool, new Set());
  }

  const shuffled = [...available].sort(() => Math.random() - 0.5);

  // 1차: 같은 장르 + 조회수 비율 조건 만족
  for (const a of shuffled) {
    const candidates = available.filter(
      (b) =>
        b.id !== a.id &&
        shareGenre(a, b) &&
        viewRatio(a, b) <= MAX_VIEW_RATIO &&
        viewRatio(a, b) >= MIN_VIEW_RATIO
    );
    if (candidates.length) {
      const b = candidates[Math.floor(Math.random() * candidates.length)];
      return randomOrder(a, b);
    }
  }

  // 2차 완화: 장르만 같으면 허용
  for (const a of shuffled) {
    const candidates = available.filter(
      (b) => b.id !== a.id && shareGenre(a, b) && viewRatio(a, b) >= MIN_VIEW_RATIO
    );
    if (candidates.length) {
      const b = candidates[Math.floor(Math.random() * candidates.length)];
      return randomOrder(a, b);
    }
  }

  // 3차 완화: 무작위 두 곡
  return randomOrder(shuffled[0], shuffled[1]);
}

function randomOrder(a: Song, b: Song): Pair {
  return Math.random() < 0.5 ? { left: a, right: b } : { left: b, right: a };
}

export function formatViews(n: number): string {
  return n.toLocaleString('ko-KR');
}

export function winnerSide(pair: Pair): 'left' | 'right' {
  const { left, right } = pair;
  return (left.views ?? 0) >= (right.views ?? 0) ? 'left' : 'right';
}
