import { NextRequest, NextResponse } from 'next/server';
import { getRoom, saveRoom, makePlayer, sanitizeRoomForClient } from '@/lib/rooms';

export const dynamic = 'force-dynamic';

/**
 * POST /api/rooms/[code]/join
 * body: { nickname: string }
 * 대기 중(waiting)인 방에만 참가할 수 있다.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const body = await req.json();
    const nickname = String(body?.nickname ?? '').trim();
    if (!nickname) {
      return NextResponse.json({ error: '닉네임을 입력해주세요.' }, { status: 400 });
    }

    const room = await getRoom(code);
    if (!room) {
      return NextResponse.json({ error: '존재하지 않는 방 코드입니다.' }, { status: 404 });
    }
    if (room.status !== 'waiting') {
      return NextResponse.json({ error: '이미 시작된 방에는 참가할 수 없습니다.' }, { status: 409 });
    }
    if (room.players.length >= 12) {
      return NextResponse.json({ error: '방이 가득 찼습니다.' }, { status: 409 });
    }

    const player = makePlayer(nickname, false);
    room.players.push(player);
    await saveRoom(room);

    return NextResponse.json({
      room: sanitizeRoomForClient(room),
      playerId: player.id
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '참가에 실패했습니다.' },
      { status: 500 }
    );
  }
}