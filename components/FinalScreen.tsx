'use client';

export default function FinalScreen({
  score,
  total,
  onRetry
}: {
  score: number;
  total: number;
  onRetry: () => void;
}) {
  return (
    <section className="card">
      <div className="text-center py-5 px-2.5">
        <div className="text-muted text-[14px]">최종 결과</div>
        <div className="font-display text-[80px] text-gold leading-none my-2.5">{score}</div>
        <div className="text-muted text-[15px] mb-6.5">/ {total} 라운드 정답</div>
        <button className="btn btn-primary" onClick={onRetry}>
          다시 하기
        </button>
      </div>
    </section>
  );
}
