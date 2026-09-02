'use client';

import type { Player } from '@/lib/types';

export default function RankingScreen({
  players,
  onExit
}: {
  players: Player[];
  onExit: () => void;
}) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <section className="card">
      <div className="text-center mb-6">
        <div className="text-muted text-[14px]">최종 순위</div>
      </div>

      <div className="flex flex-col gap-2.5">
        {sorted.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
              i === 0 ? 'border-gold bg-[rgba(242,183,5,0.10)]' : 'border-line bg-panel2'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-display text-xl text-gold w-6 text-center">{i + 1}</span>
              <span className="font-bold">
                {p.nickname}
                {p.isHost && <span className="text-muted text-[11px] ml-1">(방장)</span>}
              </span>
            </div>
            <span className="font-display text-xl text-gold">{p.score}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-center mt-7">
        <button className="btn btn-primary" onClick={onExit}>
          로비로 나가기
        </button>
      </div>
    </section>
  );
}
