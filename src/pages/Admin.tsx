import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import { toast } from "sonner";

const ADMIN_URL = "https://functions.poehali.dev/c1001ea1-8ce4-4812-a3e2-9488343a7660";

type Session = {
  session_id: string;
  started_at: string;
  last_activity: string;
  closed_at: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  messages_count: number;
  has_error: boolean;
  order_sent: boolean;
  order_phone: string | null;
  order_route: string | null;
  order_price: string | null;
  last_user_message: string | null;
  last_alice_message: string | null;
};

type Message = { role: string; content: string; created_at: string };

type Stats = {
  total: number;
  orders: number;
  errors: number;
  engaged: number;
  bounced: number;
  conv_rate: number;
  sources: { source: string; total: number; orders: number }[];
  top_routes: { route: string; count: number }[];
};

const fmtDateTime = (s: string | null) => {
  if (!s) return "—";
  const d = new Date(s);
  return d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
};

export default function Admin() {
  const [pwd, setPwd] = useState(localStorage.getItem("admin_pwd") || "");
  const [authed, setAuthed] = useState(!!localStorage.getItem("admin_pwd"));
  const [hours, setHours] = useState(24);
  const [onlyOrders, setOnlyOrders] = useState(false);
  const [search, setSearch] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selected, setSelected] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [prompt, setPrompt] = useState("");
  const [promptUpdated, setPromptUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const apiGet = useCallback(async (path: string) => {
    const res = await fetch(`${ADMIN_URL}${path}`, { headers: { "X-Admin-Password": pwd } });
    if (res.status === 401) {
      localStorage.removeItem("admin_pwd");
      setAuthed(false);
      throw new Error("Неверный пароль");
    }
    return res.json();
  }, [pwd]);

  const apiPost = useCallback(async (path: string, body: unknown) => {
    const res = await fetch(`${ADMIN_URL}${path}`, {
      method: "POST",
      headers: { "X-Admin-Password": pwd, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }, [pwd]);

  const loadAll = useCallback(async () => {
    if (!authed) return;
    setLoading(true);
    try {
      const [s, st, p] = await Promise.all([
        apiGet(`?action=sessions&hours=${hours}${onlyOrders ? "&only_orders=1" : ""}${search ? `&search=${encodeURIComponent(search)}` : ""}`),
        apiGet(`?action=stats&hours=${hours}`),
        apiGet(`?action=prompt`),
      ]);
      setSessions(s);
      setStats(st);
      setPrompt(p.value || "");
      setPromptUpdated(p.updated_at);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка загрузки";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [authed, hours, onlyOrders, search, apiGet]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openSession = async (s: Session) => {
    setSelected(s);
    try {
      const m = await apiGet(`?action=messages&session_id=${encodeURIComponent(s.session_id)}`);
      setMessages(m);
    } catch {
      setMessages([]);
    }
  };

  const savePrompt = async () => {
    try {
      await apiPost("?action=prompt", { value: prompt });
      toast.success("Промпт сохранён! Алиса будет работать по новой инструкции");
      loadAll();
    } catch {
      toast.error("Не удалось сохранить");
    }
  };

  const tryLogin = () => {
    if (!pwd) return;
    localStorage.setItem("admin_pwd", pwd);
    setAuthed(true);
  };

  const logout = () => {
    localStorage.removeItem("admin_pwd");
    setPwd("");
    setAuthed(false);
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <Card className="p-8 max-w-sm w-full space-y-4">
          <div className="text-center">
            <Icon name="Lock" size={32} className="mx-auto mb-2 text-slate-700" />
            <h1 className="text-xl font-bold">Админка Алисы</h1>
            <p className="text-sm text-slate-500">Введите пароль для входа</p>
          </div>
          <Input
            type="password"
            placeholder="Пароль"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && tryLogin()}
          />
          <Button className="w-full" onClick={tryLogin}>Войти</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Алиса · Админка</h1>
          <div className="flex gap-2 items-center">
            <select
              className="border rounded px-3 py-1.5 text-sm bg-white"
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
            >
              <option value={3}>3 часа</option>
              <option value={24}>24 часа</option>
              <option value={72}>3 дня</option>
              <option value={168}>7 дней</option>
              <option value={720}>30 дней</option>
            </select>
            <Button variant="outline" size="sm" onClick={loadAll} disabled={loading}>
              <Icon name="RefreshCw" size={16} className={loading ? "animate-spin" : ""} />
            </Button>
            <Button variant="ghost" size="sm" onClick={logout}>Выйти</Button>
          </div>
        </div>

        <Tabs defaultValue="dialogs">
          <TabsList>
            <TabsTrigger value="dialogs">Диалоги</TabsTrigger>
            <TabsTrigger value="stats">Аналитика</TabsTrigger>
            <TabsTrigger value="prompt">Промпт</TabsTrigger>
          </TabsList>

          <TabsContent value="dialogs" className="space-y-3">
            <div className="flex gap-2 flex-wrap">
              <Input
                placeholder="Поиск по телефону, маршруту, тексту..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-md"
              />
              <Button
                variant={onlyOrders ? "default" : "outline"}
                size="sm"
                onClick={() => setOnlyOrders(!onlyOrders)}
              >
                <Icon name="CheckCircle" size={16} className="mr-1" />
                Только заявки
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-3">
              <Card className="p-2 max-h-[70vh] overflow-y-auto">
                {sessions.length === 0 && (
                  <p className="text-sm text-slate-500 p-4 text-center">Нет диалогов за выбранный период</p>
                )}
                {sessions.map((s) => (
                  <button
                    key={s.session_id}
                    onClick={() => openSession(s)}
                    className={`w-full text-left p-3 rounded-lg mb-1 hover:bg-slate-100 transition ${selected?.session_id === s.session_id ? "bg-slate-100 ring-1 ring-slate-300" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">{fmtDateTime(s.started_at)}</span>
                      <div className="flex gap-1">
                        {s.order_sent && <Badge className="bg-green-600">Заявка</Badge>}
                        {s.has_error && <Badge variant="destructive">Ошибка</Badge>}
                        {!s.order_sent && s.messages_count <= 1 && <Badge variant="secondary">Ушёл сразу</Badge>}
                        {s.closed_at && !s.order_sent && <Badge variant="outline">Закрыл</Badge>}
                      </div>
                    </div>
                    <div className="text-sm font-medium truncate">
                      {s.order_route || s.last_user_message || "(только открыл)"}
                    </div>
                    <div className="flex gap-2 mt-1 text-xs text-slate-500">
                      <span>{s.messages_count} сообщ.</span>
                      {s.utm_source && <span>· {s.utm_source}</span>}
                      {s.order_phone && <span>· {s.order_phone}</span>}
                    </div>
                  </button>
                ))}
              </Card>

              <Card className="p-4 max-h-[70vh] overflow-y-auto">
                {!selected ? (
                  <p className="text-sm text-slate-500 text-center py-12">Выбери диалог слева</p>
                ) : (
                  <div className="space-y-3">
                    <div className="border-b pb-3">
                      <h3 className="font-semibold">Сессия {selected.session_id.slice(0, 14)}…</h3>
                      <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                        <div>Начало: {fmtDateTime(selected.started_at)}</div>
                        <div>Активность: {fmtDateTime(selected.last_activity)}</div>
                        {selected.closed_at && <div>Закрыл сайт: {fmtDateTime(selected.closed_at)}</div>}
                        {selected.utm_source && <div>UTM: {selected.utm_source} / {selected.utm_campaign || "—"} / {selected.utm_term || selected.utm_content || "—"}</div>}
                        {selected.order_sent && (
                          <div className="text-green-700 font-medium pt-1">
                            ✅ Заявка: {selected.order_route} · {selected.order_phone} · {selected.order_price}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {messages.map((m, i) => (
                        <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${m.role === "user" ? "bg-blue-500 text-white" : "bg-slate-100"}`}>
                            <div className="whitespace-pre-wrap">{m.content}</div>
                            <div className={`text-[10px] mt-1 ${m.role === "user" ? "text-blue-100" : "text-slate-400"}`}>
                              {fmtDateTime(m.created_at)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            {stats && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Card className="p-4">
                    <div className="text-xs text-slate-500">Всего диалогов</div>
                    <div className="text-2xl font-bold">{stats.total}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-xs text-slate-500">Заявок</div>
                    <div className="text-2xl font-bold text-green-600">{stats.orders}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-xs text-slate-500">Конверсия</div>
                    <div className="text-2xl font-bold text-blue-600">{stats.conv_rate}%</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-xs text-slate-500">Ушли сразу</div>
                    <div className="text-2xl font-bold text-orange-500">{stats.bounced}</div>
                  </Card>
                  <Card className="p-4">
                    <div className="text-xs text-slate-500">Ошибок</div>
                    <div className="text-2xl font-bold text-red-500">{stats.errors}</div>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Источники трафика</h3>
                    <div className="space-y-2">
                      {stats.sources.map((s, i) => (
                        <div key={i} className="flex justify-between items-center text-sm border-b pb-1">
                          <span>{s.source}</span>
                          <span className="text-slate-500">
                            {s.total} → <span className="text-green-600 font-medium">{s.orders}</span>
                            {s.total > 0 && <span className="ml-1 text-xs">({Math.round((s.orders / s.total) * 100)}%)</span>}
                          </span>
                        </div>
                      ))}
                      {stats.sources.length === 0 && <p className="text-sm text-slate-400">Нет данных</p>}
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Топ маршрутов в заявках</h3>
                    <div className="space-y-2">
                      {stats.top_routes.map((r, i) => (
                        <div key={i} className="flex justify-between text-sm border-b pb-1">
                          <span className="truncate pr-2">{r.route}</span>
                          <span className="text-slate-500">{r.count}</span>
                        </div>
                      ))}
                      {stats.top_routes.length === 0 && <p className="text-sm text-slate-400">Пока нет заявок</p>}
                    </div>
                  </Card>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="prompt" className="space-y-3">
            <Card className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">Системный промпт Алисы</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {promptUpdated
                      ? `Последнее изменение: ${fmtDateTime(promptUpdated)}`
                      : "Сейчас работает встроенный промпт. Заполни поле — Алиса начнёт использовать твой."}
                  </p>
                </div>
                <Button onClick={savePrompt}>
                  <Icon name="Save" size={16} className="mr-1" /> Сохранить
                </Button>
              </div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Опиши, как Алиса должна вести диалог: тон, цены, маршруты, правила..."
                className="min-h-[500px] font-mono text-sm"
              />
              <div className="text-xs text-slate-500 mt-2">
                Если поле пустое — используется встроенный промпт. Изменения вступают в силу мгновенно для всех новых сообщений.
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}