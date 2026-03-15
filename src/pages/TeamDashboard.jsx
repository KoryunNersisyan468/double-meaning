import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import API from "../api/axiosConfig";
import { socket } from "../socket";

export default function TeamDashboard() {
  const [questions, setQuestions] = useState([]);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState(0);
  const [isWaiting, setIsWaiting] = useState(false); // Состояние ожидания
  
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  useEffect(() => {
    API.get("/game/team").then((res) => {
      setQuestions(res.data.questions);
      setWords(res.data.allWords);
      setLoading(false);
    });

    // Слушаем сигнал перехода к следующему вопросу
    socket.on("change_question", (data) => {
      setId(data.questionIndex);
      setIsWaiting(false); // Разблокируем кнопки
    });

    // Слушаем сброс игры
    socket.on("game_reset", () => {
      localStorage.removeItem("role");
      localStorage.removeItem("token");
      navigate("/");
    });

    return () => {
      socket.off("change_question");
      socket.off("game_reset");
    };
  }, [navigate]);

  const handleChoice = async (wordId) => {
    if (isWaiting || !questions[id]) return;

    try {
      setIsWaiting(true); // Сразу блокируем интерфейс
      await API.post("/game/team", {
        questionId: questions[id].id,
        wordId: wordId,
      });
    } catch (err) {
      alert("Սխալ..."+(err.message || ""));
      setIsWaiting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-blue-500">Բեռնվում է...</div>;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-mono flex flex-col items-center p-4">
      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between p-4 bg-slate-900/50 rounded-2xl border border-slate-800 mb-8">
        <span className="font-black uppercase">{role === "teamA" ? "Թիմ 1" : "Թիմ 2"}</span>
        <span className="text-slate-500 uppercase text-xs">Հարց {id + 1} / {questions.length}</span>
      </div>

      {/* Вопрос */}
      <div className="w-full max-w-4xl bg-slate-900 p-8 rounded-[2.5rem] mb-8 border border-slate-800 text-center">
        <h2 className="text-2xl md:text-4xl font-black italic">«{questions[id]?.text}»</h2>
      </div>

      {/* Кнопки слов или Экран ожидания */}
      {isWaiting ? (
        <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-800 rounded-3xl w-full max-w-xl">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-400 font-bold uppercase text-center">Պատասխանն ուղարկված է:<br/>Սպասեք մյուս թիմին և ադմինին:</p>
        </div>
      ) : (
        <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-4">
          {words.map((item) => (
            <button
              key={item.id}
              onClick={() => handleChoice(item.id)}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 p-6 rounded-2xl transition-all active:scale-95 text-blue-400 font-black uppercase"
            >
              {item.word}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}