import { NextRequest, NextResponse } from 'next/server';
import { getRoom, saveRoom, sanitizeRoomForClient } from '@/lib/rooms';
import { loadSongs } from '@/lib/songs';
import { fetchViewCounts } from '@/lib/youtube';
import { pickPair } from '@/lib/gameLogic';

export const dynamic = 'force-dynamic';

/**
 * POST /api/rooms/[code]/start
 * body: { playerId: string }
 * 방장만 게임을 시작할 수 있다.
 */
export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const body = await req.json();
    const playerId = String(body?.playerId ?? '');

    const room = await getRoom(params.code);
    if (!room) return NextResponse.json({ error: '존재하지 않는 방 코드입니다.' }, { status: 404 });
    if (room.hostId !== playerId) {
      return NextResponse.json({ error: '방장만 게임을 시작할 수 있습니다.' }, { status: 403 });
    }
    if (room.status !== 'waiting') {
      return NextResponse.json({ error: '이미 시작된 방입니다.' }, { status: 409 });
    }
    if (room.players.length < 2) {
      return NextResponse.json({ error: '최소 2명이 모여야 시작할 수 있습니다.' }, { status: 400 });
    }

    const baseSongs = loadSongs();
    const { views } = await fetchViewCounts(baseSongs.map((s) => s.videoId));
    const songPool = baseSongs.map((s) => ({ ...s, views: views[s.videoId] ?? null }));

    if (songPool.filter((s) => s.views != null).length < 2) {
      return NextResponse.json(
        { error: '사용 가능한 곡이 2개 미만입니다. data/songs.csv를 확인해주세요.' },
        { status: 500 }
      );
    }

    const firstPair = pickPair(songPool, new Set());

    room.songPool = songPool;
    room.status = 'playing';
    room.currentRound = 1;
    room.currentPair = firstPair;
    room.usedSongIds = [firstPair.left.id, firstPair.right.id];
    room.roundRevealed = false;
    room.players.forEach((p) => {
      p.score = 0;
      p.answered = false;
      p.chosenSide = null;
    });

    await saveRoom(room);
    return NextResponse.json({ room: sanitizeRoomForClient(room) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '게임 시작에 실패했습니다.' },
      { status: 500 }
    );
  }
}
