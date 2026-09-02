type YoutubeVideoItem = {
  id: string;
  statistics?: { viewCount?: string };
};

const CHUNK_SIZE = 50; // videos.list는 id를 한 번에 최대 50개까지만 허용

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * 여러 videoId의 실시간 조회수를 videos.list로 가져온다 (50개 단위로 자동 분할 호출).
 * apiKey가 없으면 데모용 임의 조회수를 반환한다.
 */
export async function fetchViewCounts(
  videoIds: string[]
): Promise<{ demo: boolean; views: Record<string, number> }> {
  const apiKey = process.env.YOUTUBE_API_KEY;

   // 임시 디버그 로그 (원인 확인 후 지울 것)
  console.log('[fetchViewCounts] apiKey exists:', !!apiKey, 'length:', apiKey?.length, 'videoIds count:', videoIds.length);
  
  if (!apiKey) {
    const views: Record<string, number> = {};
    videoIds.forEach((id) => {
      views[id] = Math.floor(500_000 + Math.random() * 900_000_000);
    });
    return { demo: true, views };
  }

  const views: Record<string, number> = {};

  for (const ids of chunk(videoIds, CHUNK_SIZE)) {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${ids.join(
      ','
    )}&key=${apiKey}`;
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();

    if (!res.ok) {
      const message = data?.error?.message || `YouTube API 오류 (HTTP ${res.status})`;
      throw new Error(message);
    }

    (data.items as YoutubeVideoItem[] | undefined)?.forEach((item) => {
      views[item.id] = parseInt(item.statistics?.viewCount || '0', 10);
    });
  }

  return { demo: false, views };
}
