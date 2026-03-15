import API from "../api/axiosConfig";
import { useState, useEffect, useMemo } from "react";
import { socket } from "../socket";

export default function AdminDashboard() {
  const [logs, setLogs] = useState([]);
  const [scores, setScores] = useState({ teamA: 0, teamB: 0 });
  const [revealedLogs, setRevealedLogs] = useState([]);

  // Загрузка начальных данных при монтировании
  useEffect(() => {
    API.get("/game/admin").then((res) => {
      const initialLogs = res.data.logs || [];
      setLogs(initialLogs);
      // Все старые логи из БД помечаем как "раскрытые" (уже имеют цвет)
      setRevealedLogs(initialLogs.map((l) => l.id));

      const initialScores = { teamA: 0, teamB: 0 };
      res.data.scores?.forEach((s) => {
        initialScores[s.team_name] = parseInt(s.total_score);
      });
      setScores(initialScores);
    });

    // Слушатель новых ответов через сокет
    socket.on("new_log", (newLog) => {
      setLogs((prev) => [...prev, newLog]);
      // Если ответ правильный, обновляем счет в реальном времени
      if (newLog.is_correct) {
        setScores((prev) => ({
          ...prev,
          [newLog.team_name]: prev[newLog.team_name] + 1,
        }));
      }
    });

    return () => socket.off("new_log");
  }, []);

  // Группировка логов в пары: показываем строку только когда ответили ОБЕ команды
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

  // Проверка для активации кнопки (есть ли синие/не раскрытые пары)
  const hasUnrevealedPairs = pairedLogs.some(
    (p) => !revealedLogs.includes(p.a.id) || !revealedLogs.includes(p.b.id),
  );

  // Обработчик кнопки: раскрывает цвета для всех текущих ответов
  const handleReveal = () => {
    const allIds = logs.map((l) => l.id);
    setRevealedLogs(allIds);
  };

  // Определение стиля карточки (Синий/Зеленый/Красный)
  const getCardStyle = (log) => {
    const isRevealed = revealedLogs.includes(log.id);
    if (!isRevealed) {
      return "bg-blue-600 text-white animate-pulse shadow-blue-500/50";
    }
    return log.is_correct
      ? "bg-green-700 text-green-50"
      : "bg-red-700 text-red-50 opacity-90";
  };

  return (
    <div className="p-2 md:p-4 min-h-screen bg-slate-950 text-white flex flex-col items-center font-mono">
      
      {/* Кнопка активации: на мобилках чуть меньше отступы */}
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

      {/* Счётчики: адаптивная ширина и размер текста */}
      <div className="w-full max-w-6xl flex justify-around p-3 md:p-4 bg-slate-900/80 rounded-2xl md:rounded-[3rem] border border-slate-800 mb-5 md:mb-7 backdrop-blur-sm">
        <div className="text-center">
          <p className="text-yellow-500 text-[10px] md:text-sm font-bold uppercase mb-1">Թիմ 1</p>
          <div className="text-3xl md:text-5xl font-black">{scores.teamA}</div>
        </div>
        <div className="text-center">
          <p className="text-orange-500 text-[10px] md:text-sm font-bold uppercase mb-1">Թիմ 2</p>
          <div className="text-3xl md:text-5xl font-black">{scores.teamB}</div>
        </div>
      </div>

      {/* Список парных логов */}
      <div className="w-full max-w-7xl flex flex-col gap-4 md:gap-6 overflow-y-auto px-2 md:px-4 pb-32">
        {pairedLogs.map((pair) => {
          // Проверяем, угадали ли оба (для активации центральной линии)
          const bothRevealed = revealedLogs.includes(pair.a.id) && revealedLogs.includes(pair.b.id);
          const bothCorrect = bothRevealed && pair.a.is_correct && pair.b.is_correct;

          return (
            <div key={pair.a.id} className="flex items-center justify-between w-full h-16 md:h-20 gap-1 md:gap-0">
              
              {/* 20% — Карточка Команды А */}
              <div className={`w-[25%] md:w-[20%] h-full flex items-center justify-center rounded-xl md:rounded-2xl text-[10px] md:text-xl font-bold uppercase transition-all duration-500 text-center px-1 ${getCardStyle(pair.a)}`}>
                {pair.a.selected_word}
              </div>

              {/* 60% — Центральный коннектор (Линии + Текст) */}
              <div className="grow flex items-center px-1 md:px-2 relative h-full">
                
                {/* Левая палочка */}
                <div className={`h-0.5 md:h-1 grow transition-all duration-700 ${bothCorrect ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-slate-800'}`}></div>
                
                {/* Центральный блок с текстом */}
                <div className={`shrink-0 mx-1 md:mx-2 p-1 md:p-2 rounded-lg md:rounded-full border-2 md:border-4 flex items-center justify-center transition-all duration-500 z-10 ${
                  bothCorrect ? "bg-green-500 border-green-300 scale-105 md:scale-110" : "bg-slate-900 border-slate-800"
                }`}>
                  <span className="text-[8px] uppercase md:text-base font-bold whitespace-nowrap">
                    {bothCorrect ? pair.a.selected_word.split(" ")[0] : "Բառերը համանուն չեն"}
                  </span>
                </div>

                {/* Правая палочка */}
                <div className={`h-0.5 md:h-1 grow transition-all duration-700 ${bothCorrect ? 'bg-green-500 shadow-[0_0_10px_#22c55e]' : 'bg-slate-800'}`}></div>
                
              </div>

              {/* 20% — Карточка Команды Б */}
              <div className={`w-[25%] md:w-[20%] h-full flex items-center justify-center rounded-xl md:rounded-2xl text-[10px] md:text-xl font-bold uppercase transition-all duration-500 text-center px-1 ${getCardStyle(pair.b)}`}>
                {pair.b.selected_word}
              </div>

            </div>
          );
        })}
      </div>

      {/* Индикатор ожидания (плашка внизу) */}
      {logs.filter((l) => l.team_name === "teamA").length !==
        logs.filter((l) => l.team_name === "teamB").length && (
        <div className="fixed bottom-20 md:bottom-6 bg-blue-500/20 border border-blue-500/40 px-4 md:px-6 py-2 rounded-full text-[10px] md:text-xs italic text-blue-200 animate-pulse backdrop-blur-md">
          Սպասում ենք թիմերի պատասխաններին...
        </div>
      )}
    </div>
  );
}