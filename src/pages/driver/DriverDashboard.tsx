import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  API_ORDERS,
  API_CHAT,
  authHeaders,
  TaxiUser,
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

// ─── chat sheet ───────────────────────────────────────────────────────────────

function ChatSheet({
  order,
  onClose,
}: {
  order: TaxiOrder;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_CHAT}?action=messages&token=${order.chat_token}`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch { /* ignore */ }
  }, [order.chat_token]);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    try {
      await fetch(`${API_CHAT}?action=send`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ token: order.chat_token, text: text.trim() }),
      });
      setText("");
      await load();
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const bubbleClass = (role: string) => {
    if (role === "driver") return "self-end bg-amber-500/20 text-amber-100 rounded-br-sm";
    if (role === "dispatcher") return "self-start bg-white/10 text-white/90 rounded-bl-sm";
    return "self-start bg-purple-500/20 text-purple-100 rounded-bl-sm";
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col" onClick={onClose}>
      <div
        className="mt-auto w-full max-w-lg mx-auto bg-[#161b22] border-t border-white/10 rounded-t-3xl flex flex-col h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <div>
            <p className="font-bold text-white">Чат по заказу</p>
            <p className="text-xs text-white/40">{order.from_city} → {order.to_city}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition">
            <Icon name="X" size={22} />
          </button>
        </div>

        {/* messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
          {messages.length === 0 && (
            <p className="text-center text-white/30 text-sm mt-10">Нет сообщений</p>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`max-w-[78%] rounded-2xl px-3 py-2 flex flex-col gap-0.5 ${bubbleClass(m.sender_role)}`}>
              <span className="text-[10px] opacity-60 font-semibold">{m.sender_name}</span>
              <span className="text-sm">{m.text}</span>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* input */}
        <div className="px-4 py-4 border-t border-white/10 flex gap-2 shrink-0 pb-safe">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Написать…"
            className="flex-1 bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-amber-400 transition text-sm"
          />
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black rounded-xl px-4 transition flex items-center font-bold"
          >
            <Icon name="Send" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function DriverDashboard({ user }: { user: TaxiUser }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<TaxiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [chatOrder, setChatOrder] = useState<TaxiOrder | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_ORDERS}?action=my`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  async function updateStatus(orderId: number, status: TaxiOrder["status"]) {
    setUpdatingId(orderId);
    try {
      await fetch(`${API_ORDERS}?action=status`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ order_id: orderId, status }),
      });
      await load();
    } catch { /* ignore */ } finally {
      setUpdatingId(null);
    }
  }

  function logout() {
    localStorage.removeItem("taxi_token");
    localStorage.removeItem("taxi_user");
    navigate("/login");
  }

  const activeOrder = orders.find((o) => o.status === "assigned" || o.status === "in_progress");

  return (
    <div className="min-h-screen bg-[#0d1117] text-white flex flex-col">
      {/* header */}
      <header className="sticky top-0 z-40 bg-[#0d1117]/95 backdrop-blur border-b border-white/8 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Icon name="Car" size={17} className="text-black" />
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-none">{user.full_name}</p>
            <p className="text-amber-400/70 text-xs mt-0.5">Водитель</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="text-white/40 hover:text-amber-400 transition p-2"
          >
            <Icon name="RefreshCw" size={18} />
          </button>
          <button
            onClick={logout}
            className="bg-white/8 border border-white/10 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-300 text-white/60 rounded-xl px-3 py-2 text-sm font-semibold flex items-center gap-1.5 transition"
          >
            <Icon name="LogOut" size={15} />
          </button>
        </div>
      </header>

      {/* content */}
      <div className="flex-1 px-4 py-5 max-w-lg mx-auto w-full flex flex-col gap-4">
        <h2 className="text-lg font-bold text-white">Мои поездки</h2>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Icon name="Loader2" size={32} className="animate-spin text-amber-400" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col items-center gap-3">
            <Icon name="Inbox" size={36} className="text-white/20" />
            <p className="text-white/40 text-sm text-center">Назначенных поездок нет.<br />Ожидайте уведомления от диспетчера.</p>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-4"
            >
              {/* route */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 text-base font-bold text-white">
                  <Icon name="MapPin" size={16} className="text-amber-400 shrink-0" />
                  {order.from_city}
                  <Icon name="ArrowRight" size={16} className="text-white/30" />
                  {order.to_city}
                </div>
                <StatusBadge status={order.status} />
              </div>

              {/* meta */}
              <div className="flex flex-col gap-1.5 text-sm text-white/70">
                <div className="flex items-center gap-2">
                  <Icon name="User" size={15} className="text-white/30 shrink-0" />
                  <span>{order.passenger_name}</span>
                  {order.passenger_phone && (
                    <a
                      href={`tel:${order.passenger_phone}`}
                      className="ml-auto flex items-center gap-1.5 text-amber-400 font-semibold"
                    >
                      <Icon name="Phone" size={14} />
                      {order.passenger_phone}
                    </a>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Calendar" size={15} className="text-white/30 shrink-0" />
                  <span>{fmtDate(order.trip_date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Icon name="Users" size={15} className="text-white/30 shrink-0" />
                  <span>{order.passengers_count} пассажир(а)</span>
                  {order.price && (
                    <span className="ml-auto text-amber-400 font-bold">
                      {order.price.toLocaleString("ru-RU")} ₽
                    </span>
                  )}
                </div>
                {order.comment && (
                  <p className="text-xs text-white/40 italic mt-1">"{order.comment}"</p>
                )}
              </div>

              {/* action buttons */}
              <div className="flex flex-col gap-2">
                {order.status === "assigned" && (
                  <button
                    onClick={() => updateStatus(order.id, "in_progress")}
                    disabled={updatingId === order.id}
                    className="w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold rounded-xl py-4 flex items-center justify-center gap-2 text-base transition"
                  >
                    {updatingId === order.id ? (
                      <Icon name="Loader2" size={20} className="animate-spin" />
                    ) : (
                      <Icon name="Play" size={20} />
                    )}
                    Начать поездку
                  </button>
                )}
                {order.status === "in_progress" && (
                  <button
                    onClick={() => updateStatus(order.id, "done")}
                    disabled={updatingId === order.id}
                    className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-white font-bold rounded-xl py-4 flex items-center justify-center gap-2 text-base transition"
                  >
                    {updatingId === order.id ? (
                      <Icon name="Loader2" size={20} className="animate-spin" />
                    ) : (
                      <Icon name="CheckCircle" size={20} />
                    )}
                    Завершить поездку
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* bottom chat button */}
      {activeOrder && (
        <div className="sticky bottom-0 px-4 pb-6 pt-2 bg-gradient-to-t from-[#0d1117] to-transparent">
          <button
            onClick={() => setChatOrder(activeOrder)}
            className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 bg-white/8 border border-white/15 hover:bg-white/12 text-white font-semibold rounded-2xl py-4 transition"
          >
            <Icon name="MessageSquare" size={18} className="text-amber-400" />
            Написать диспетчеру
          </button>
        </div>
      )}

      {chatOrder && (
        <ChatSheet order={chatOrder} onClose={() => setChatOrder(null)} />
      )}
    </div>
  );
}