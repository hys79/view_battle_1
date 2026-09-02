import { redis } from './redis';
import type { Pair, PublicRoomState, Player, RoomState, Song } from './types';

const ROOM_TTL_SECONDS = 60 * 60 * 6; // 6시간 동안 사용 없으면 자동 삭제
const CODE_LENGTH = 6;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 헷갈리는 0/O, 1/I 제외

function roomKey(code: string) {
  return `room:${code}`;
}

function randomId(): string {
  // Node/Edge 런타임 모두에서 사용 가능
  return crypto.randomUUID();
}

function randomCode(): string {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

/** 이미 사용 중인 코드와 겹치지 않는 새 방 코드를 발급 */
async function generateUniqueRoomCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const code = randomCode();
    const exists = await redis.get(roomKey(code));
    if (!exists) return code;
  }
  throw new Error('방 코드를 생성하지 못했습니다. 잠시 후 다시 시도해주세요.');
}

export async function getRoom(code: string): Promise<RoomState | null> {
  const room = await redis.get<RoomState>(roomKey(code.toUpperCase()));
  return room ?? null;
}

export async function saveRoom(room: RoomState): Promise<void> {
  await redis.set(roomKey(room.code), room, { ex: ROOM_TTL_SECONDS });
}

export function makePlayer(nickname: string, isHost: boolean): Player {
  return {
    id: randomId(),
    nickname: nickname.trim().slice(0, 20) || '익명',
    score: 0,
    isHost,
    answered: false,
    chosenSide: null
  };
}

export async function createRoom(hostNickname: string, totalRounds: number): Promise<RoomState> {
  const code = await generateUniqueRoomCode();
  const host = makePlayer(hostNickname, true);

  const room: RoomState = {
    code,
    hostId: host.id,
    players: [host],
    totalRounds: Math.min(99, Math.max(1, totalRounds)),
    currentRound: 0,
    currentPair: null,
    usedSongIds: [],
    roundRevealed: false,
    status: 'waiting',
    createdAt: Date.now(),
    songPool: []
  };

  await saveRoom(room);
  return room;
}

/**
 * 정답이 공개되지 않은 라운드라면 클라이언트로 조회수(views)를 보내지 않는다.
 * songPool은 통째로 정답 스포일러라서 클라이언트 응답에서 항상 제거한다.
 */
export function sanitizeRoomForClient(room: RoomState): PublicRoomState {
  const { songPool, currentPair, ...rest } = room;

  if (room.roundRevealed || !currentPair) {
    return { ...rest, currentPair };
  }

  const hide = (s: Song) => ({ ...s, views: undefined });
  return {
    ...rest,
    currentPair: {
      left: hide(currentPair.left),
      right: hide(currentPair.right)
    }
  };
}
