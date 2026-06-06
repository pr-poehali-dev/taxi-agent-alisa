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

export default function DriverDashboard({ user }: { user: TaxiUser }) {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<TaxiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOrder, setChatOrder] = useState<TaxiOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    const res = await fetch(`${API_ORDERS}/?action=my`, { headers: authHeaders() });
    if (res.ok) { const d = await res.json(); setOrders(d.orders ?? []); }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
    const i = setInterval(fetchOrders, 30000);
    return () => clearInterval(i);
  }, [fetchOrders]);

  const updateStatus = async (orderId: number, status: TaxiOrder["status"]) => {
    await fetch(`${API_ORDERS}/?action=status`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ order_id: orderId, status }),
    });
    fetchOrders();
  };

  const logout = () => {
    localStorage.removeItem("taxi_token");
    localStorage.removeItem("taxi_user");
    navigate("/login");
  };

  const active = orders.find((o) => o.status === "assigned" || o.status === "in_progress");

  return (
    <div className="min-h-screen bg-[#0d1117] text-white pb-6">
      {/* Header */}
      <div className="border-b border-white/8 px-4 h-14 flex items-center justify-between bg-[#0d1117]/95 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Icon name="Car" size={15} className="text-black" />
          </div>
          <span className="font-black">{user.full_name}</span>
        </div>
        <button onClick={logout} className="text-white/40 hover:text-white transition p-2 rounded-lg hover:bg-white/8">
          <Icon name="LogOut" size={18} />
        </button>
      </div>

      <div className="px-4 py-5 max-w-xl mx-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-black">Мои поездки</h2>
          <button onClick={fetchOrders} className="text-white/40 hover:text-white p-2 rounded-lg hover:bg-white/8 transition">
            <Icon name="RefreshCw" size={16} />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-white/30">Загрузка...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 text-white/25">
            <Icon name="Car" size={40} className="mx-auto mb-3 opacity-30" />
            <div>Поездок пока нет</div>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="text-lg font-black">{o.from_city}</div>
                      <div className="text-white/40 text-sm flex items-center gap-1 my-0.5">
                        <Icon name="ArrowDown" size={12} />
                        {o.trip_date}
                      </div>
                      <div className="text-lg font-black text-white/80">{o.to_city}</div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[o.status]}`}>
                      {STATUS_LABELS[o.status]}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3 p-3 bg-white/5 rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <Icon name="User" size={16} className="text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm">{o.passenger_name}</div>
                      <div className="text-white/40 text-xs">{o.passengers_count} пасс.</div>
                    </div>
                    <a
                      href={`tel:${o.passenger_phone}`}
                      className="flex items-center gap-1.5 bg-green-500/20 border border-green-500/30 text-green-300 font-bold px-3 py-2 rounded-xl text-sm active:scale-95 transition"
                    >
                      <Icon name="Phone" size={14} />
                      Позвонить
                    </a>
                  </div>

                  {o.price && (
                    <div className="text-amber-400 font-black text-xl mb-3">
                      {o.price.toLocaleString("ru-RU")} ₽
                    </div>
                  )}

                  {o.comment && (
                    <div className="text-white/40 text-sm italic mb-3 border-l-2 border-white/20 pl-3">
                      {o.comment}
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {o.status === "assigned" && (
                  <button
                    onClick={() => updateStatus(o.id, "in_progress")}
                    className="w-full flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-black font-black py-4 text-base transition active:scale-95"
                  >
                    <Icon name="Play" size={20} />
                    Начать поездку
                  </button>
                )}
                {o.status === "in_progress" && (
                  <button
                    onClick={() => updateStatus(o.id, "done")}
                    className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-black py-4 text-base transition active:scale-95"
                  >
                    <Icon name="CheckCircle" size={20} />
                    Завершить поездку
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Chat with dispatcher */}
        {active && (
          <button
            onClick={() => setChatOrder(active)}
            className="fixed bottom-5 right-5 flex items-center gap-2 bg-[#229ED9] hover:bg-[#1a8fc7] text-white font-bold px-5 py-3.5 rounded-2xl shadow-lg transition active:scale-95"
          >
            <Icon name="MessageCircle" size={20} />
            Написать диспетчеру
          </button>
        )}
      </div>

      {chatOrder && (
        <ChatSheet order={chatOrder} onClose={() => setChatOrder(null)} />
      )}
    </div>
  );
}

function ChatSheet({ order, onClose }: { order: TaxiOrder; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`${API_CHAT}/?action=messages&token=${order.chat_token}`);
    if (res.ok) {
      const d = await res.json();
      setMessages(d.messages ?? []);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [order.chat_token]);

  useEffect(() => {
    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, [load]);

  const send = async () => {
    if (!text.trim()) return;
    await fetch(`${API_CHAT}/?action=send`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ token: order.chat_token, text: text.trim() }),
    });
    setText("");
    load();
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex flex-col justify-end">
      <div className="bg-[#1a1f2e] rounded-t-3xl flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
          <div>
            <div className="font-bold text-sm">Диспетчер</div>
            <div className="text-white/40 text-xs">{order.from_city} → {order.to_city}</div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white p-2 rounded-lg hover:bg-white/8 transition">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px]">
          {messages.map((m) => {
            const isDriver = m.sender_role === "driver";
            return (
              <div key={m.id} className={`flex ${isDriver ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  isDriver ? "bg-amber-400 text-black" : "bg-white/10 text-white"
                }`}>
                  {m.text}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-white/8 p-3 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            className="flex-1 bg-white/8 border border-white/15 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-amber-400"
            placeholder="Сообщение диспетчеру..."
          />
          <button
            onClick={send}
            className="bg-amber-400 hover:bg-amber-300 text-black px-3 py-3 rounded-xl transition active:scale-95"
          >
            <Icon name="Send" size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
