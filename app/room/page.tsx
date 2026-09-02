'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

export default function RoomLobbyPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [nickname, setNickname] = useState('');
  const [roundsStr, setRoundsStr] = useState('5');
  const roundsValue = parseInt(roundsStr, 10);
  const isRoundsInvalid = mode === 'create' && (!roundsValue || roundsValue < 1);
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function savePlayerId(code: string, playerId: string) {
    localStorage.setItem(`viewbattle:${code}:playerId`, playerId);
  }

  async function handleCreate() {
    if (!nickname.trim()) return setError('닉네임을 입력해주세요.');
    if (!parseInt(roundsStr, 10) || parseInt(roundsStr, 10) < 1) {
    return setError('라운드 수를 1 이상으로 입력해주세요.');
  }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname, totalRounds: parseInt(roundsStr, 10) || 5 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      savePlayerId(data.room.code, data.playerId);
      router.push(`/room/${data.room.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '방 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!nickname.trim()) return setError('닉네임을 입력해주세요.');
    if (!code) return setError('방 코드를 입력해주세요.');
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      savePlayerId(code, data.playerId);
      router.push(`/room/${code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '참가에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-full flex flex-col items-center px-4 pt-6 pb-16">
      <div className="w-full max-w-[520px]">
        <Link href="/" className="flex items-baseline gap-2.5 py-2.5 pb-7 hover:opacity-80 transition w-fit">
          <span className="font-display text-[26px] text-gold">VIEW BATTLE</span>
          <small className="text-muted text-[12px]">조회수 대결 게임</small>
        </Link>

        <section className="card">
          <div className="flex gap-2 mb-6">
            <button
              className={`btn flex-1 ${mode === 'create' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setMode('create')}
            >
              방 만들기
            </button>
            <button
              className={`btn flex-1 ${mode === 'join' ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setMode('join')}
            >
              코드로 참가하기
            </button>
          </div>

          <div className="mb-4">
            <label className="block text-[13px] text-muted mb-2">닉네임</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="화면에 표시될 이름"
              maxLength={20}
              className="w-full bg-bg border border-line text-text px-3.5 py-3 rounded-[10px] text-sm outline-none focus:border-gold"
            />
          </div>

          {mode === 'create' ? (
            <div className="mb-2">
              <label className="block text-[13px] text-muted mb-2">라운드 수 (1~99)</label>
              <input
                type="number"
                min={1}
                max={99}
                value={roundsStr}
                onChange={(e) => setRoundsStr(e.target.value.slice(0, 2))}
                className="w-28 bg-bg border border-line text-text px-3.5 py-3 rounded-[10px] text-sm outline-none focus:border-gold"
              />
            </div>
          ) : (
            <div className="mb-2">
              <label className="block text-[13px] text-muted mb-2">방 코드</label>
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="예: AB12CD"
                className="w-full bg-bg border border-line text-text px-3.5 py-3 rounded-[10px] text-sm tracking-widest outline-none focus:border-gold"
              />
            </div>
          )}

          {error && (
            <div className="mt-3.5 p-3 rounded-[10px] bg-[rgba(255,79,94,0.12)] border border-[rgba(255,79,94,0.4)] text-[#ffb9c0] text-[13px]">
              {error}
            </div>
          )}

          <div className="h-px bg-line my-6" />

          <button
            className="btn btn-primary w-full"
            disabled={loading || isRoundsInvalid}
            onClick={mode === 'create' ? handleCreate : handleJoin}
          >
            {loading ? '처리 중…' : mode === 'create' ? '방 만들기' : '참가하기'}
          </button>
        </section>
      </div>
    </main>
  );
}
