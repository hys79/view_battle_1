import { NextRequest, NextResponse } from 'next/server';
import { getRoom, sanitizeRoomForClient } from '@/lib/rooms';

export const dynamic = 'force-dynamic';

/**
 * GET /api/rooms/[code]
 * 클라이언트가 1~1.5초 간격으로 폴링하는 엔드포인트.
 * 정답이 공개되지 않은 라운드는 views가 제거된 상태로 내려간다.
 */
export async function GET(_req: NextRequest, { params }: { params: { code: string } }) {
  const room = await getRoom(params.code);
  if (!room) {
    return NextResponse.json({ error: '존재하지 않는 방 코드입니다.' }, { status: 404 });
  }
  return NextResponse.json({ room: sanitizeRoomForClient(room) });
}
