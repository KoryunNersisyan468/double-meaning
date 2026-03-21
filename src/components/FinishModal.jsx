export default function FinallyModal({ role }) {
  <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-xl animate-in fade-in duration-500">
    <div className="bg-slate-900 border-2 border-white/10 p-8 md:p-12 rounded-[3rem] shadow-[0_0_50px_rgba(59,130,246,0.2)] text-center max-w-lg w-full relative overflow-hidden border-b-blue-500/50">
      {/* Декоративный эффект свечения */}
      <div
        className={`absolute -top-20 -left-20 w-40 h-40 rounded-full blur-[80px] opacity-30 ${role === "teamA" ? "bg-yellow-400" : "bg-orange-500"}`}
      ></div>

      <div className="relative z-10">
        <div className="text-6xl mb-6 animate-bounce">🏆</div>
        <h3 className="text-3xl md:text-4xl font-black uppercase mb-4 tracking-tighter italic">
          ՎԵՐՋ
        </h3>
        <p className="text-slate-400 font-bold leading-relaxed text-sm md:text-base">
          Խաղն ավարտվեց: <br />
          Շնորհակալություն մասնակցության համար:
        </p>

        {/* Полоска таймера (5 секунд) */}
        <div className="mt-8 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500"
            style={{
              animation: "progress 5s linear forwards",
            }}
          />
        </div>
      </div>
    </div>
  </div>;
}
