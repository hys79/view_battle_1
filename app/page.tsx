'use client';

import { useEffect, useState } from 'react';
import type { Song, Pair } from '@/lib/types';
import { pickPair } from '@/lib/gameLogic';
import StartScreen from '@/components/StartScreen';
import LoadingScreen from '@/components/LoadingScreen';
import GameScreen from '@/components/GameScreen';
import FinalScreen from '@/components/FinalScreen';
import Link from 'next/link';

type Screen = 'start' | 'loading' | 'game' | 'final';

export default function Home() {
  const [screen, setScreen] = useState<Screen>('start');
  const [error, setError] = useState<string | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [poolSize, setPoolSize] = useState<number | null>(null);
  const [totalRounds, setTotalRounds] = useState(5);
  const [roundNo, setRoundNo] = useState(0);
  const [score, setScore] = useState(0);
  const [usedIds, setUsedIds] = useState<Set<string>>(new Set());
  const [pair, setPair] = useState<Pair | null>(null);
  const [answered, setAnswered] = useState(false);
  const [chosenSide, setChosenSide] = useState<'left' | 'right' | null>(null);

  // 시작 화면에 곡 풀 개수를 보여주기 위해, YouTube API를 호출하지 않는
  // 가벼운 meta 엔드포인트만 미리 불러온다 (data/songs.csv 행 개수).
  useEffect(() => {
    fetch('/api/songs?meta=1')
      .then((res) => res.json())
      .then((data) => setPoolSize(data.count))
      .catch(() => setPoolSize(null));
  }, []);

  async function handleStart(rounds: number, demoMode: boolean) {
    setError(null);
    setTotalRounds(rounds);
    setScreen('loading');

    try {
      const res = await fetch(`/api/songs${demoMode ? '?demo=1' : ''}`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'API 요청 실패');

      const nextSongs: Song[] = data.songs ?? [];
      if (nextSongs.length < 2) {
        throw new Error('data/songs.csv 에서 사용 가능한 곡이 2개 미만입니다.');
      }

      setSongs(nextSongs);

      const initialUsed = new Set<string>();
      const firstPair = pickPair(nextSongs, initialUsed);
      initialUsed.add(firstPair.left.id);
      initialUsed.add(firstPair.right.id);

      setUsedIds(initialUsed);
      setPair(firstPair);
      setRoundNo(1);
      setScore(0);
      setAnswered(false);
      setChosenSide(null);
      setScreen('game');
    } catch (err) {
      setError(
        (err instanceof Error ? err.message : '알 수 없는 오류') +
          ' — 잠시 후 다시 시도하거나 데모 모드를 사용해보세요.'
      );
      setScreen('start');
    }
  }

  function handlePick(side: 'left' | 'right') {
    if (answered || !pair) return;
    const winner = (pair.left.views ?? 0) >= (pair.right.views ?? 0) ? 'left' : 'right';
    if (side === winner) setScore((s) => s + 1);
    setChosenSide(side);
    setAnswered(true);
  }

  function handleNext() {
    const next = roundNo + 1;
    if (next > totalRounds) {
      setScreen('final');
      return;
    }

    let currentUsed = usedIds;
    const available = songs.filter((s) => s.views != null && !currentUsed.has(s.id));
    if (available.length < 2) currentUsed = new Set();

    const nextPair = pickPair(songs, currentUsed);
    const newUsed = new Set(currentUsed);
    newUsed.add(nextPair.left.id);
    newUsed.add(nextPair.right.id);

    setUsedIds(newUsed);
    setPair(nextPair);
    setRoundNo(next);
    setAnswered(false);
    setChosenSide(null);
  }

  function handleRetry() {
    setScreen('start');
  }

  function goHome() {
    setScreen('start');
    setError(null);
}

  // 게임 화면에서는 유튜브 영상이 더 크게 보이도록 컨테이너 폭을 넓힌다.
  const containerMax = screen === 'game' ? 'max-w-[1180px]' : 'max-w-[920px]';

  return (
    <main className="min-h-full flex flex-col items-center px-4 pt-6 pb-16">
      <div className={`w-full ${containerMax} flex items-center justify-between py-2.5 pb-7 transition-[max-width]`}>
        <button
          type="button"
          onClick={goHome}
          className="flex items-baseline gap-2.5 hover:opacity-80 transition"
        >
          <span className="font-display text-[26px] text-gold">VIEW BATTLE</span>
          <small className="text-muted text-[12px]">조회수 대결 게임</small>
        </button>
        {screen === 'start' && (
          <a href="/room" className="btn btn-ghost text-[13px] px-4 py-2">
            친구와 함께하기 →
          </a>
        )}
        {screen === 'game' && (
          <div className="flex gap-4.5 text-[14px] text-muted">
            <span>
              라운드 <b className="text-text text-[16px]">{roundNo}</b>/
              <b className="text-text text-[16px]">{totalRounds}</b>
            </span>
            <span>
              점수 <b className="text-text text-[16px]">{score}</b>
            </span>
          </div>
        )}
      </div>

      <div className={`w-full ${containerMax} transition-[max-width]`}>
        {screen === 'start' && (
          <StartScreen poolSize={poolSize} onStart={handleStart} error={error} />
        )}
        {screen === 'loading' && <LoadingScreen />}
        {screen === 'game' && pair && (
          <GameScreen
            pair={pair}
            roundNo={roundNo}
            totalRounds={totalRounds}
            answered={answered}
            chosenSide={chosenSide}
            onPick={handlePick}
            onNext={handleNext}
          />
        )}
        {screen === 'final' && <FinalScreen score={score} total={totalRounds} onRetry={handleRetry} />}
      </div>
    </main>
  );
}
