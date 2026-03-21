export default function Winner({winner, scores}) {
     <div className="w-full max-w-6xl animate-in zoom-in duration-700 mb-6">
          <div className="relative overflow-hidden bg-linear-to-r from-blue-600 via-purple-600 to-blue-600 p-0.5 rounded-[2.5rem] shadow-[0_0_50px_rgba(59,130,246,0.5)]">
            <div className="bg-slate-900 rounded-[2.4rem] p-6 md:p-10 flex flex-col items-center text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-blue-500/20 blur-[100px] animate-pulse"></div>
              <div className="relative z-10">
                <span className="text-blue-400 text-xs md:text-sm font-black uppercase tracking-[0.5em] mb-4 block">
                  Խաղն ավարտված է
                </span>
                <h1 className="text-4xl md:text-7xl font-black italic tracking-tighter text-white mb-4 drop-shadow-2xl">
                  {winner === "Ոչ-ոքի"
                    ? "🤝 ՈՉ-ՈՔԻ"
                    : `🏆 ՀԱՂԹՈՂ՝ ${winner.toUpperCase()}`}
                </h1>
                <div className="flex gap-4 justify-center mt-6">
                  <div className="px-6 py-2 bg-white/5 rounded-full border border-white/10 text-slate-400 text-sm">
                    Վերջնական արդյունքներ:{" "}
                    <span className="text-white font-bold">
                      {scores.teamA} - {scores.teamB}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
}