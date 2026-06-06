import { useEffect, useRef, useState, useCallback } from "react";
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

// ─── types ───────────────────────────────────────────────────────────────────

type Tab = "new" | "all" | "drivers" | "chat";
type OrderStatus = TaxiOrder["status"];

const ALL_STATUSES: OrderStatus[] = [
  "new",
  "assigned",
  "in_progress",
  "done",
  "cancelled",
];

// ─── tiny helpers ─────────────────────────────────────────────────────────────

function fmtDate(d: string) {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── order card ───────────────────────────────────────────────────────────────

function OrderCard({
  order,
  actions,
}: {
  order: TaxiOrder;
  actions?: React.ReactNode;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <p className="font-bold text-white">{order.passenger_name}</p>
          <p className="text-white/50 text-sm">{order.passenger_phone}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="flex items-center gap-2 text-sm text-white/80">
        <Icon name="MapPin" size={14} className="text-amber-400 shrink-0" />
        <span className="font-semibold">{order.from_city}</span>
        <Icon name="ArrowRight" size={14} className="text-white/30" />
        <span className="font-semibold">{order.to_city}</span>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-white/50">
        <span className="flex items-center gap-1">
          <Icon name="Calendar" size={12} />
          {fmtDate(order.trip_date)}
        </span>
        <span className="flex items-center gap-1">
          <Icon name="Users" size={12} />
          {order.passengers_count} пас.
        </span>
        {order.price && (
          <span className="flex items-center gap-1 text-amber-400/80">
            <Icon name="Banknote" size={12} />
            {order.price.toLocaleString("ru-RU")} ₽
          </span>
        )}
        {order.driver?.full_name && (
          <span className="flex items-center gap-1 text-purple-300/80">
            <Icon name="User" size={12} />
            {order.driver.full_name}
          </span>
        )}
      </div>

      {order.comment && (
        <p className="text-xs text-white/40 italic">"{order.comment}"</p>
      )}

      {actions && <div className="flex gap-2 flex-wrap pt-1">{actions}</div>}
    </div>
  );
}

// ─── assign modal ─────────────────────────────────────────────────────────────

function AssignModal({
  order,
  drivers,
  onClose,
  onAssigned,
}: {
  order: TaxiOrder;
  drivers: TaxiUser[];
  onClose: () => void;
  onAssigned: () => void;
}) {
  const [driverId, setDriverId] = useState<number | "">("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handleAssign() {
    if (!driverId) { setErr("Выберите водителя"); return; }
    setLoading(true);
    setErr("");
    try {
      const body: Record<string, unknown> = { order_id: order.id, driver_id: driverId };
      if (price) body.price = parseFloat(price);
      const res = await fetch(`${API_ORDERS}?action=assign`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Ошибка"); return; }
      onAssigned();
      onClose();
    } catch {
      setErr("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#161b22] border border-white/15 rounded-2xl p-6 w-full max-w-md flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-lg">Назначить водителя</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition">
            <Icon name="X" size={20} />
          </button>
        </div>

        <div className="text-sm text-white/60">
          {order.from_city} → {order.to_city}, {order.passenger_name}
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">Водитель</label>
          <select
            value={driverId}
            onChange={(e) => setDriverId(e.target.value ? Number(e.target.value) : "")}
            className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-amber-400 transition"
          >
            <option value="">— Выберите водителя —</option>
            {drivers.map((d) => (
              <option key={d.id} value={d.id}>
                {d.full_name} {d.phone ? `(${d.phone})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">Стоимость (₽, необязательно)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="3500"
            min={0}
            className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-amber-400 transition"
          />
        </div>

        {err && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
            {err}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-white/8 border border-white/10 text-white/70 font-semibold rounded-xl py-3 hover:bg-white/12 transition">
            Отмена
          </button>
          <button
            onClick={handleAssign}
            disabled={loading}
            className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold rounded-xl py-3 transition flex items-center justify-center gap-2"
          >
            {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Check" size={16} />}
            Назначить
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── add driver modal ─────────────────────────────────────────────────────────

function AddDriverModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [form, setForm] = useState({ login: "", password: "", full_name: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  function setF(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));
  }

  async function handleCreate() {
    if (!form.login || !form.password || !form.full_name) {
      setErr("Логин, пароль и ФИО обязательны");
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_AUTH}?action=create_driver`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Ошибка"); return; }
      onAdded();
      onClose();
    } catch {
      setErr("Ошибка сети");
    } finally {
      setLoading(false);
    }
  }

  const fields: { key: keyof typeof form; label: string; placeholder: string; type?: string }[] = [
    { key: "full_name", label: "ФИО", placeholder: "Иван Петров" },
    { key: "phone", label: "Телефон", placeholder: "+79001234567" },
    { key: "login", label: "Логин", placeholder: "ivan_driver" },
    { key: "password", label: "Пароль", placeholder: "••••••••", type: "password" },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#161b22] border border-white/15 rounded-2xl p-6 w-full max-w-md flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-white text-lg">Добавить водителя</h3>
          <button onClick={onClose} className="text-white/40 hover:text-white transition">
            <Icon name="X" size={20} />
          </button>
        </div>

        {fields.map((f) => (
          <div key={f.key} className="flex flex-col gap-1.5">
            <label className="text-xs text-white/50 font-semibold uppercase tracking-wider">{f.label}</label>
            <input
              type={f.type || "text"}
              value={form[f.key]}
              onChange={setF(f.key)}
              placeholder={f.placeholder}
              className="bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white placeholder-white/25 focus:outline-none focus:border-amber-400 transition"
            />
          </div>
        ))}

        {err && (
          <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3 text-red-300 text-sm">
            {err}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 bg-white/8 border border-white/10 text-white/70 font-semibold rounded-xl py-3 hover:bg-white/12 transition">
            Отмена
          </button>
          <button
            onClick={handleCreate}
            disabled={loading}
            className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-bold rounded-xl py-3 transition flex items-center justify-center gap-2"
          >
            {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="UserPlus" size={16} />}
            Создать
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── inline chat panel ────────────────────────────────────────────────────────

function ChatPanel({ order }: { order: TaxiOrder }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
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
    loadMessages();
    const id = setInterval(loadMessages, 5000);
    return () => clearInterval(id);
  }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!text.trim()) return;
    setSending(true);
    try {
      await fetch(`${API_CHAT}?action=send`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ token: order.chat_token, text: text.trim() }),
      });
      setText("");
      await loadMessages();
    } catch { /* ignore */ } finally {
      setSending(false);
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  const roleColor: Record<string, string> = {
    passenger: "bg-amber-500/20 text-amber-100 self-end",
    dispatcher: "bg-white/10 text-white/90 self-start",
    driver: "bg-purple-500/20 text-purple-100 self-start",
  };

  return (
    <div className="flex flex-col h-[520px] bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
        <Icon name="MessageSquare" size={16} className="text-amber-400" />
        <span className="font-semibold text-white text-sm">
          {order.from_city} → {order.to_city} · {order.passenger_name}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2">
        {messages.length === 0 && (
          <p className="text-white/30 text-sm text-center mt-8">Нет сообщений</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm flex flex-col gap-0.5 ${roleColor[m.sender_role] || "bg-white/10 text-white"}`}>
            <span className="text-[10px] opacity-60 font-semibold">{m.sender_name}</span>
            <span>{m.text}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-white/10 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Сообщение…"
          className="flex-1 bg-white/8 border border-white/15 rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/25 focus:outline-none focus:border-amber-400 transition"
        />
        <button
          onClick={sendMessage}
          disabled={sending || !text.trim()}
          className="bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black rounded-xl px-4 transition flex items-center gap-1.5 font-bold text-sm"
        >
          <Icon name="Send" size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── tab: new orders ──────────────────────────────────────────────────────────

function TabNew({
  drivers,
  onRefreshDrivers,
}: {
  drivers: TaxiUser[];
  onRefreshDrivers: () => void;
}) {
  const [orders, setOrders] = useState<TaxiOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignTarget, setAssignTarget] = useState<TaxiOrder | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_ORDERS}?action=list&status=new`, {
        headers: authHeaders(),
      });
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

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-white/50 text-sm">
          {orders.length === 0 ? "Нет новых заказов" : `${orders.length} новых заказов`}
        </p>
        <button onClick={load} className="text-white/40 hover:text-amber-400 transition">
          <Icon name="RefreshCw" size={16} />
        </button>
      </div>

      {orders.map((o) => (
        <OrderCard
          key={o.id}
          order={o}
          actions={
            <button
              onClick={() => { onRefreshDrivers(); setAssignTarget(o); }}
              className="bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl px-4 py-2 text-sm flex items-center gap-1.5 transition"
            >
              <Icon name="UserCheck" size={14} />
              Назначить
            </button>
          }
        />
      ))}

      {assignTarget && (
        <AssignModal
          order={assignTarget}
          drivers={drivers}
          onClose={() => setAssignTarget(null)}
          onAssigned={load}
        />
      )}
    </div>
  );
}

// ─── tab: all orders ──────────────────────────────────────────────────────────

function TabAll({ drivers }: { drivers: TaxiUser[] }) {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [orders, setOrders] = useState<TaxiOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [changingStatus, setChangingStatus] = useState<number | null>(null);
  const [assignTarget, setAssignTarget] = useState<TaxiOrder | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = statusFilter === "all" ? "" : `&status=${statusFilter}`;
      const res = await fetch(`${API_ORDERS}?action=list${qs}&page=${page}&per_page=20`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setOrders(data.orders ?? []);
      setTotal(data.total ?? 0);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  async function changeStatus(orderId: number, status: OrderStatus) {
    setChangingStatus(orderId);
    try {
      await fetch(`${API_ORDERS}?action=status`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ order_id: orderId, status }),
      });
      await load();
    } catch { /* ignore */ } finally {
      setChangingStatus(null);
    }
  }

  const filterTabs: { value: OrderStatus | "all"; label: string }[] = [
    { value: "all", label: "Все" },
    { value: "new", label: "Новые" },
    { value: "assigned", label: "Назначены" },
    { value: "in_progress", label: "В пути" },
    { value: "done", label: "Завершены" },
    { value: "cancelled", label: "Отменены" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* filter strip */}
      <div className="flex gap-1.5 flex-wrap">
        {filterTabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatusFilter(t.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              statusFilter === t.value
                ? "bg-amber-400 text-black"
                : "bg-white/8 text-white/60 hover:bg-white/12 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button onClick={load} className="ml-auto text-white/40 hover:text-amber-400 transition">
          <Icon name="RefreshCw" size={16} />
        </button>
      </div>

      <p className="text-white/40 text-xs">Всего: {total}</p>

      {loading ? (
        <Spinner />
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              actions={
                <div className="flex gap-2 flex-wrap items-center w-full">
                  {o.status === "new" && (
                    <button
                      onClick={() => setAssignTarget(o)}
                      className="bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 text-purple-300 font-semibold rounded-xl px-3 py-1.5 text-xs flex items-center gap-1 transition"
                    >
                      <Icon name="UserCheck" size={12} />
                      Назначить
                    </button>
                  )}
                  <select
                    value={o.status}
                    disabled={changingStatus === o.id}
                    onChange={(e) => changeStatus(o.id, e.target.value as OrderStatus)}
                    className="ml-auto bg-white/8 border border-white/15 rounded-xl px-3 py-1.5 text-white text-xs focus:outline-none focus:border-amber-400 transition"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
              }
            />
          ))}

          {orders.length === 0 && (
            <p className="text-center text-white/30 py-10">Нет заказов</p>
          )}
        </div>
      )}

      {/* pagination */}
      {total > 20 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="bg-white/8 border border-white/10 disabled:opacity-30 text-white rounded-xl px-4 py-2 text-sm transition hover:bg-white/12"
          >
            ← Назад
          </button>
          <span className="text-white/40 text-sm">Стр. {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 20 >= total}
            className="bg-white/8 border border-white/10 disabled:opacity-30 text-white rounded-xl px-4 py-2 text-sm transition hover:bg-white/12"
          >
            Вперёд →
          </button>
        </div>
      )}

      {assignTarget && (
        <AssignModal
          order={assignTarget}
          drivers={drivers}
          onClose={() => setAssignTarget(null)}
          onAssigned={load}
        />
      )}
    </div>
  );
}

// ─── tab: drivers ─────────────────────────────────────────────────────────────

function TabDrivers({
  drivers,
  loading,
  onRefresh,
}: {
  drivers: TaxiUser[];
  loading: boolean;
  onRefresh: () => void;
}) {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-white/50 text-sm">{drivers.length} водителей</p>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="text-white/40 hover:text-amber-400 transition">
            <Icon name="RefreshCw" size={16} />
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="bg-amber-400 hover:bg-amber-300 text-black font-bold rounded-xl px-3 py-1.5 text-sm flex items-center gap-1.5 transition"
          >
            <Icon name="UserPlus" size={14} />
            Добавить
          </button>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="flex flex-col gap-2">
          {drivers.map((d) => (
            <div
              key={d.id}
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Icon name="User" size={18} className="text-purple-300" />
                </div>
                <div>
                  <p className="font-semibold text-white">{d.full_name}</p>
                  <p className="text-white/40 text-xs">{d.phone || d.login}</p>
                </div>
              </div>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                  d.is_active
                    ? "bg-green-500/15 text-green-300 border-green-500/30"
                    : "bg-red-500/15 text-red-300 border-red-500/30"
                }`}
              >
                {d.is_active ? "Активен" : "Неактивен"}
              </span>
            </div>
          ))}
          {drivers.length === 0 && (
            <p className="text-center text-white/30 py-10">Нет водителей</p>
          )}
        </div>
      )}

      {showAdd && (
        <AddDriverModal onClose={() => setShowAdd(false)} onAdded={onRefresh} />
      )}
    </div>
  );
}

// ─── tab: chat ────────────────────────────────────────────────────────────────

function TabChat() {
  const [orders, setOrders] = useState<TaxiOrder[]>([]);
  const [selected, setSelected] = useState<TaxiOrder | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API_ORDERS}?action=list&per_page=50`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      const all: TaxiOrder[] = data.orders ?? [];
      // show orders that aren't cancelled
      setOrders(all.filter((o) => o.status !== "cancelled"));
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="flex gap-4 h-[600px]">
      {/* sidebar */}
      <div className="w-64 shrink-0 flex flex-col gap-2 overflow-y-auto">
        <p className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1">Заказы</p>
        {loading && <Spinner />}
        {orders.map((o) => (
          <button
            key={o.id}
            onClick={() => setSelected(o)}
            className={`w-full text-left px-3 py-2.5 rounded-xl border transition ${
              selected?.id === o.id
                ? "bg-amber-400/15 border-amber-400/40 text-white"
                : "bg-white/5 border-white/10 text-white/70 hover:bg-white/8 hover:text-white"
            }`}
          >
            <p className="text-sm font-semibold truncate">{o.passenger_name}</p>
            <p className="text-xs text-white/40 truncate">{o.from_city} → {o.to_city}</p>
            <StatusBadge status={o.status} />
          </button>
        ))}
      </div>

      {/* panel */}
      <div className="flex-1 min-w-0">
        {selected ? (
          <ChatPanel order={selected} />
        ) : (
          <div className="h-full bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center">
            <p className="text-white/30 text-sm">Выберите заказ слева</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Icon name="Loader2" size={28} className="animate-spin text-amber-400" />
    </div>
  );
}

// ─── main component ───────────────────────────────────────────────────────────

export default function DispatcherDashboard({ user }: { user: TaxiUser }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("new");
  const [drivers, setDrivers] = useState<TaxiUser[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);

  const loadDrivers = useCallback(async () => {
    setDriversLoading(true);
    try {
      const res = await fetch(`${API_AUTH}?action=list_drivers`, {
        headers: authHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      setDrivers(data.drivers ?? []);
    } catch { /* ignore */ } finally {
      setDriversLoading(false);
    }
  }, []);

  useEffect(() => { loadDrivers(); }, [loadDrivers]);

  function logout() {
    localStorage.removeItem("taxi_token");
    localStorage.removeItem("taxi_user");
    navigate("/login");
  }

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "new", label: "Новые заказы", icon: "Inbox" },
    { id: "all", label: "Все заказы", icon: "List" },
    { id: "drivers", label: "Водители", icon: "Users" },
    { id: "chat", label: "Чат", icon: "MessageSquare" },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">
      {/* header */}
      <header className="sticky top-0 z-40 bg-[#0d1117]/95 backdrop-blur border-b border-white/8 px-4 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
            <Icon name="Car" size={17} className="text-black" />
          </div>
          <span className="font-black text-lg hidden sm:block">
            Комфорт<span className="text-amber-400">Такси</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <p className="text-sm font-semibold text-white leading-none">{user.full_name}</p>
            <span className="text-xs text-amber-400/80 mt-0.5">Диспетчер</span>
          </div>
          <button
            onClick={logout}
            className="bg-white/8 border border-white/10 hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-300 text-white/60 rounded-xl px-3 py-2 text-sm font-semibold flex items-center gap-1.5 transition"
          >
            <Icon name="LogOut" size={15} />
            <span className="hidden sm:inline">Выйти</span>
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* tab bar */}
        <div className="flex gap-1 bg-white/5 border border-white/10 rounded-2xl p-1.5 mb-6 flex-wrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition flex-1 justify-center ${
                tab === t.id
                  ? "bg-amber-400 text-black shadow"
                  : "text-white/50 hover:text-white hover:bg-white/8"
              }`}
            >
              <Icon name={t.icon} size={16} />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* content */}
        {tab === "new" && <TabNew drivers={drivers} onRefreshDrivers={loadDrivers} />}
        {tab === "all" && <TabAll drivers={drivers} />}
        {tab === "drivers" && (
          <TabDrivers drivers={drivers} loading={driversLoading} onRefresh={loadDrivers} />
        )}
        {tab === "chat" && <TabChat />}
      </div>
    </div>
  );
}
