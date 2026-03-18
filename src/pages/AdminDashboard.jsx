import API from "../api/axiosConfig";
import { useState, useEffect, useMemo } from "react";
import { socket } from "../socket";

export default function AdminDashboard() {
  const [logs, setLogs] = useState([]);
  const [revealedLogs, setRevealedLogs] = useState([]);
  // Добавь состояние для индекса вопроса у админа
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
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
  console.log(groupedByQuestion);
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
    return pairs;
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
        alert("Խաղը հաջողությամբ նորից սկսվեց։");
      } catch (err) {
        alert("Ошибка при сбросе игры: " + err.message);
      }
    }
  };

  return (
    <div className="p-2 md:p-4 min-h-screen bg-slate-950 text-white flex flex-col items-center font-mono">
      <button
        onClick={handleReveal}
        disabled={!hasUnrevealedPairs}
        className={`fixed bottom-4 right-4 md:top-5 md:bottom-auto md:right-5 px-4 py-3 md:px-8 md:py-4 rounded-2xl font-black text-sm md:text-xl transition-all z-50 shadow-2xl ${
          hasUnrevealedPairs
            ? "bg-blue-500 hover:bg-blue-400 active:scale-95"
            : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-50"
        }`}
      >
        ՏԵՍՆԵԼ ՊԱՏԱՍԽԱՆՆԵՐԸ
      </button>

      <button
        onClick={resetGame}
        className="fixed top-4 left-4 md:top-5 md:bottom-auto md:left-5 px-4 py-3 md:px-8 md:py-4 rounded-2xl font-black text-sm md:text-xl transition-all z-50 shadow-2xl bg-blue-500 hover:bg-blue-400 active:scale-95"
      >
        ՆՈՐԻՑ ՍԿՍԵԼ ԽԱՂԸ
      </button>

      <div className="w-full max-w-6xl flex justify-around p-3 md:p-4 bg-slate-900/80 rounded-2xl md:rounded-[3rem] border border-slate-800 mb-3 md:mb-5 backdrop-blur-sm">
        <div className="text-center">
          <p className="text-yellow-500 text-[10px] md:text-sm font-bold uppercase mb-1">
            Թիմ 1
          </p>
          <div className="text-3xl md:text-5xl font-black">{scores.teamA}</div>
        </div>
        <div className="text-center">
          <p className="text-orange-500 text-[10px] md:text-sm font-bold uppercase mb-1">
            Թիմ 2
          </p>
          <div className="text-3xl md:text-5xl font-black">{scores.teamB}</div>
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
                      ?
                        bothCorrect
                        ? pair.a.selected_word.split(" ")[0]
                        : "Բառերը համանուն չեն"
                      :
                        "Սպասում ենք..."}
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
