'use client';

import type { Player } from '@/lib/types';

export default function Scoreboard({ players, meId }: { players: Player[]; meId: string }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col gap-1.5">
      {sorted.map((p) => (
        <div
          key={p.id}
          className={`flex items-center justify-between px-3 py-2 rounded-lg border ${
            p.id === meId ? 'border-gold bg-[rgba(242,183,5,0.08)]' : 'border-line bg-panel2'
          }`}
        >
          <span className="text-sm">
            {p.nickname}
            {p.isHost && <span className="text-muted text-[11px] ml-1">(방장)</span>}
            {p.id === meId && <span className="text-gold text-[11px] ml-1">(나)</span>}
          </span>
          <span className="flex items-center gap-2">
            {p.answered && <span className="text-[11px] text-gold">✔ 선택완료</span>}
            <b className="font-display text-gold">{p.score}</b>
          </span>
        </div>
      ))}
    </div>
  );
}
