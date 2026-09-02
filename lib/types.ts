export type Song = {
  id: string;
  title: string;
  artist: string;
  videoId: string;
  genres: string[];
  views?: number | null;
};

export type Pair = {
  left: Song;
  right: Song;
};

/** ---- 멀티플레이 방(room) 관련 타입 ---- */

export type Player = {
  id: string; // 서버에서 발급하는 임의 ID (닉네임 아님, 중복 닉네임 허용을 위해 분리)
  nickname: string;
  score: number;
  isHost: boolean;
  answered: boolean; // 이번 라운드에 선택을 완료했는지
  chosenSide: 'left' | 'right' | null;
};

export type RoomStatus = 'waiting' | 'playing' | 'finished';

export type RoomState = {
  code: string; // 6자리 참가 코드
  hostId: string;
  players: Player[];
  totalRounds: number;
  currentRound: number; // 1부터 시작
  currentPair: Pair | null;
  usedSongIds: string[];
  roundRevealed: boolean; // 이번 라운드 정답 공개 여부
  status: RoomStatus;
  createdAt: number;
  /**
   * 서버 전용 — 조회수까지 채워진 전체 곡 풀 캐시.
   * 절대로 클라이언트에 그대로 내려보내면 안 됨 (정답 노출).
   * 방 시작(start) 시점에 한 번 채워서, 라운드마다 videos.list를 다시 부르지 않는다.
   */
  songPool: Song[];
};

/** 클라이언트로 내려보낼 수 있는, songPool이 제거된 안전한 방 상태 */
export type PublicRoomState = Omit<RoomState, 'songPool'>;
