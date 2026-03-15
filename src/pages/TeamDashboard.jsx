import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import API from "../api/axiosConfig";

export default function TeamDashboard() {
  const [questions, setQuestions] = useState([]);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState(0);
  const [finished, setFinished] = useState(false);
  
  const navigate = useNavigate();
  const role = localStorage.getItem("role");

  // Загрузка данных при старте
  useEffect(() => {
    API.get("/game/team")
      .then((res) => {
        setQuestions(res.data.questions);
        setWords(res.data.allWords);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Ошибка загрузки данных:", err);
        setLoading(false);
      });
  }, []);

  // Обработка выбора слова
  const handleChoice = async (wordId) => {
    if (!questions.length) return;

    try {
      const questionId = questions[id].id;
      await API.post("/game/team", {
        questionId: questionId,
        wordId: wordId,
      });

      if (id < questions.length - 1) {
        setId((prevId) => prevId + 1);
      } else {
        setFinished(true);
        // Задержка перед выходом для красоты
        setTimeout(() => {
          localStorage.removeItem("role");
          localStorage.removeItem("token");
          navigate("/");
        }, 3000);
      }
    } catch (err) {
      alert("Սխալ տեղի ունեցավ. " + err.message);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono">
        <div className="text-blue-500 animate-pulse text-xl font-black uppercase tracking-widest">
          Ներբեռնվում է...
        </div>
      </div>
    );

  if (!questions.length)
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono p-6">
        <div className="text-red-500 border border-red-500/30 bg-red-500/10 p-8 rounded-3xl text-center">
          <h2 className="text-2xl font-black mb-2 uppercase">Ուշադրություն</h2>
          <p>Հարցերը վերջացան կամ հասանելի չեն:</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-950 text-white font-mono flex flex-col items-center p-4 md:p-8">
      {finished ? (
        <div className="m-auto w-full max-w-md bg-slate-900 border-2 border-emerald-500 p-10 rounded-[2.5rem] shadow-[0_0_50px_rgba(16,185,129,0.2)] text-center animate-in zoom-in duration-500">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-4xl font-black text-emerald-500 mb-4 uppercase tracking-tighter">ԱՎԱՐՏ!</h2>
          <p className="text-slate-400 font-bold">Դուք պատասխանեցիք բոլոր հարցերին:</p>
          <div className="mt-6 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 animate-progress"></div>
          </div>
        </div>
      ) : (
        <>
          {/* Header с ролью */}
          <div className="w-full max-w-4xl flex justify-between items-center mb-8 bg-slate-900/50 p-4 rounded-2xl border border-slate-800 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full animate-ping ${role === "teamA" ? "bg-yellow-500" : "bg-orange-500"}`}></div>
              <span className="font-black uppercase tracking-widest text-sm md:text-base">
                {role === "teamA" ? "Թիմ 1" : "Թիմ 2"}
              </span>
            </div>
            <div className="text-slate-500 text-xs font-bold uppercase tracking-tighter">
              Հարց {id + 1} / {questions.length}
            </div>
          </div>

          {/* Вопрос */}
          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 p-6 md:p-12 rounded-[2.5rem] mb-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-2 h-full bg-blue-600"></div>
             <p className="text-slate-500 text-[10px] md:text-xs uppercase font-black mb-4 tracking-[0.3em]">Ընթացիկ հարց</p>
             <h2 className="text-2xl md:text-5xl font-black leading-tight tracking-tight italic">
               «{questions[id].text}»
             </h2>
          </div>

          {/* Сетка слов */}
          <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-6">
            {words.map((item) => (
              <button
                key={item.id}
                onClick={() => handleChoice(item.id)}
                className="group relative overflow-hidden bg-slate-900 hover:bg-slate-800 border border-slate-800 p-4 md:p-6 rounded-2xl transition-all active:scale-95 shadow-lg"
              >
                <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/5 transition-colors"></div>
                <span className="text-sm md:text-xl font-black uppercase text-blue-400 group-hover:text-blue-300 tracking-tight">
                  {item.word}
                </span>
                <div className="absolute bottom-0 left-0 w-0 h-1 bg-blue-600 group-hover:w-full transition-all duration-300"></div>
              </button>
            ))}
          </div>

          {/* Подсказка внизу */}
          <p className="mt-10 text-slate-600 text-[10px] md:text-xs uppercase font-bold tracking-widest text-center max-w-xs">
            Ընտրեք ճիշտ տարբերակը շարունակելու համար
          </p>
        </>
      )}
    </div>
  );
}