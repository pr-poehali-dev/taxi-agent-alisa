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

export default function ChatPage() {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<TaxiOrder | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [senderName, setSenderName] = useState(
    () => localStorage.getItem("passenger_name") || ""
  );
  const [namePrompt, setNamePrompt] = useState(false);
  const [pendingText, setPendingText] = useState("");
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [sending, setSending] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSent, setReviewSent] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadOrder = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_ORDERS}/?action=get&token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data.order ?? data);
      }
    } finally {
      setLoadingOrder(false);
    }
  }, [token]);

  const loadMessages = useCallback(async () => {
    if (!token) return;
    const res = await fetch(`${API_CHAT}/?action=messages&token=${token}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages ?? []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [token]);

  useEffect(() => {
    loadOrder();
    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [loadOrder, loadMessages]);

  const doSend = async (nameToUse: string, msg: string) => {
    if (!token || !msg.trim()) return;
    setSending(true);
    try {
      await fetch(`${API_CHAT}/?action=send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, text: msg.trim(), sender_name: nameToUse }),
      });
      setText("");
      loadMessages();
    } finally {
      setSending(false);
    }
  };

  const handleSend = () => {
    const msg = text.trim();
    if (!msg) return;
    if (!senderName) {
      setPendingText(msg);
      setNamePrompt(true);
      return;
    }
    doSend(senderName, msg);
  };

  const handleNameConfirm = (name: string) => {
    localStorage.setItem("passenger_name", name);
    setSenderName(name);
    setNamePrompt(false);
    doSend(name, pendingText);
    setPendingText("");
  };

  const handleReview = async () => {
    if (!token) return;
    const res = await fetch(`${API_REVIEWS}/?action=create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token,
        rating,
        text: reviewText,
        passenger_name: senderName || "Пассажир",
      }),
    });
    if (res.ok) setReviewSent(true);
  };

  if (loadingOrder) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-white/40">Загрузка...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="text-white/40 mb-3">Заказ не найден</div>
          <a href="/" className="text-amber-400 hover:underline">На главную</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* Header */}
      <div className="bg-[#0d1117]/95 border-b border-white/8 px-4 py-3 shrink-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <div className="font-bold text-white">
                {order.from_city} → {order.to_city}
              </div>
              <div className="text-white/40 text-sm">{order.trip_date} · {order.passenger_name}</div>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border shrink-0 ${STATUS_COLORS[order.status]}`}>
              {STATUS_LABELS[order.status]}
            </span>
          </div>
          {order.driver && (
            <div className="text-white/40 text-xs">
              Водитель: {order.driver.full_name}
              {order.driver.phone && (
                <a href={`tel:${order.driver.phone}`} className="text-amber-400 ml-2">
                  {order.driver.phone}
                </a>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {messages.length === 0 && (
            <div className="text-center text-white/25 py-10 text-sm">
              Напишите сообщение диспетчеру
            </div>
          )}
          {messages.map((m) => {
            const isMe = m.sender_role === "passenger";
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                  isMe
                    ? "bg-amber-400 text-black"
                    : m.sender_role === "driver"
                    ? "bg-purple-500/20 border border-purple-500/30 text-white"
                    : "bg-white/8 border border-white/10 text-white"
                }`}>
                  {!isMe && (
                    <div className="text-xs opacity-60 mb-1 font-semibold">
                      {m.sender_role === "driver" ? "Водитель" : "Диспетчер"}
                      {m.sender_name ? ` (${m.sender_name})` : ""}
                    </div>
                  )}
                  <div className="text-sm leading-relaxed">{m.text}</div>
                  <div className={`text-xs mt-1 ${isMe ? "text-black/50" : "text-white/30"}`}>
                    {new Date(m.created_at).toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Review block */}
      {order.status === "done" && !reviewDone && !reviewSent && (
        <div className="px-4 pb-3 max-w-2xl mx-auto w-full">
          <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4">
            <div className="font-semibold text-white mb-3">Поездка завершена — оставьте отзыв</div>
            <div className="flex gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} onClick={() => setRating(s)} className="text-2xl">
                  {s <= rating ? "⭐" : "☆"}
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={2}
              className="w-full bg-white/8 border border-white/15 rounded-xl px-3 py-2 text-white text-sm focus:outline-none mb-3 resize-none"
              placeholder="Ваш отзыв..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleReview}
                className="flex-1 bg-amber-400 hover:bg-amber-300 text-black font-bold py-2.5 rounded-xl text-sm transition"
              >
                Отправить отзыв
              </button>
              <button
                onClick={() => setReviewDone(true)}
                className="text-white/30 hover:text-white/50 px-3 text-sm transition"
              >
                Пропустить
              </button>
            </div>
          </div>
        </div>
      )}
      {reviewSent && (
        <div className="px-4 pb-3 max-w-2xl mx-auto w-full">
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-green-300 text-sm text-center">
            Спасибо за отзыв!
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/8 px-4 py-3 bg-[#0d1117] shrink-0">
        <div className="max-w-2xl mx-auto flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            className="flex-1 bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition"
            placeholder="Написать диспетчеру..."
          />
          <button
            onClick={handleSend}
            disabled={sending || !text.trim()}
            className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold px-4 py-3 rounded-xl transition active:scale-95"
          >
            <Icon name="Send" size={20} />
          </button>
        </div>
      </div>

      {/* Name prompt modal */}
      {namePrompt && (
        <NamePromptModal onConfirm={handleNameConfirm} onClose={() => setNamePrompt(false)} />
      )}
    </div>
  );
}

function NamePromptModal({
  onConfirm,
  onClose,
}: {
  onConfirm: (name: string) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
      <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 w-full max-w-sm">
        <h3 className="font-bold text-white mb-2">Как вас зовут?</h3>
        <p className="text-white/40 text-sm mb-4">Чтобы диспетчер знал, кто пишет</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && name.trim() && onConfirm(name.trim())}
          autoFocus
          className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 mb-4"
          placeholder="Ваше имя"
        />
        <div className="flex gap-2">
          <button
            onClick={() => name.trim() && onConfirm(name.trim())}
            className="flex-1 bg-amber-400 hover:bg-amber-300 text-black font-bold py-3 rounded-xl transition"
          >
            Отправить
          </button>
          <button onClick={onClose} className="px-4 text-white/40 hover:text-white transition">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
