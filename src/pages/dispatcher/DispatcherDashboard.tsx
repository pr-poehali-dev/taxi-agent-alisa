import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import {
  API_AUTH,
  API_ORDERS,
  API_CHAT,
  authHeaders,
  TaxiUser,
  TaxiOrder,
  ChatMessage,
  STATUS_LABELS,
  STATUS_COLORS,
} from "@/lib/api";

type Tab = "new" | "all" | "drivers" | "chat";
type StatusFilter = "all" | TaxiOrder["status"];

export default function DispatcherDashboard({ user }: { user: TaxiUser }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("new");
  const [newOrders, setNewOrders] = useState<TaxiOrder[]>([]);
  const [allOrders, setAllOrders] = useState<TaxiOrder[]>([]);
  const [drivers, setDrivers] = useState<TaxiUser[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [assignOrder, setAssignOrder] = useState<TaxiOrder | null>(null);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [assignPrice, setAssignPrice] = useState("");
  const [addDriverOpen, setAddDriverOpen] = useState(false);
  const [chatOrder, setChatOrder] = useState<TaxiOrder | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const logout = () => {
    localStorage.removeItem("taxi_token");
    localStorage.removeItem("taxi_user");
    navigate("/login");
  };

  const fetchNewOrders = useCallback(async () => {
    const res = await fetch(`${API_ORDERS}/?action=list&status=new`, { headers: authHeaders() });
    if (res.ok) { const d = await res.json(); setNewOrders(d.orders ?? []); }
  }, []);

  const fetchAllOrders = useCallback(async () => {
    const url = statusFilter === "all"
      ? `${API_ORDERS}/?action=list`
      : `${API_ORDERS}/?action=list&status=${statusFilter}`;
    const res = await fetch(url, { headers: authHeaders() });
    if (res.ok) { const d = await res.json(); setAllOrders(d.orders ?? []); }
  }, [statusFilter]);

  const fetchDrivers = useCallback(async () => {
    const res = await fetch(`${API_AUTH}/?action=list_drivers`, { headers: authHeaders() });
    if (res.ok) { const d = await res.json(); setDrivers(d.drivers ?? []); }
  }, []);

  const fetchChatMessages = useCallback(async () => {
    if (!chatOrder) return;
    const res = await fetch(`${API_CHAT}/?action=messages&token=${chatOrder.chat_token}`);
    if (res.ok) {
      const d = await res.json();
      setMessages(d.messages ?? []);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }
  }, [chatOrder]);

  useEffect(() => {
    fetchNewOrders();
    const i = setInterval(fetchNewOrders, 30000);
    return () => clearInterval(i);
  }, [fetchNewOrders]);

  useEffect(() => {
    if (tab === "all") fetchAllOrders();
    if (tab === "drivers") fetchDrivers();
  }, [tab, fetchAllOrders, fetchDrivers]);

  useEffect(() => {
    if (tab === "all") fetchAllOrders();
  }, [statusFilter, fetchAllOrders, tab]);

  useEffect(() => {
    if (!chatOrder) return;
    fetchChatMessages();
    const i = setInterval(fetchChatMessages, 5000);
    return () => clearInterval(i);
  }, [chatOrder, fetchChatMessages]);

  const doAssign = async () => {
    if (!assignOrder || !selectedDriver) return;
    await fetch(`${API_ORDERS}/?action=assign`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({
        order_id: assignOrder.id,
        driver_id: Number(selectedDriver),
        price: assignPrice ? Number(assignPrice) : undefined,
      }),
    });
    setAssignOrder(null);
    setSelectedDriver("");
    setAssignPrice("");
    fetchNewOrders();
    if (tab === "all") fetchAllOrders();
  };

  const doStatus = async (orderId: number, status: TaxiOrder["status"]) => {
    await fetch(`${API_ORDERS}/?action=status`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ order_id: orderId, status }),
    });
    fetchAllOrders();
  };

  const sendChat = async () => {
    if (!chatOrder || !chatText.trim()) return;
    await fetch(`${API_CHAT}/?action=send`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ token: chatOrder.chat_token, text: chatText.trim() }),
    });
    setChatText("");
    fetchChatMessages();
  };

  const tabs: { id: Tab; label: string; icon: string; count?: number }[] = [
    { id: "new", label: "Новые", icon: "Bell", count: newOrders.length },
    { id: "all", label: "Все заказы", icon: "List" },
    { id: "drivers", label: "Водители", icon: "Users" },
    { id: "chat", label: "Чат", icon: "MessageCircle" },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* Header */}
      <div className="border-b border-white/8 px-4 h-14 flex items-center justify-between bg-[#0d1117]/95 backdrop-blur sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Icon name="Car" size={15} className="text-black" />
          </div>
          <span className="font-black">Диспетчер</span>
          <span className="text-white/40 text-sm hidden sm:inline">· {user.full_name}</span>
        </div>
        <button onClick={logout} className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition px-3 py-1.5 rounded-lg hover:bg-white/8">
          <Icon name="LogOut" size={15} />Выйти
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-white/8 px-4 flex gap-1 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
              tab === t.id ? "border-amber-400 text-amber-400" : "border-transparent text-white/40 hover:text-white"
            }`}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* ── Новые заказы ── */}
        {tab === "new" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black">Новые заказы</h2>
              <button onClick={fetchNewOrders} className="text-white/40 hover:text-white transition">
                <Icon name="RefreshCw" size={16} />
              </button>
            </div>
            {newOrders.length === 0 ? (
              <div className="text-center py-16 text-white/25">Новых заказов нет</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {newOrders.map((o) => (
                  <OrderCard key={o.id} order={o} onAssign={() => { setAssignOrder(o); fetchDrivers(); }} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Все заказы ── */}
        {tab === "all" && (
          <div>
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
              {(["all", "new", "assigned", "in_progress", "done", "cancelled"] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition ${
                    statusFilter === s ? "bg-amber-400 text-black" : "bg-white/8 text-white/50 hover:text-white"
                  }`}
                >
                  {s === "all" ? "Все" : STATUS_LABELS[s]}
                </button>
              ))}
            </div>
            {allOrders.length === 0 ? (
              <div className="text-center py-16 text-white/25">Заказов нет</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allOrders.map((o) => (
                  <OrderCard
                    key={o.id}
                    order={o}
                    onAssign={() => { setAssignOrder(o); fetchDrivers(); }}
                    onStatusChange={(s) => doStatus(o.id, s)}
                    showChat={() => { setChatOrder(o); setTab("chat"); }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Водители ── */}
        {tab === "drivers" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black">Водители ({drivers.length})</h2>
              <button
                onClick={() => setAddDriverOpen(true)}
                className="flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-black font-bold px-4 py-2 rounded-xl text-sm transition"
              >
                <Icon name="Plus" size={15} />Добавить
              </button>
            </div>
            {drivers.length === 0 ? (
              <div className="text-center py-16 text-white/25">Водителей пока нет</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {drivers.map((d) => (
                  <div key={d.id} className="bg-white/5 border border-white/10 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                        <Icon name="User" size={18} className="text-white/60" />
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{d.full_name}</div>
                        <div className="text-white/40 text-xs">@{d.login}</div>
                      </div>
                    </div>
                    {d.phone && (
                      <a href={`tel:${d.phone}`} className="text-amber-400 text-sm hover:underline">
                        {d.phone}
                      </a>
                    )}
                    <div className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full ${d.is_active ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                      {d.is_active ? "Активен" : "Неактивен"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Чат ── */}
        {tab === "chat" && (
          <div className="flex gap-4 h-[calc(100vh-160px)]">
            <div className="w-64 shrink-0 flex flex-col gap-2 overflow-y-auto pr-1">
              <p className="text-white/30 text-xs mb-1">Выберите заказ:</p>
              {allOrders.length === 0 && (
                <button onClick={fetchAllOrders} className="text-amber-400 text-sm hover:underline text-left">
                  Загрузить заказы
                </button>
              )}
              {allOrders.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setChatOrder(o)}
                  className={`text-left p-3 rounded-xl transition text-sm ${
                    chatOrder?.id === o.id ? "bg-amber-400/15 border border-amber-400/30" : "bg-white/5 hover:bg-white/8"
                  }`}
                >
                  <div className="font-semibold truncate">{o.from_city} → {o.to_city}</div>
                  <div className="text-white/40 text-xs truncate">{o.passenger_name}</div>
                </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col min-w-0 bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
              {!chatOrder ? (
                <div className="flex-1 flex items-center justify-center text-white/25 text-sm">
                  Выберите заказ слева
                </div>
              ) : (
                <>
                  <div className="border-b border-white/8 px-4 py-3">
                    <div className="font-semibold">{chatOrder.from_city} → {chatOrder.to_city}</div>
                    <div className="text-white/40 text-xs">{chatOrder.passenger_name} · {chatOrder.passenger_phone}</div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.map((m) => {
                      const isDispatcher = m.sender_role === "dispatcher";
                      return (
                        <div key={m.id} className={`flex ${isDispatcher ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                            isDispatcher ? "bg-amber-400 text-black" : "bg-white/10 text-white"
                          }`}>
                            {!isDispatcher && <div className="text-xs opacity-60 mb-0.5">{m.sender_role === "passenger" ? "Пассажир" : "Водитель"}</div>}
                            {m.text}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatBottomRef} />
                  </div>
                  <div className="border-t border-white/8 p-3 flex gap-2">
                    <input
                      value={chatText}
                      onChange={(e) => setChatText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendChat()}
                      className="flex-1 bg-white/8 border border-white/15 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400"
                      placeholder="Написать пассажиру..."
                    />
                    <button
                      onClick={sendChat}
                      className="bg-amber-400 hover:bg-amber-300 text-black px-3 py-2.5 rounded-xl transition active:scale-95"
                    >
                      <Icon name="Send" size={16} />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Assign modal */}
      {assignOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
          <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-1">Назначить водителя</h3>
            <p className="text-white/40 text-sm mb-4">
              {assignOrder.from_city} → {assignOrder.to_city} · {assignOrder.passenger_name}
            </p>
            <div className="space-y-3 mb-5">
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Водитель</label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="" className="bg-[#1a1f2e]">Выберите водителя...</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id} className="bg-[#1a1f2e]">
                      {d.full_name} {d.phone ? `· ${d.phone}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Стоимость (₽)</label>
                <input
                  type="number"
                  value={assignPrice}
                  onChange={(e) => setAssignPrice(e.target.value)}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400"
                  placeholder="Оставьте пустым для расчёта"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={doAssign}
                disabled={!selectedDriver}
                className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-bold py-3 rounded-xl transition"
              >
                Назначить
              </button>
              <button onClick={() => setAssignOrder(null)} className="px-4 text-white/40 hover:text-white transition">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add driver modal */}
      {addDriverOpen && (
        <AddDriverModal
          onClose={() => setAddDriverOpen(false)}
          onSuccess={() => { setAddDriverOpen(false); fetchDrivers(); }}
        />
      )}
    </div>
  );
}

function OrderCard({
  order,
  onAssign,
  onStatusChange,
  showChat,
}: {
  order: TaxiOrder;
  onAssign?: () => void;
  onStatusChange?: (s: TaxiOrder["status"]) => void;
  showChat?: () => void;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-bold">{order.from_city} → {order.to_city}</div>
          <div className="text-white/40 text-sm">{order.trip_date} · {order.passengers_count} пасс.</div>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border shrink-0 ml-2 ${STATUS_COLORS[order.status]}`}>
          {STATUS_LABELS[order.status]}
        </span>
      </div>
      <div className="text-sm text-white/70 mb-1">{order.passenger_name}</div>
      <a href={`tel:${order.passenger_phone}`} className="text-amber-400 text-sm hover:underline block mb-2">
        {order.passenger_phone}
      </a>
      {order.comment && (
        <div className="text-white/40 text-xs mb-3 italic">{order.comment}</div>
      )}
      {order.driver && (
        <div className="text-white/40 text-xs mb-3">Водитель: {order.driver.full_name}</div>
      )}
      {order.price && (
        <div className="text-amber-400 font-bold text-sm mb-3">{order.price.toLocaleString("ru-RU")} ₽</div>
      )}
      <div className="flex gap-2 flex-wrap">
        {onAssign && (
          <button onClick={onAssign} className="flex items-center gap-1 bg-amber-400 hover:bg-amber-300 text-black font-bold px-3 py-1.5 rounded-lg text-xs transition">
            <Icon name="UserPlus" size={12} />Назначить
          </button>
        )}
        {onStatusChange && order.status !== "done" && order.status !== "cancelled" && (
          <select
            onChange={(e) => onStatusChange(e.target.value as TaxiOrder["status"])}
            defaultValue=""
            className="bg-white/8 border border-white/15 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none"
          >
            <option value="" disabled className="bg-[#0d1117]">Статус...</option>
            <option value="assigned" className="bg-[#0d1117]">Назначен</option>
            <option value="in_progress" className="bg-[#0d1117]">В пути</option>
            <option value="done" className="bg-[#0d1117]">Завершён</option>
            <option value="cancelled" className="bg-[#0d1117]">Отменён</option>
          </select>
        )}
        {showChat && (
          <button onClick={showChat} className="flex items-center gap-1 bg-white/8 hover:bg-white/15 text-white px-3 py-1.5 rounded-lg text-xs transition">
            <Icon name="MessageCircle" size={12} />Чат
          </button>
        )}
      </div>
    </div>
  );
}

function AddDriverModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ login: "", password: "", full_name: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_AUTH}/?action=create_driver`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const d = await res.json();
      if (!res.ok) setError(d.error || "Ошибка");
      else onSuccess();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center px-4">
      <div className="bg-[#1a1f2e] border border-white/10 rounded-2xl p-6 w-full max-w-md">
        <h3 className="font-bold text-lg mb-4">Добавить водителя</h3>
        <form onSubmit={submit} className="space-y-3">
          <input required placeholder="ФИО" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400" />
          <input placeholder="Телефон" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400" />
          <input required placeholder="Логин" value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })}
            className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400" />
          <input required type="password" placeholder="Пароль" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400" />
          {error && <div className="text-red-300 text-sm">{error}</div>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={loading}
              className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold py-3 rounded-xl transition">
              {loading ? "Создаём..." : "Создать"}
            </button>
            <button type="button" onClick={onClose} className="px-4 text-white/40 hover:text-white transition">Отмена</button>
          </div>
        </form>
      </div>
    </div>
  );
}
