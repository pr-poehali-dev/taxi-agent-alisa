import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  API_ORDERS,
  API_CHAT,
  API_REVIEWS,
  TaxiOrder,
  ChatMessage,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/lib/api";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: TaxiOrder["status"] }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── star rating ──────────────────────────────────────────────────────────────

function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="transition"
        >
          <Icon
            name="Star"
            size={28}
            className={
              n <= (hover || value)
                ? "text-amber-400 fill-amber-400"
                : "text-white/20"
            }
          />
        </button>
      ))}
    </div>
  );
}

// ─── review form ──────────────────────────────────────────────────────────────

function ReviewForm({
  token,
  passengerName,
  onDone,
}: {
  token: string;
  passengerName: string;
  onDone: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  async function submit() {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_REVIEWS}?action=create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          rating,
          text,
          passenger_name: passengerName,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Ошибка"); return; }
      setDone(true);
      setTimeout(onDone, 2000);
    } catch {
      setErr("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-5 flex items-center gap-3">
        <Icon name="CheckCircle" size={24} className="text-green-400 shrink-0" />
        <p className="text-green-300 font-semibold">Спасибо за отзыв!</p>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Icon name="Star" size={18} className="text-amber-400" />
        <p className="font-bold text-white">Оставьте отзыв о поездке</p>
      </div>

      <StarRating value={rating} onChange={setRating} />

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Ваш комментарий…"
        rows={3}
        className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-amber-400 transition resize-none text-sm"
      />

      {err && (
        <p className="text-red-300 text-sm">{err}</p>
      )}

      <button
        onClick={submit}
        disabled={loading}
        className="bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold rounded-xl py-3 flex items-center justify-center gap-2 transition"
      >
        {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Send" size={16} />}
        Отправить отзыв
      </button>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const { token } = useParams<{ token: string }>();

  const [order, setOrder] = useState<TaxiOrder | null>(null);
  const [orderError, setOrderError] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [senderName, setSenderName] = useState(() => localStorage.getItem("chat_passenger_name") || "");
  const [namePrompt, setNamePrompt] = useState(false);
  const [pendingText, setPendingText] = useState("");
  const [sending, setSending] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // load order
  useEffect(() => {
    if (!token) return;
    fetch(`${API_ORDERS}?action=get&token=${token}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.order) setOrder(d.order);
        else setOrderError(d.error || "Заказ не найден");
      })
      .catch(() => setOrderError("Ошибка сети"));
  }, [token]);

  // load & poll messages
  const loadMessages = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_CHAT}?action=messages&token=${token}`);
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch { /* ignore */ }
  }, [token]);

  useEffect(() => {
    loadMessages();
    const id = setInterval(loadMessages, 5000);
    return () => clearInterval(id);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function doSend(msgText: string, name: string) {
    if (!token || !msgText.trim()) return;
    setSending(true);
    try {
      await fetch(`${API_CHAT}?action=send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, text: msgText.trim(), sender_name: name }),
      });
      setText("");
      await loadMessages();
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  }

  function handleSend() {
    if (!text.trim()) return;
    if (!senderName.trim()) {
      setPendingText(text);
      setNamePrompt(true);
      return;
    }
    doSend(text, senderName);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }

  function confirmName(name: string) {
    const trimmed = name.trim() || "Пассажир";
    setSenderName(trimmed);
    localStorage.setItem("chat_passenger_name", trimmed);
    setNamePrompt(false);
    doSend(pendingText, trimmed);
    setPendingText("");
  }

  // bubble style
  function bubbleCls(role: string) {
    if (role === "passenger") return "self-end bg-amber-500/25 text-amber-50 rounded-br-sm";
    if (role === "dispatcher") return "self-start bg-white/10 text-white/90 rounded-bl-sm";
    return "self-start bg-purple-500/20 text-purple-100 rounded-bl-sm";
  }

  const showReviewForm =
    order?.status === "done" && !reviewDone;

  // ── error state ──
  if (orderError) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4">
        <div className="text-center flex flex-col items-center gap-4">
          <Icon name="AlertCircle" size={40} className="text-red-400" />
          <p className="text-white font-bold text-lg">{orderError}</p>
          <a href="/order" className="text-amber-400 underline text-sm">Оформить новый заказ</a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#0d1117] flex flex-col">
      {/* header */}
      <header className="shrink-0 bg-[#0d1117]/95 backdrop-blur border-b border-white/8 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
            <Icon name="Car" size={16} className="text-black" />
          </div>
          <span className="font-black text-white">
            Комфорт<span className="text-amber-400">Такси</span>
          </span>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-4 flex flex-col gap-4">
          {/* order info card */}
          {order ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shrink-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 font-bold text-white">
                  <Icon name="MapPin" size={15} className="text-amber-400 shrink-0" />
                  {order.from_city}
                  <Icon name="ArrowRight" size={14} className="text-white/30" />
                  {order.to_city}
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-white/50">
                <span className="flex items-center gap-1">
                  <Icon name="Calendar" size={11} />
                  {fmtDate(order.trip_date)}
                </span>
                <span className="flex items-center gap-1">
                  <Icon name="Users" size={11} />
                  {order.passengers_count} пас.
                </span>
                {order.price && (
                  <span className="flex items-center gap-1 text-amber-400/80">
                    <Icon name="Banknote" size={11} />
                    {order.price.toLocaleString("ru-RU")} ₽
                  </span>
                )}
                {order.driver?.full_name && (
                  <span className="flex items-center gap-1 text-purple-300/80">
                    <Icon name="User" size={11} />
                    {order.driver.full_name}
                    {order.driver.phone && ` · ${order.driver.phone}`}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <Icon name="Loader2" size={18} className="animate-spin text-amber-400" />
              <span className="text-white/50 text-sm">Загружаем заказ…</span>
            </div>
          )}

          {/* review form */}
          {showReviewForm && order && (
            <ReviewForm
              token={token!}
              passengerName={senderName || order.passenger_name}
              onDone={() => setReviewDone(true)}
            />
          )}

          {/* messages */}
          <div className="flex flex-col gap-2 pb-2">
            {messages.length === 0 && (
              <p className="text-center text-white/25 text-sm py-8">
                Здесь будет переписка с диспетчером
              </p>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[78%] rounded-2xl px-3 py-2 flex flex-col gap-0.5 ${bubbleCls(m.sender_role)}`}
              >
                <span className="text-[10px] opacity-60 font-semibold">{m.sender_name}</span>
                <span className="text-sm">{m.text}</span>
                <span className="text-[10px] opacity-40 self-end">
                  {m.created_at ? new Date(m.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }) : ""}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {/* input bar */}
      <div className="shrink-0 border-t border-white/8 px-4 py-3 bg-[#0d1117]">
        <div className="max-w-lg mx-auto flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Написать диспетчеру…"
            className="flex-1 bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-amber-400 transition text-sm"
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black rounded-xl px-4 flex items-center justify-center transition"
          >
            {sending
              ? <Icon name="Loader2" size={18} className="animate-spin" />
              : <Icon name="Send" size={18} />
            }
          </button>
        </div>
      </div>

      {/* name prompt overlay */}
      {namePrompt && (
        <NamePrompt
          onConfirm={confirmName}
          onCancel={() => { setNamePrompt(false); setPendingText(""); }}
        />
      )}
    </div>
  );
}

// ─── name prompt modal ────────────────────────────────────────────────────────

function NamePrompt({
  onConfirm,
  onCancel,
}: {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm bg-[#161b22] border border-white/15 rounded-2xl p-6 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="font-bold text-white">Как вас зовут?</p>
        <p className="text-white/50 text-sm">Укажите имя, чтобы диспетчер знал, от кого сообщение</p>
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onConfirm(name); }}
          placeholder="Иван"
          className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-amber-400 transition"
        />
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-white/8 border border-white/10 text-white/60 font-semibold rounded-xl py-3 hover:bg-white/12 transition text-sm">
            Отмена
          </button>
          <button
            onClick={() => onConfirm(name)}
            className="flex-1 bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl py-3 transition text-sm"
          >
            Подтвердить
          </button>
        </div>
      </div>
    </div>
  );
}
