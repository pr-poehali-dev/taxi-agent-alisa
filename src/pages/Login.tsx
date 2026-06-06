import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { API_AUTH } from "@/lib/api";

export default function Login() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_AUTH}/?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Неверный логин или пароль");
      } else {
        localStorage.setItem("taxi_token", data.token);
        localStorage.setItem("taxi_user", JSON.stringify(data.user));
        navigate("/dashboard");
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Icon name="Car" size={22} className="text-black" />
          </div>
          <div>
            <span className="text-2xl font-black text-white">Комфорт</span>
            <span className="text-2xl font-black text-amber-400 ml-1">Такси</span>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h1 className="text-xl font-bold text-white mb-6 text-center">Вход в систему</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Логин</label>
              <input
                type="text"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                required
                autoComplete="username"
                className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition"
                placeholder="dispatcher"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold py-3.5 rounded-xl transition active:scale-95"
            >
              {loading ? "Входим..." : "Войти"}
            </button>
          </form>
        </div>

        <p className="text-center text-white/25 text-sm mt-6">
          <a href="/" className="hover:text-white/50 transition">← Вернуться на сайт</a>
        </p>
      </div>
    </div>
  );
}
