import { NextRequest, NextResponse } from 'next/server';
import { createRoom, sanitizeRoomForClient } from '@/lib/rooms';

export const dynamic = 'force-dynamic';

/**
 * POST /api/rooms
 * body: { nickname: string, totalRounds: number }
 * 방을 만들고, 만든 사람을 방장(host)으로 등록한다.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const nickname = String(body?.nickname ?? '').trim();
    const totalRounds = parseInt(body?.totalRounds, 10) || 5;

    if (!nickname) {
      return NextResponse.json({ error: '닉네임을 입력해주세요.' }, { status: 400 });
    }

    const room = await createRoom(nickname, totalRounds);
    const me = room.players[0]; // 방장 = 첫 번째 플레이어

    return NextResponse.json({
      room: sanitizeRoomForClient(room),
      playerId: me.id
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : '방 생성에 실패했습니다.' },
      { status: 500 }
    );
  }
}
