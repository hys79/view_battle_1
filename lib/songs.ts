import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import type { Song } from './types';

// 엑셀에서 이 파일을 직접 열고 저장해도 되도록 CSV로 관리합니다.
// 컬럼 순서: 가수, 제목, 장르, videoId
// 장르 칸에 쉼표(,)로 여러 태그를 넣고 싶다면 반드시 큰따옴표로 감싸주세요.
// 예) "kpop,dance,pop"  ← 엑셀에서 셀 안에 쉼표를 입력하면 저장 시 자동으로 따옴표가 붙습니다.
const CSV_PATH = path.join(process.cwd(), 'data', 'songs.csv');

type CsvRow = {
  가수?: string;
  제목?: string;
  장르?: string;
  videoId?: string;
  artist?: string;
  title?: string;
  genre?: string;
};

// 이 파일은 서버(API Route)에서만 import 되어야 합니다. ('fs' 사용)
export function loadSongs(): Song[] {
  let csvText = fs.readFileSync(CSV_PATH, 'utf-8');

  // Excel "CSV UTF-8" 저장 시 붙는 BOM 제거 (없으면 첫 헤더 파싱이 깨짐)
  if (csvText.charCodeAt(0) === 0xfeff) {
    csvText = csvText.slice(1);
  }

  const parsed = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim()
  });

  const usedIds = new Map<string, number>();
  let skippedCount = 0;

  const songs: Song[] = parsed.data
    .map((row, i) => {
      const artist = (row['가수'] ?? row['artist'] ?? '').trim();
      const title = (row['제목'] ?? row['title'] ?? '').trim();
      const genreRaw = (row['장르'] ?? row['genre'] ?? '').trim();
      const videoId = (row['videoId'] ?? '').trim();

      const genres = genreRaw
        .split(/[,;/]/)
        .map((g) => g.trim())
        .filter(Boolean);

      let id = slugify(`${artist}-${title}`) || `song-${i}`;
      if (usedIds.has(id)) {
        const n = (usedIds.get(id) ?? 0) + 1;
        usedIds.set(id, n);
        id = `${id}-${n}`;
      } else {
        usedIds.set(id, 0);
      }

      return { id, artist, title, genres, videoId };
    })
    // videoId나 제목이 비어있는 빈 줄은 건너뜀 (엑셀에서 흔히 생기는 빈 행 대비)
    .filter((s) => {
      const ok = Boolean(s.videoId && s.title);
      if (!ok) skippedCount++;
      return ok;
    });

  if (skippedCount > 0) {
    // 빌드/배포를 막을 정도는 아니므로 throw하지 않고 서버 로그로만 남긴다.
    console.warn(`[songs.csv] videoId 또는 제목이 비어 있어 ${skippedCount}개 행을 건너뛰었습니다.`);
  }

  return songs;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/(^-|-$)/g, '');
}