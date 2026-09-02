import { NextRequest, NextResponse } from 'next/server';
import { getRoom, saveRoom, sanitizeRoomForClient } from '@/lib/rooms';
import { winnerSide } from '@/lib/gameLogic';

export const dynamic = 'force-dynamic';

/**
 * POST /api/rooms/[code]/answer
 * body: { playerId: string, side: 'left' | 'right' }
 * 마지막 사람이 답하는 순간 자동으로 채점하고 정답을 공개한다.
 */
export async function POST(req: NextRequest, { params }: { params: { code: string } }) {
  try {
    const body = await req.json();
    const playerId = String(body?.playerId ?? '');
    const side = body?.side as 'left' | 'right';

    if (side !== 'left' && side !== 'right') {
      return NextResponse.json({ error: '잘못된 선택 값입니다.' }, { status: 400 });
    }

    const room = await getRoom(params.code);
    if (!room) return NextResponse.json({ error: '존재하지 않는 방 코드입니다.' }, { status: 404 });
    if (room.status !== 'playing' || !room.currentPair) {
      return NextResponse.json({ error: '지금은 답을 제출할 수 없습니다.' }, { status: 409 });
    }
    if (room.roundRevealed) {
      // 이미 공개된 라운드에는 재제출 불가 (그냥 현재 상태 반환)
      return NextResponse.json({ room: sanitizeRoomForClient(room) });
    }

    const player = room.players.find((p) => p.id === playerId);
    if (!player) {
      return NextResponse.json({ error: '참가자 정보를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (!player.answered) {
      player.answered = true;
      player.chosenSide = side;
    }

    // 전원이 답했으면 자동으로 채점 + 공개
    if (room.players.every((p) => p.answered)) {
      const winner = winnerSide(room.currentPair as any);
      room.players.forEach((p) => {
        if (p.chosenSide === winner) p.score += 1;
      });
      room.roundRevealed = true;
    }

    await saveRoom(room);
    return NextResponse.json({ room: sanitizeRoomForClient(room) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '답 제출에 실패했습니다.' },
      { status: 500 }
    );
  }
}
