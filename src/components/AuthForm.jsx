import { useState } from "react";
import { useNavigate } from "react-router";
import API from "../api/axiosConfig";

export default function AuthForm({ onLoginSuccess }) {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post("/auth/login", { login, password });
      const { token, user } = res.data;
      
      localStorage.setItem("token", token);
      localStorage.setItem("role", user.role);

      // Уведомляем корневой компонент об успешном входе
      if (onLoginSuccess) onLoginSuccess();

      const role = user.role.toLowerCase().trim();

      // Навигация на основе роли
      if (role === "admin") {
        navigate("/admin-dashboard");
      } else if (role === "teama" || role === "teamb") {
        navigate("/team-dashboard");
      }
    } catch (err) {
      // Стилизованный алерт или вывод ошибки
      alert(err.response?.data?.message || "Ошибка входа");
    }
  };

  return (
    <div className="p-4 min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center font-mono">
      {/* Декоративный элемент фона */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-md z-10">
        {/* Заголовок в стиле Дашборда */}
        <div className="text-center mb-10">
          <h2 className="text-5xl font-black tracking-tighter uppercase mb-2 italic text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-blue-600">
            Login
          </h2>
          <p className="text-slate-500 text-xs font-bold tracking-[0.2em] uppercase">
            Մուտք գործել համակարգ
          </p>
        </div>

        {/* Форма */}
        <form 
          onSubmit={submit} 
          className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl flex flex-col gap-6"
        >
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-4">Մուտքանուն</label>
            <input
              placeholder="Login"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-4">Գաղտնաբառ</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white placeholder:text-slate-700 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"
            />
          </div>

          <button 
            type="submit" 
            className="mt-4 bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all active:scale-95 shadow-lg shadow-blue-900/20 uppercase tracking-widest"
          >
            Մուտք
          </button>
        </form>
      </div>
    </div>
  );
}