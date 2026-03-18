import API from "../api/axiosConfig";
import { useState, useEffect, useMemo } from "react";
import { socket } from "../socket";

export default function AdminDashboard() {
  const [logs, setLogs] = useState([]);
  const [revealedLogs, setRevealedLogs] = useState([]);
  // Добавь состояние для индекса вопроса у админа
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const groupedByQuestion = useMemo(() => {
    const groups = [];

    logs.forEach((log) => {
      // Ищем, есть ли уже группа с таким текстом вопроса
      let group = groups.find((g) => g.text === log.question_text);

      if (!group) {
        // Если группы нет, создаем её и сохраняем, какая команда была первой
        group = {
          text: log.question_text,
          team_name: log.team_name, // Записывает команду, создавшую этот вопрос в логах
        };
        groups.push(group);
      }

      // Раскладываем логи по командам внутри этой группы для истории
    });

    // Возвращаем перевернутый массив, чтобы последний вопрос был сверху
    return [...groups].reverse().slice(0, 2);
  }, [logs]);
  const handleReveal = async () => {
    // 1. Раскрываем карты (начисляются очки)
    const allIds = logs.map((l) => l.id);
    setRevealedLogs(allIds);

    // 2. Ждем 4 секунды, чтобы все увидели результат
    setTimeout(async () => {
      const nextIdx = currentQuestionIndex + 1;

      try {
        // 3. Отправляем сигнал командам переключиться
        await API.post("/game/next-question", { nextIndex: nextIdx });

        // 4. Сбрасываем локальное состояние для нового раунда
        setCurrentQuestionIndex(nextIdx);
      } catch (err) {
        console.error("Ошибка авто-переключения:", err);
      }
    }, 1000); // 1000 миллисекунд = 1 секунды
  };

  // 1. ЛОГИКА ОЧКОВ: Теперь это вычисляемое значение
  // Очки считаются только если ответ правильный И его ID есть в списке раскрытых
  const scores = useMemo(() => {
    const currentScores = { teamA: 0, teamB: 0 };

    logs.forEach((log) => {
      // КЛЮЧЕВОЕ УСЛОВИЕ: log.is_correct И его ID есть в списке раскрытых (revealedLogs)
      if (log.is_correct && revealedLogs.includes(log.id)) {
        currentScores[log.team_name] += log.score || 1;
      }
    });

    return currentScores;
  }, [logs, revealedLogs]);

  useEffect(() => {
    // Загрузка начальных данных
    API.get("/game/admin").then((res) => {
      const initialLogs = res.data.logs || [];
      setLogs(initialLogs);
      // Старые логи помечаем как раскрытые, чтобы сразу видеть старый счет
      setRevealedLogs(initialLogs.map((l) => l.id));
      if (res.data.questions) {
        setTotalQuestions(res.data.questions.length);
      }
    });

    // Слушатель новых ответов
    socket.on("new_log", (newLog) => {
      setLogs((prev) => [...prev, newLog]);
      // Заметь: здесь больше нет setScores, счет обновится сам при нажатии кнопки "Reveal"
    });

    // Слушатель сброса игры (чтобы очистить экран админа)
    socket.on("game_reset", () => {
      setLogs([]);
      setRevealedLogs([]);
    });

    return () => {
      socket.off("new_log");
      socket.off("game_reset");
    };
  }, []);

  const pairedLogs = useMemo(() => {
    const teamA = logs.filter((l) => l.team_name === "teamA");
    const teamB = logs.filter((l) => l.team_name === "teamB");
    const pairs = [];
    const minLength = Math.min(teamA.length, teamB.length);
    for (let i = 0; i < minLength; i++) {
      pairs.push({ a: teamA[i], b: teamB[i] });
    }
    return pairs.reverse();
  }, [logs]);

  const hasUnrevealedPairs = pairedLogs.some(
    (p) => !revealedLogs.includes(p.a.id) || !revealedLogs.includes(p.b.id),
  );

  const getCardStyle = (log) => {
    const isRevealed = revealedLogs.includes(log.id);
    if (!isRevealed) {
      return "bg-blue-600 text-white animate-pulse shadow-blue-500/50";
    }
    return log.is_correct
      ? "bg-green-700 text-green-50"
      : "bg-red-700 text-red-50 opacity-90";
  };

  const resetGame = async () => {
    if (
      window.confirm(
        "Դուք իսկապես ցանկանում եք նորից սկսել խաղը? Բոլոր տվյալները կջնջվեն։",
      )
    ) {
      try {
        await API.post("/game/reset-game");
        // Сразу очищаем локальный стейт, не дожидаясь повторного GET
        setLogs([]);
        setRevealedLogs([]);
        setCurrentQuestionIndex(0);
        alert("Խաղը հաջողությամբ նորից սկսվեց։");
      } catch (err) {
        alert("Ошибка при сбросе игры: " + err.message);
      }
    }
  };
  const winner = useMemo(() => {
    // Если мы еще не дошли до конца — победителя нет
    if (totalQuestions === 0 || currentQuestionIndex < totalQuestions)
      return null;

    if (scores.teamA > scores.teamB) return "Թիմ 1";
    if (scores.teamB > scores.teamA) return "Թիմ 2";
    return "Ոչ-ոքի";
  }, [currentQuestionIndex, totalQuestions, scores,]);

  return (
    <div className="p-2 md:p-4 min-h-screen bg-slate-950 text-white flex flex-col items-center font-mono">
      {winner && (
        <div className="w-full max-w-6xl animate-in zoom-in duration-700 mb-6">
          <div className="relative overflow-hidden bg-linear-to-r from-blue-600 via-purple-600 to-blue-600 p-0.5 rounded-[2.5rem] shadow-[0_0_50px_rgba(59,130,246,0.5)]">
            <div className="bg-slate-900 rounded-[2.4rem] p-6 md:p-10 flex flex-col items-center text-center relative overflow-hidden">
              {/* Анимированные блики на фоне */}
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
      )}
      {/* ГЛАВНЫЙ КОНТЕЙНЕР УПРАВЛЕНИЯ */}
      <div className="w-full max-w-6xl mt-4 mb-10 px-2 md:px-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
          {/* ЛЕВЫЙ БЛОК (Desktop) / Кнопка сброса (Mobile) */}
          {/* На мобилках этот блок идет вторым в ряду кнопок благодаря md:order */}
          <div className="order-2 md:order-1 flex flex-row md:flex-none gap-2">
            <button
              onClick={resetGame}
              className="flex-none p-4 md:p-7 bg-slate-900/40 backdrop-blur-xl border border-white/5 rounded-2xl md:rounded-4xl hover:border-red-500/50 hover:bg-red-500/5 transition-all duration-500 shadow-xl group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity"></div>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 md:h-8 md:w-8 text-slate-500 group-hover:text-red-400 group-active:rotate-180 transition-all duration-500 relative z-10"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            {/* Эта часть видна только на мобилках внутри того же контейнера, что и сброс */}
            <button
              onClick={handleReveal}
              disabled={!hasUnrevealedPairs}
              className={`flex-1 md:hidden relative overflow-hidden px-4 py-4 rounded-2xl border transition-all duration-700 flex flex-col items-center justify-center gap-1 ${
                hasUnrevealedPairs
                  ? "bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                  : "bg-slate-900/40 border-white/5 text-slate-700 cursor-not-allowed"
              }`}
            >
              <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
                {hasUnrevealedPairs ? "Տեսնել պատասխանները" : "Սպասում"}
              </span>
            </button>
          </div>

          {/* ЦЕНТРАЛЬНЫЙ БЛОК: СЧЕТ (Scores) */}
          <div className="order-1 md:order-2 flex-1 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-4xl md:rounded-[4rem] p-4 md:p-6 shadow-[0_0_50px_rgba(0,0,0,0.3)] relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-linear-to-r from-transparent via-blue-500/40 to-transparent"></div>
            <div className="text-[10px] text-slate-500 font-bold uppercase">
              Հարց {currentQuestionIndex + 1} / {totalQuestions}
            </div>
            <div className="flex justify-around items-center">
              <div className="text-center">
                <p className="text-yellow-500 text-[9px] md:text-xs font-black uppercase tracking-widest mb-1 opacity-80">
                  Թիմ 1
                </p>
                <div className="text-3xl md:text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(234,179,8,0.3)]">
                  {scores.teamA}
                </div>
              </div>

              <div className="h-10 md:h-12 w-px bg-white/10"></div>

              <div className="text-center">
                <p className="text-orange-500 text-[9px] md:text-xs font-black uppercase tracking-widest mb-1 opacity-80">
                  Թիմ 2
                </p>
                <div className="text-3xl md:text-6xl font-black text-white drop-shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                  {scores.teamB}
                </div>
              </div>
            </div>
          </div>

          {/* ПРАВЫЙ БЛОК: Кнопка REVEAL (Только для Desktop) */}
          <div className="hidden md:block order-3">
            <button
              onClick={handleReveal}
              disabled={!hasUnrevealedPairs}
              className={`group relative h-full min-w-50 px-8 py-8 rounded-4xl border transition-all duration-700 flex flex-col items-center justify-center gap-2 ${
                hasUnrevealedPairs
                  ? "bg-blue-600/20 border-blue-500/50 hover:bg-blue-600 text-blue-400 hover:text-white shadow-[0_0_30px_rgba(59,130,246,0.2)] hover:shadow-[0_0_50px_rgba(59,130,246,0.5)]"
                  : "bg-slate-900/40 border-white/5 text-slate-700 cursor-not-allowed"
              }`}
            >
              <span className="text-lg font-black uppercase tracking-tighter">
                {hasUnrevealedPairs ? "Տեսնել" : "Սպասում"}
              </span>
              <div
                className={`h-1 w-8 rounded-full transition-colors ${hasUnrevealedPairs ? "bg-blue-400 animate-pulse" : "bg-slate-800"}`}
              ></div>
            </button>
          </div>
        </div>
      </div>
      <div className="w-full max-w-360 flex flex-col p-6 md:p-7 bg-slate-900/80 rounded-2xl md:rounded-[3rem] border border-slate-800 mb-8 backdrop-blur-sm relative shadow-2xl">
        <div className="text-blue-500 text-[10px] md:text-xs font-black uppercase tracking-[0.3em] mb-1 opacity-70">
          Ընթացիկ Հարց
        </div>
        <div className="flex items-center gap-5 justify-between w-full">
          <h2 className="text-lg md:text-xl font-black text-center italic leading-tight flex-1">
            {groupedByQuestion.find((q) => q.team_name === "teamA")?.text ||
              "Սպասում ենք հարցին..."}
          </h2>

          <h2 className="text-lg md:text-xl font-black text-center italic leading-tight flex-1">
            {groupedByQuestion.find((q) => q.team_name === "teamB")?.text ||
              "Սպասում ենք հարցին..."}
          </h2>
        </div>
      </div>

      <div className="w-full max-w-7xl flex flex-col gap-4 md:gap-6 overflow-y-auto px-2 md:px-4 pb-32">
        {pairedLogs.map((pair) => {
          const bothRevealed =
            revealedLogs.includes(pair.a.id) &&
            revealedLogs.includes(pair.b.id);
          const bothCorrect =
            bothRevealed && pair.a.is_correct && pair.b.is_correct;

          return (
            <div
              key={pair.a.id}
              className="flex items-center justify-between w-full h-16 md:h-20 gap-1 md:gap-0"
            >
              <div
                className={`w-[25%] md:w-[20%] h-full flex items-center justify-center rounded-xl md:rounded-2xl text-[10px] md:text-xl font-bold uppercase transition-all duration-500 text-center px-1 ${getCardStyle(pair.a)}`}
              >
                {pair.a.selected_word}
              </div>

              <div className="grow flex items-center px-1 md:px-2 relative h-full">
                <div
                  className={`h-0.5 md:h-1 grow transition-all duration-700 ${bothCorrect ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-slate-800"}`}
                ></div>
                <div
                  className={`shrink-0 mx-1 md:mx-2 p-1 md:p-2 rounded-lg md:rounded-full border-2 md:border-4 flex items-center justify-center transition-all duration-500 z-10 ${bothCorrect ? "bg-green-500 border-green-300 scale-105 md:scale-110" : "bg-slate-900 border-slate-800"}`}
                >
                  <span className="text-[8px] uppercase md:text-base font-bold whitespace-nowrap">
                    {revealedLogs.includes(pair.a.id) &&
                    revealedLogs.includes(pair.b.id)
                      ? bothCorrect
                        ? pair.a.selected_word.split(" ")[0]
                        : "Բառերը համանուն չեն"
                      : "Սպասում ենք..."}
                  </span>
                </div>
                <div
                  className={`h-0.5 md:h-1 grow transition-all duration-700 ${bothCorrect ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-slate-800"}`}
                ></div>
              </div>

              <div
                className={`w-[25%] md:w-[20%] h-full flex items-center justify-center rounded-xl md:rounded-2xl text-[10px] md:text-xl font-bold uppercase transition-all duration-500 text-center px-1 ${getCardStyle(pair.b)}`}
              >
                {pair.b.selected_word}
              </div>
            </div>
          );
        })}
      </div>

      {logs.filter((l) => l.team_name === "teamA").length !==
        logs.filter((l) => l.team_name === "teamB").length && (
        <div className="fixed bottom-20 md:bottom-6 bg-blue-500/20 border border-blue-500/40 px-4 md:px-6 py-2 rounded-full text-[10px] md:text-xs italic text-blue-200 animate-pulse backdrop-blur-md">
          Սպասում ենք թիմերի պատասխաններին...
        </div>
      )}
    </div>
  );
}
