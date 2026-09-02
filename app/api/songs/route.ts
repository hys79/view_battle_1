import { NextRequest, NextResponse } from 'next/server';
import { loadSongs } from '@/lib/songs';

export const dynamic = 'force-dynamic';

type YoutubeVideoItem = {
  id: string;
  statistics?: { viewCount?: string };
};

/**
 * GET /api/songs
 *   - ?meta=1  → data/songs.csv 의 곡 개수만 반환 (YouTube API 호출 없음, 시작 화면 힌트용)
 *   - ?demo=1  → 임의 조회수로 채운 전체 곡 목록 반환
 *   - (기본)    → data/songs.csv 의 videoId를 모아 videos.list를 "한 번만" 호출해
 *                실시간 조회수를 채운 전체 곡 목록 반환 (search.list 미사용)
 *
 * YOUTUBE_API_KEY는 서버 환경변수(.env.local)에만 있으므로 브라우저에는
 * 절대 노출되지 않는다.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const songs = loadSongs();

  if (searchParams.get('meta') === '1') {
    return NextResponse.json({ count: songs.length });
  }

  const demoRequested = searchParams.get('demo') === '1';
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (demoRequested || !apiKey) {
    const withViews = songs.map((s) => ({
      ...s,
      views: Math.floor(500_000 + Math.random() * 900_000_000)
    }));
    return NextResponse.json({ demo: true, songs: withViews });
  }

  const ids = songs.map((s) => s.videoId);
  const CHUNK_SIZE = 50; // videos.list는 id를 한 번에 최대 50개까지만 허용
  console.log("현재 인식된 API 키:", apiKey ? `${apiKey.slice(0, 5)}... (길이: ${apiKey.length})` : "없음"); //debug용

  try {
    const viewMap: Record<string, number> = {};

    const currentKey = process.env.YOUTUBE_API_KEY?.trim();

  for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
    const chunk = ids.slice(i, i + CHUNK_SIZE);
    const params = new URLSearchParams({
      part: 'statistics',
      id: chunk.join(','),
      key: currentKey || '',
    });

    const url = `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`;
    console.log("조립된 구글 요청 URL:", url); // 콘솔에서 &key= 뒤에 키가 붙는지 확인

    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();

      if (!res.ok) {
        console.error("구글 403 에러 상세 내용:", JSON.stringify(data, null, 2)); //debug용
        const message = data?.error?.message || `YouTube API 오류 (HTTP ${res.status})`;
        return NextResponse.json({ error: message }, { status: res.status });
      }

      (data.items as YoutubeVideoItem[] | undefined)?.forEach((item) => {
        viewMap[item.id] = parseInt(item.statistics?.viewCount || '0', 10);
      });
    }

    const withViews = songs.map((s) => ({
      ...s,
      views: viewMap[s.videoId] ?? null
    }));

    return NextResponse.json({ demo: false, songs: withViews });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '알 수 없는 오류' },
      { status: 500 }
    );
  }
}
