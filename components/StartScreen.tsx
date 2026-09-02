'use client';

import { useEffect, useState } from 'react';

export default function StartScreen({
  poolSize,
  onStart,
  error
}: {
  poolSize: number | null;
  onStart: (rounds: number, demoMode: boolean) => void;
  error: string | null;
}) {
  const [roundInputStr, setRoundInputStr] = useState('5');
  const [touched, setTouched] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    function handleKeydown(e: KeyboardEvent) {
      if (/^[0-9]$/.test(e.key)) {
        setRoundInputStr((prev) => {
          const base = touched ? prev : '';
          if (!touched) setTouched(true);
          return base.length < 2 ? base + e.key : base;
        });
      } else if (e.key === 'Backspace') {
        setTouched(true);
        setRoundInputStr((prev) => prev.slice(0, -1));
      } else if (e.key === 'Enter') {
        submit();
      }
    }
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touched, roundInputStr, demoMode]);

  function submit() {
    const n = parseInt(roundInputStr || '0', 10);
    if (!n || n < 1) return;
    onStart(n, demoMode);
  }

  function adjustRounds(delta: number) {
    setTouched(true);
    setRoundInputStr((prev) => {
      const current = prev === '' ? 0 : parseInt(prev, 10);
      const next = Math.min(99, Math.max(1, current + delta));
      return String(next);
    });
  }

  return (
    <section className="card">
      <h1 className="text-[clamp(40px,8vw,72px)] leading-[0.95]">
        둘 중<br />
        <span className="text-gold">어느 곡</span>이<br />
        더 많이 재생됐을까?
      </h1>
      <p className="text-muted max-w-[960px] mt-3.5 leading-relaxed text-[14.5px]">
        좌우 두 곡의 썸네일을 눌러 직접 들어보고, 유튜브 실시간 조회수가 더 높은쪽을 골라보세요.
      </p>

      <div className="h-px bg-line my-6" />

      <div className="mb-4">
        <label className="flex items-center gap-2 text-[13.5px] text-muted">
          <input
            type="checkbox"
            checked={demoMode}
            onChange={(e) => setDemoMode(e.target.checked)}
            className="accent-gold w-4 h-4"
          />
          데모 모드로 해보기 (임의 조회수 사용 — 서버에 API 키가 없을 때도 자동 적용됩니다)
        </label>
      </div>

      <div className="mb-2">
        <label className="block text-[13px] text-muted mb-2">
          라운드 수 (키보드 및 마우스 휠로 숫자를 입력)
        </label>
        <div className="flex items-center gap-4">
          <div
  className="font-display text-[56px] text-gold min-w-[100px] text-center border-2 border-line rounded-xl py-1 bg-bg cursor-ns-resize select-none"
  onWheel={(e) => {
    e.preventDefault();
    adjustRounds(e.deltaY < 0 ? 1 : -1);
  }}
>
  {roundInputStr === '' ? '0' : parseInt(roundInputStr, 10)}
</div>
          <div className="text-[12.5px] text-muted leading-relaxed">
            숫자 키를 누르면 라운드 수가 입력됩니다.
            <br />
            <kbd className="bg-panel2 border border-line rounded px-1.5 text-[11.5px]">
              Backspace
            </kbd>{' '}
            지우기 ·{' '}
            <kbd className="bg-panel2 border border-line rounded px-1.5 text-[11.5px]">
              Enter
            </kbd>{' '}
            시작하기
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-3.5 p-3 rounded-[10px] bg-[rgba(255,79,94,0.12)] border border-[rgba(255,79,94,0.4)] text-[#ffb9c0] text-[13px]">
          {error}
        </div>
      )}

      <div className="h-px bg-line my-6" />
      <button className="btn btn-primary" onClick={submit}>
        게임 시작 (Enter)
      </button>
    </section>
  );
}
