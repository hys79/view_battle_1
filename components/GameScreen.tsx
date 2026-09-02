'use client';

import type { Pair } from '@/lib/types';
import { formatViews, winnerSide } from '@/lib/gameLogic';
import SongCard from './SongCard';

export default function GameScreen({
  pair,
  roundNo,
  totalRounds,
  answered,
  chosenSide,
  onPick,
  onNext
}: {
  pair: Pair;
  roundNo: number;
  totalRounds: number;
  answered: boolean;
  chosenSide: 'left' | 'right' | null;
  onPick: (side: 'left' | 'right') => void;
  onNext: () => void;
}) {
  const { left, right } = pair;
  const sharedGenres = left.genres.filter((g) => right.genres.includes(g));
  const genreLabel = sharedGenres[0] || left.genres[0];
  const winner = answered ? winnerSide(pair) : null;
  const isCorrect = answered && chosenSide === winner;

  return (
    <section className="card">
      <div className="flex items-center justify-center gap-2.5 text-muted text-[13px] mb-5">
        <span>
          라운드 <b className="text-gold">{roundNo}</b> / <b className="text-gold">{totalRounds}</b>
        </span>
        <span className="bg-panel2 border border-line rounded-full px-2.5 py-0.5 text-[11.5px] text-text">
          장르: {genreLabel}
        </span>
      </div>

      <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4.5">
        <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-coral text-[#2a0006] font-display text-xl items-center justify-center shadow-[0_0_0_6px_#16121F]">
          VS
        </div>
        <SongCard song={left} revealed={answered} />
        <SongCard song={right} revealed={answered} />
      </div>

      <div className="mt-5.5 pt-5 border-t border-line text-center">
        <p className="text-muted text-[13.5px] mb-3.5">
          두 곡을 들어본 뒤, 조회수가 더 높다고 생각되는 쪽을 선택하세요.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <PickButton
            label="◀ 왼쪽 곡이 더 많음"
            active={chosenSide === 'left'}
            isWinner={winner === 'left'}
            answered={answered}
            onClick={() => onPick('left')}
          />
          <PickButton
            label="오른쪽 곡이 더 많음 ▶"
            active={chosenSide === 'right'}
            isWinner={winner === 'right'}
            answered={answered}
            onClick={() => onPick('right')}
          />
        </div>

        <div className="text-center mt-4 text-[14px] text-muted min-h-[20px]">
          {answered &&
            (isCorrect ? (
              <span>
                <b className="text-gold">정답!</b> &quot;
                {winner === 'left' ? left.title : right.title}&quot;의 조회수가 더
                많았어요. ({formatViews(left.views ?? 0)} / {formatViews(right.views ?? 0)})
              </span>
            ) : (
              <span>
                <b className="text-[#ffb9c0]">오답.</b> 정답은 &quot;
                {winner === 'left' ? left.title : right.title}&quot;였어요.
              </span>
            ))}
        </div>

        <div className={`flex justify-center mt-4.5 ${answered ? 'visible' : 'invisible'}`}>
          <button className="btn btn-primary" onClick={onNext}>
            다음 라운드
          </button>
        </div>
      </div>
    </section>
  );
}

function PickButton({
  label,
  active,
  isWinner,
  answered,
  onClick
}: {
  label: string;
  active: boolean;
  isWinner: boolean;
  answered: boolean;
  onClick: () => void;
}) {
  let cls = 'bg-bg border-line text-text';
  if (answered && isWinner) cls = 'bg-[rgba(242,183,5,0.15)] border-gold text-gold';
  else if (answered && active && !isWinner) cls = 'bg-[rgba(255,79,94,0.15)] border-coral text-[#ffb9c0]';

  return (
    <button
      disabled={answered}
      onClick={onClick}
      className={`px-2.5 py-4 rounded-xl font-bold text-[15px] border transition disabled:cursor-default hover:border-gold ${cls}`}
    >
      {label}
    </button>
  );
}
