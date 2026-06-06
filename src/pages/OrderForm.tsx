import { useState } from "react";
import Icon from "@/components/ui/icon";
import { API_ORDERS } from "@/lib/api";

interface FormData {
  passenger_name: string;
  passenger_phone: string;
  from_city: string;
  to_city: string;
  trip_date: string;
  passengers_count: number;
  comment: string;
}

export default function OrderForm() {
  const [form, setForm] = useState<FormData>({
    passenger_name: "",
    passenger_phone: "",
    from_city: "",
    to_city: "",
    trip_date: "",
    passengers_count: 1,
    comment: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ token: string } | null>(null);

  const set = (k: keyof FormData, v: string | number) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_ORDERS}/?action=create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка отправки заказа");
      } else {
        setSuccess({ token: data.chat_token });
      }
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    const chatLink = `${window.location.origin}/chat/${success.token}`;
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
            <Icon name="CheckCircle" size={32} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-3">Заказ принят!</h1>
          <p className="text-white/50 mb-8 leading-relaxed">
            Диспетчер свяжется с вами в ближайшее время.<br />
            Сохраните ссылку — через неё можно отслеживать статус и писать диспетчеру.
          </p>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-white/40 text-xs mb-2">Ссылка на ваш заказ:</p>
            <p className="text-amber-400 text-sm break-all font-mono">{chatLink}</p>
          </div>
          <div className="flex flex-col gap-3">
            <a
              href={`/chat/${success.token}`}
              className="flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-bold py-4 rounded-2xl transition active:scale-95"
            >
              <Icon name="MessageCircle" size={20} />
              Открыть чат с диспетчером
            </a>
            <button
              onClick={() => navigator.clipboard.writeText(chatLink)}
              className="flex items-center justify-center gap-2 bg-white/8 border border-white/15 text-white font-semibold py-3.5 rounded-2xl transition hover:bg-white/15"
            >
              <Icon name="Copy" size={18} />
              Скопировать ссылку
            </button>
            <a href="/" className="text-white/30 hover:text-white/50 text-sm transition py-2">
              ← На главную
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <a href="/" className="text-white/40 hover:text-white/70 transition">
            <Icon name="ArrowLeft" size={20} />
          </a>
          <div>
            <h1 className="text-2xl font-black text-white">Заказать такси</h1>
            <p className="text-white/40 text-sm">Заполните форму — ответим за 15 минут</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Ваше имя *</label>
              <input
                type="text"
                required
                value={form.passenger_name}
                onChange={(e) => set("passenger_name", e.target.value)}
                className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition"
                placeholder="Иван Иванов"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Телефон *</label>
              <input
                type="tel"
                required
                value={form.passenger_phone}
                onChange={(e) => set("passenger_phone", e.target.value)}
                className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition"
                placeholder="+7 900 000 00 00"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Откуда *</label>
              <input
                type="text"
                required
                value={form.from_city}
                onChange={(e) => set("from_city", e.target.value)}
                className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition"
                placeholder="Москва"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Куда *</label>
              <input
                type="text"
                required
                value={form.to_city}
                onChange={(e) => set("to_city", e.target.value)}
                className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition"
                placeholder="Воронеж"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Дата поездки *</label>
              <input
                type="date"
                required
                value={form.trip_date}
                onChange={(e) => set("trip_date", e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition"
              />
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Пассажиров</label>
              <select
                value={form.passengers_count}
                onChange={(e) => set("passengers_count", Number(e.target.value))}
                className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition"
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n} className="bg-[#0d1117]">
                    {n} {n === 1 ? "пассажир" : n < 5 ? "пассажира" : "пассажиров"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-white/50 mb-1.5">Комментарий</label>
            <textarea
              value={form.comment}
              onChange={(e) => set("comment", e.target.value)}
              rows={3}
              className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition resize-none"
              placeholder="Много багажа, нужен минивэн..."
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
            className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold py-4 rounded-2xl transition active:scale-95 text-lg"
          >
            {loading ? "Отправляем..." : "Отправить заказ"}
          </button>

          <p className="text-center text-white/25 text-xs">
            Нажимая кнопку, вы соглашаетесь на обработку персональных данных
          </p>
        </form>
      </div>
    </div>
  );
}
