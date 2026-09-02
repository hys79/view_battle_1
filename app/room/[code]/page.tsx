'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { PublicRoomState } from '@/lib/types';
import RoomGameScreen from '@/components/room/RoomGameScreen';
import RankingScreen from '@/components/room/RankingScreen';
import Scoreboard from '@/components/room/Scoreboard';
import Link from 'next/link';

const POLL_INTERVAL_MS = 1200;

export default function RoomPage() {
  const params = useParams<{ code: string }>();
  const router = useRouter();
  const code = (params.code as string).toUpperCase();

  const [playerId, setPlayerId] = useState<string | null>(null);
  const [room, setRoom] = useState<PublicRoomState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 이 방에 참가할 때 저장해둔 내 playerId를 불러온다. 없으면 로비로 되돌린다.
  useEffect(() => {
    const saved = localStorage.getItem(`viewbattle:${code}:playerId`);
    if (!saved) {
      router.replace('/room');
      return;
    }
    setPlayerId(saved);
  }, [code, router]);

  // 방 상태 폴링
  useEffect(() => {
    if (!playerId) return;

    async function poll() {
      try {
        const res = await fetch(`/api/rooms/${code}`, { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setRoom(data.room);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '방 정보를 불러오지 못했습니다.');
      }
    }

    poll();
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [code, playerId]);

  async function callAction(path: string, extra: Record<string, unknown> = {}) {
    if (!playerId) return;
    try {
      const res = await fetch(`/api/rooms/${code}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId, ...extra })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setRoom(data.room);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '요청에 실패했습니다.');
    }
  }

  async function handleStart() {
    setStarting(true);
    await callAction('start');
    setStarting(false);
  }
  const handlePick = (side: 'left' | 'right') => callAction('answer', { side });
  const handleNext = () => callAction('next');

  if (!room || !playerId) {
    return (
      <main className="min-h-full flex items-center justify-center px-4">
        <div className="text-muted">불러오는 중…</div>
      </main>
    );
  }

  const me = room.players.find((p) => p.id === playerId);
  const isHost = room.hostId === playerId;

  if (!me) {
    return (
      <main className="min-h-full flex items-center justify-center px-4">
        <div className="text-muted">참가자 정보를 찾을 수 없습니다.</div>
      </main>
    );
  }

  return (
    <main className="min-h-full flex flex-col items-center px-4 pt-6 pb-16">
      <div className="w-full max-w-[1180px] flex items-center justify-between py-2.5 pb-7">
        <Link href="/" className="flex items-baseline gap-2.5 hover:opacity-80 transition w-fit">
          <span className="font-display text-[26px] text-gold">VIEW BATTLE</span>
          <small className="text-muted text-[12px]">조회수 대결 게임</small>
        </Link>
      </div>

      <div className="w-full max-w-[1180px]">
        {error && (
          <div className="mb-4 p-3 rounded-[10px] bg-[rgba(255,79,94,0.12)] border border-[rgba(255,79,94,0.4)] text-[#ffb9c0] text-[13px]">
            {error}
          </div>
        )}

        {room.status === 'waiting' && (
          <section className="card max-w-[520px] mx-auto">
            <div className="text-center mb-5">
              <div className="text-muted text-[13px] mb-1">방 코드</div>
              <div className="font-display text-[40px] text-gold tracking-widest">{room.code}</div>
              <p className="text-muted text-[13px] mt-2">친구에게 이 코드를 알려주세요.</p>
            </div>

            <div className="text-[13px] text-muted mb-2">참가자 ({room.players.length}명)</div>
            <Scoreboard players={room.players} meId={playerId} />

            <div className="h-px bg-line my-6" />

            {isHost ? (
              <button
                className="btn btn-primary w-full"
                disabled={starting || room.players.length < 2}
                onClick={handleStart}
              >
                {starting
                  ? '시작하는 중…'
                  : room.players.length < 2
                  ? '2명 이상 모이면 시작 가능'
                  : '게임 시작'}
              </button>
            ) : (
              <p className="text-center text-muted text-[13.5px]">
                방장이 게임을 시작하길 기다리는 중…
              </p>
            )}
          </section>
        )}

        {room.status === 'playing' && room.currentPair && (
          <RoomGameScreen
            pair={room.currentPair}
            roundNo={room.currentRound}
            totalRounds={room.totalRounds}
            me={me}
            players={room.players}
            revealed={room.roundRevealed}
            isHost={isHost}
            onPick={handlePick}
            onNext={handleNext}
          />
        )}

        {room.status === 'finished' && (
          <RankingScreen players={room.players} onExit={() => router.push('/room')} />
        )}
      </div>
    </main>
  );
}
