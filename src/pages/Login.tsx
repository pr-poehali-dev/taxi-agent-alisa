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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_AUTH}?action=login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Неверный логин или пароль");
        return;
      }
      localStorage.setItem("taxi_token", data.token);
      localStorage.setItem("taxi_user", JSON.stringify(data.user));
      navigate("/dashboard");
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Icon name="Car" size={28} className="text-black" />
          </div>
          <h1 className="text-2xl font-black text-white">
            Комфорт<span className="text-amber-400">Такси</span>
          </h1>
          <p className="text-white/40 text-sm">Панель управления</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">Логин</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="dispatcher"
              autoComplete="username"
              required
              className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          {error && (
            <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm flex items-center gap-2">
              <Icon name="AlertCircle" size={16} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold rounded-xl py-3 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Icon name="Loader2" size={18} className="animate-spin" />
                Входим…
              </>
            ) : (
              <>
                <Icon name="LogIn" size={18} />
                Войти
              </>
            )}
          </button>
        </form>

        <p className="text-center text-white/20 text-xs mt-6">
          Нет аккаунта?{" "}
          <a href="/order" className="text-amber-400/70 hover:text-amber-400 underline transition">
            Оформить заказ
          </a>
        </p>
      </div>
    </div>
  );
}
