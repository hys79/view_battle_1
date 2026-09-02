'use client';

import type { Pair, Player } from '@/lib/types';
import { formatViews, winnerSide } from '@/lib/gameLogic';
import SongCard from '@/components/SongCard';
import Scoreboard from './Scoreboard';

export default function RoomGameScreen({
  pair,
  roundNo,
  totalRounds,
  me,
  players,
  revealed,
  isHost,
  onPick,
  onNext
}: {
  pair: Pair;
  roundNo: number;
  totalRounds: number;
  me: Player;
  players: Player[];
  revealed: boolean;
  isHost: boolean;
  onPick: (side: 'left' | 'right') => void;
  onNext: () => void;
}) {
  const { left, right } = pair;
  const sharedGenres = left.genres.filter((g) => right.genres.includes(g));
  const genreLabel = sharedGenres[0] || left.genres[0];
  const winner = revealed ? winnerSide(pair) : null;
  const answeredCount = players.filter((p) => p.answered).length;

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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-5">
        <div>
          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4.5">
            <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-14 h-14 rounded-full bg-coral text-[#2a0006] font-display text-xl items-center justify-center shadow-[0_0_0_6px_#16121F]">
              VS
            </div>
            <SongCard song={left} revealed={revealed} />
            <SongCard song={right} revealed={revealed} />
          </div>

          <div className="mt-5.5 pt-5 border-t border-line text-center">
            {!me.answered && (
              <p className="text-muted text-[13.5px] mb-3.5">
                두 곡을 들어본 뒤, 조회수가 더 높다고 생각되는 쪽을 선택하세요.
              </p>
            )}
            {me.answered && !revealed && (
              <p className="text-muted text-[13.5px] mb-3.5">
                선택 완료! 다른 참가자를 기다리는 중… ({answeredCount}/{players.length})
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <PickButton
                label="◀ 왼쪽 곡이 더 많음"
                active={me.chosenSide === 'left'}
                isWinner={winner === 'left'}
                disabled={me.answered}
                onClick={() => onPick('left')}
              />
              <PickButton
                label="오른쪽 곡이 더 많음 ▶"
                active={me.chosenSide === 'right'}
                isWinner={winner === 'right'}
                disabled={me.answered}
                onClick={() => onPick('right')}
              />
            </div>

            {revealed && (
              <div className="text-center mt-4 text-[14px] text-muted">
                정답: <b className="text-gold">{winner === 'left' ? left.title : right.title}</b>{' '}
                ({formatViews(left.views ?? 0)} / {formatViews(right.views ?? 0)})
              </div>
            )}

            {revealed && isHost && (
              <div className="flex justify-center mt-4.5">
                <button className="btn btn-primary" onClick={onNext}>
                  {roundNo >= totalRounds ? '최종 결과 보기' : '다음 라운드'}
                </button>
              </div>
            )}
            {revealed && !isHost && (
              <p className="text-muted text-[13px] mt-4.5">방장이 다음 라운드를 시작하길 기다리는 중…</p>
            )}
          </div>
        </div>

        <div>
          <div className="text-[13px] text-muted mb-2">스코어보드</div>
          <Scoreboard players={players} meId={me.id} />
        </div>
      </div>
    </section>
  );
}

function PickButton({
  label,
  active,
  isWinner,
  disabled,
  onClick
}: {
  label: string;
  active: boolean;
  isWinner: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  let cls = 'bg-bg border-line text-text';
  if (isWinner) cls = 'bg-[rgba(242,183,5,0.15)] border-gold text-gold';
  else if (active) cls = 'bg-panel2 border-gold text-gold';

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`px-2.5 py-4 rounded-xl font-bold text-[15px] border transition disabled:cursor-default hover:border-gold ${cls}`}
    >
      {label}
    </button>
  );
}
