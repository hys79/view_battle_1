import { NextRequest, NextResponse } from 'next/server';
import { getRoom, saveRoom, sanitizeRoomForClient } from '@/lib/rooms';
import { pickPair } from '@/lib/gameLogic';

export const dynamic = 'force-dynamic';

/**
 * POST /api/rooms/[code]/next
 * body: { playerId: string }
 * 방장만 다음 라운드로 넘길 수 있다. totalRounds를 넘기면 status='finished'.
 */
export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const body = await req.json();
    const playerId = String(body?.playerId ?? '');

    const room = await getRoom(params.code);
    if (!room) return NextResponse.json({ error: '존재하지 않는 방 코드입니다.' }, { status: 404 });
    if (room.hostId !== playerId) {
      return NextResponse.json({ error: '방장만 다음 라운드로 넘길 수 있습니다.' }, { status: 403 });
    }
    if (!room.roundRevealed) {
      return NextResponse.json({ error: '아직 이번 라운드 정답이 공개되지 않았습니다.' }, { status: 409 });
    }

    const nextRoundNo = room.currentRound + 1;

    if (nextRoundNo > room.totalRounds) {
      room.status = 'finished';
      room.currentPair = null;
      await saveRoom(room);
      return NextResponse.json({ room: sanitizeRoomForClient(room) });
    }

    let usedIds = new Set(room.usedSongIds);
    const available = room.songPool.filter((s) => s.views != null && !usedIds.has(s.id));
    if (available.length < 2) usedIds = new Set(); // 다 썼으면 재사용

    const nextPair = pickPair(room.songPool, usedIds);

    room.currentRound = nextRoundNo;
    room.currentPair = nextPair;
    room.usedSongIds = [...usedIds, nextPair.left.id, nextPair.right.id];
    room.roundRevealed = false;
    room.players.forEach((p) => {
      p.answered = false;
      p.chosenSide = null;
    });

    await saveRoom(room);
    return NextResponse.json({ room: sanitizeRoomForClient(room) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '다음 라운드 진행에 실패했습니다.' },
      { status: 500 }
    );
  }
}
