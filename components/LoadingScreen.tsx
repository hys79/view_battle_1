export default function LoadingScreen() {
  return (
    <section className="card">
      <div className="flex flex-col items-center gap-4.5 py-16 px-5 text-center">
        <div className="w-11 h-11 rounded-full border-4 border-line border-t-gold animate-spin" />
        <div>실시간 조회수를 불러오는 중…</div>
      </div>
    </section>
  );
}
