import { useState } from "react";
import Icon from "@/components/ui/icon";
import { API_ORDERS } from "@/lib/api";

interface FormState {
  passenger_name: string;
  passenger_phone: string;
  from_city: string;
  to_city: string;
  trip_date: string;
  passengers_count: string;
  comment: string;
}

const INIT: FormState = {
  passenger_name: "",
  passenger_phone: "",
  from_city: "",
  to_city: "",
  trip_date: "",
  passengers_count: "1",
  comment: "",
};

export default function OrderForm() {
  const [form, setForm] = useState<FormState>(INIT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ id: number; chat_token: string } | null>(null);

  function setF(k: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_ORDERS}?action=create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          passengers_count: parseInt(form.passengers_count, 10) || 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Ошибка при отправке заказа");
        return;
      }
      setResult({ id: data.id, chat_token: data.chat_token });
    } catch {
      setError("Ошибка сети. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  }

  const chatLink = result
    ? `${window.location.origin}/chat/${result.chat_token}`
    : "";

  if (result) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
            <Icon name="CheckCircle" size={36} className="text-green-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white mb-2">Заказ принят!</h2>
            <p className="text-white/50 text-sm leading-relaxed">
              Ваш заказ №{result.id} передан диспетчеру.<br />
              Сохраните ссылку — через неё можно отслеживать статус и написать диспетчеру.
            </p>
          </div>

          <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Ваша ссылка на заказ</p>
            <div className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-amber-400 text-sm break-all font-mono">
              {chatLink}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(chatLink).catch(() => {});
              }}
              className="bg-white/8 border border-white/10 hover:bg-white/12 text-white font-semibold rounded-xl py-2.5 text-sm flex items-center justify-center gap-2 transition"
            >
              <Icon name="Copy" size={15} />
              Скопировать ссылку
            </button>
            <a
              href={chatLink}
              className="bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl py-3 flex items-center justify-center gap-2 transition"
            >
              <Icon name="MessageSquare" size={16} />
              Открыть чат
            </a>
          </div>

          <button
            onClick={() => { setResult(null); setForm(INIT); }}
            className="text-white/40 hover:text-white text-sm underline transition"
          >
            Оформить ещё один заказ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Icon name="Car" size={20} className="text-black" />
          </div>
          <span className="text-xl font-black text-white">
            Комфорт<span className="text-amber-400">Такси</span>
          </span>
        </div>

        <h1 className="text-2xl font-black text-white mb-1">Оформить заказ</h1>
        <p className="text-white/40 text-sm mb-6">Заполните форму — диспетчер свяжется с вами</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
            <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Ваши данные</p>

            <Field label="Ваше имя *">
              <input
                type="text"
                value={form.passenger_name}
                onChange={setF("passenger_name")}
                placeholder="Иван Иванов"
                required
                className={inputCls}
              />
            </Field>

            <Field label="Телефон *">
              <input
                type="tel"
                value={form.passenger_phone}
                onChange={setF("passenger_phone")}
                placeholder="+79001234567"
                required
                className={inputCls}
              />
            </Field>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
            <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Маршрут</p>

            <Field label="Откуда (город) *">
              <input
                type="text"
                value={form.from_city}
                onChange={setF("from_city")}
                placeholder="Москва"
                required
                className={inputCls}
              />
            </Field>

            <Field label="Куда (город) *">
              <input
                type="text"
                value={form.to_city}
                onChange={setF("to_city")}
                placeholder="Воронеж"
                required
                className={inputCls}
              />
            </Field>

            <Field label="Дата и время поездки *">
              <input
                type="datetime-local"
                value={form.trip_date}
                onChange={setF("trip_date")}
                required
                className={inputCls}
              />
            </Field>

            <Field label="Количество пассажиров">
              <select
                value={form.passengers_count}
                onChange={setF("passengers_count")}
                className={inputCls}
              >
                {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
            <p className="text-xs text-white/40 font-semibold uppercase tracking-wider">Дополнительно</p>
            <Field label="Комментарий">
              <textarea
                value={form.comment}
                onChange={setF("comment")}
                placeholder="Детское кресло, багаж, пожелания…"
                rows={3}
                className={`${inputCls} resize-none`}
              />
            </Field>
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
            className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold rounded-xl py-4 text-base flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <><Icon name="Loader2" size={20} className="animate-spin" />Отправляем…</>
            ) : (
              <><Icon name="Send" size={18} />Отправить заказ</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  "w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-amber-400 transition";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs text-white/50 font-semibold">{label}</label>
      {children}
    </div>
  );
}
