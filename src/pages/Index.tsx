import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const ALICE_URL = "https://functions.poehali.dev/43a3c28f-95df-4c13-b492-834ef01e281a";
const LOGO_URL = "https://cdn.poehali.dev/projects/e584f286-df00-4d3a-882a-3f9b18d3eaa2/bucket/60a2f7e9-50aa-4be3-898b-2395df495665.jpg";
const MAX_LOGO = "https://cdn.poehali.dev/projects/e584f286-df00-4d3a-882a-3f9b18d3eaa2/bucket/92e5468b-6fd2-45a8-b58a-18932a92731e.png";
const TG_URL = "https://t.me/Mezhgorod1816";
const MAX_URL = "https://max.ru/u/f9LHodD0cOKyxRQqeR7xEDH25l9Nm8fSUsA2_1MzFQHNuvQmIYwwPFlMh3s";
const PHONE_DISPLAY = "8 (995) 645-51-25";
const PHONE_TEL = "+79956455125";

type Message = { role: "user" | "alice"; text: string; time: string };

const DEFAULT_MSG = "Здравствуйте! Я Алиса 🌸 Помогу подобрать машину и сразу посчитаю цену. Куда планируете поездку?";

const formatTime = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

const getUtmContext = () => {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((k) => {
    const v = params.get(k);
    if (v && !v.includes("{")) utm[k] = v;
  });
  return Object.keys(utm).length > 0 ? utm : null;
};

const buildInitialGreeting = (utm: Record<string, string> | null): string => {
  if (!utm) return DEFAULT_MSG;
  const term = utm.utm_term || utm.utm_content || utm.utm_campaign;
  if (term) {
    const cleaned = decodeURIComponent(term).replace(/[+_-]/g, " ").trim();
    return `Здравствуйте! Я Алиса 🌸 Вижу, вы искали «${cleaned}» — помогу подобрать авто и сразу посчитаю цену. Подскажите точный маршрут?`;
  }
  return "Здравствуйте! Я Алиса 🌸 Спасибо, что зашли к нам! Помогу подобрать машину и быстро посчитаю стоимость. Куда планируете поездку?";
};

export default function Index() {
  const [splashDone, setSplashDone] = useState(false);
  const [splashFading, setSplashFading] = useState(false);
  const utmRef = useRef<Record<string, string> | null>(getUtmContext());
  const sessionIdRef = useRef<string>(
    (typeof window !== "undefined" && (window.sessionStorage.getItem("alice_session") ||
      (() => {
        const id = "s_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
        window.sessionStorage.setItem("alice_session", id);
        return id;
      })())) || "anon"
  );
  const greeting = buildInitialGreeting(utmRef.current);
  const initialMsg: Message = { role: "alice", text: greeting, time: formatTime() };
  const [messages, setMessages] = useState<Message[]>([initialMsg]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Message[]>([initialMsg]);

  useEffect(() => {
    const t1 = setTimeout(() => setSplashFading(true), 2200);
    const t2 = setTimeout(() => setSplashDone(true), 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isTyping) return;
    const newMsg: Message = { role: "user", text: trimmed, time: formatTime() };
    const updated = [...historyRef.current, newMsg];
    historyRef.current = updated;
    setMessages([...updated]);
    setInput("");
    setIsTyping(true);
    try {
      const res = await fetch(ALICE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated, utm: utmRef.current, session_id: sessionIdRef.current }),
      });
      const data = await res.json();
      const aliceMsg: Message = { role: "alice", text: data.reply, time: formatTime() };
      historyRef.current = [...updated, aliceMsg];
      const next = [...historyRef.current];
      if (data.order_sent) {
        const sysNote: Message = {
          role: "alice",
          text: "✅ Заявка отправлена менеджеру. Перезвонит в течение 15 минут!",
          time: formatTime(),
        };
        historyRef.current = [...historyRef.current, sysNote];
        next.push(sysNote);
      }
      setMessages(next);
    } catch {
      const err: Message = { role: "alice", text: "У нас небольшая заминка. Оставьте номер телефона — менеджер перезвонит в течение 15 минут!", time: formatTime() };
      historyRef.current = [...updated, err];
      setMessages([...historyRef.current]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div className="h-screen flex flex-col bg-warm-white text-charcoal font-body overflow-hidden">

      {/* SPLASH */}
      {!splashDone && (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-taxi-yellow transition-opacity duration-700 ${splashFading ? "opacity-0" : "opacity-100"}`}>
          <div className="flex flex-col items-center gap-6 animate-splash-in">
            <img src={LOGO_URL} alt="Такси Дальняк" className="w-44 h-44 object-contain rounded-3xl shadow-2xl" />
            <div className="text-center">
              <p className="text-black/60 text-sm tracking-[0.3em] uppercase font-medium">По всей России</p>
              <p className="text-black/60 text-sm tracking-[0.3em] uppercase font-medium">и новым территориям</p>
            </div>
            <div className="flex gap-1.5 mt-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="w-2 h-2 rounded-full bg-black/30 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="flex items-center justify-between px-3 md:px-6 py-2.5 bg-white border-b border-stone-200 shadow-sm shrink-0 z-20">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Такси Дальняк" className="h-10 w-10 object-contain rounded-xl" />
          <div className="hidden sm:block">
            <p className="font-display font-bold text-sm text-charcoal leading-tight">Такси Дальняк</p>
            <p className="text-[11px] text-stone-500 leading-tight">Межгород · По всей России</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={TG_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="Telegram"
            className="w-10 h-10 rounded-full bg-tg-blue text-white flex items-center justify-center hover:bg-tg-blue/90 transition-colors active:scale-95 shadow-sm"
          >
            <Icon name="Send" size={17} />
          </a>
          <a
            href={MAX_URL}
            target="_blank"
            rel="noopener noreferrer"
            title="МАКС"
            className="w-10 h-10 rounded-full overflow-hidden hover:scale-105 transition-transform active:scale-95 shadow-sm bg-white"
          >
            <img src={MAX_LOGO} alt="МАКС" className="w-full h-full object-cover" />
          </a>
          <a
            href={`tel:${PHONE_TEL}`}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-taxi-yellow text-black rounded-xl text-sm font-bold hover:bg-taxi-yellow/80 transition-colors active:scale-95 shadow-sm"
          >
            <Icon name="Phone" size={15} />
            <span className="hidden sm:inline">{PHONE_DISPLAY}</span>
          </a>
        </div>
      </header>

      {/* CHAT — full screen messenger */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Chat top bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-tg-chatbar border-b border-stone-200 shadow-sm shrink-0">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-taxi-yellow to-amber-500 flex items-center justify-center text-lg font-bold text-black shadow-md">А</div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-charcoal text-[15px] leading-tight">Алиса</p>
            <p className="text-xs text-tg-blue leading-tight">в сети</p>
          </div>
          <button className="w-9 h-9 rounded-full hover:bg-stone-200 flex items-center justify-center transition-colors text-stone-500">
            <Icon name="MoreVertical" size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-3 md:px-6 py-4 chat-bg">
          <div className="max-w-3xl mx-auto space-y-1.5">

            <div className="flex justify-center my-3">
              <span className="bg-white/80 backdrop-blur text-[11px] text-stone-500 px-3 py-1 rounded-full shadow-sm">
                Сегодня
              </span>
            </div>

            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const showAvatar = msg.role === "alice" && (!prev || prev.role !== "alice");
              const isUser = msg.role === "user";
              return (
                <div key={i} className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"} animate-msg-in`}>
                  {!isUser && (
                    <div className={`w-7 h-7 shrink-0 ${showAvatar ? "" : "invisible"}`}>
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-taxi-yellow to-amber-500 flex items-center justify-center text-[11px] font-bold text-black">А</div>
                    </div>
                  )}
                  <div className={`relative max-w-[80%] md:max-w-[65%] px-3 py-2 text-[15px] leading-snug shadow-sm whitespace-pre-wrap ${
                    isUser
                      ? "bg-tg-bubble-out text-charcoal rounded-2xl rounded-br-md"
                      : "bg-white text-charcoal rounded-2xl rounded-bl-md"
                  }`}>
                    <span>{msg.text}</span>
                    <span className={`inline-flex items-center gap-0.5 ml-2 text-[10px] ${isUser ? "text-stone-500" : "text-stone-400"} float-right mt-1`}>
                      {msg.time}
                      {isUser && <Icon name="CheckCheck" size={12} className="text-tg-blue" />}
                    </span>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div className="flex items-end gap-2 justify-start">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-taxi-yellow to-amber-500 flex items-center justify-center text-[11px] font-bold text-black shrink-0">А</div>
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-md shadow-sm flex gap-1 items-center">
                  <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="bg-tg-chatbar border-t border-stone-200 px-3 md:px-6 py-2.5 shrink-0">
          <div className="max-w-3xl mx-auto flex items-end gap-2">
            <button className="w-10 h-10 rounded-full hover:bg-stone-200 flex items-center justify-center text-stone-500 transition-colors shrink-0">
              <Icon name="Paperclip" size={20} />
            </button>
            <div className="flex-1 bg-white rounded-3xl border border-stone-200 flex items-end px-4 py-2 shadow-sm focus-within:border-tg-blue/50 transition-colors">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Сообщение"
                rows={1}
                className="flex-1 bg-transparent text-[15px] text-charcoal placeholder-stone-400 outline-none resize-none max-h-32 py-1"
                style={{ minHeight: "24px" }}
              />
              <button className="text-stone-400 hover:text-stone-600 ml-2 transition-colors">
                <Icon name="Smile" size={20} />
              </button>
            </div>
            <button
              onClick={sendMessage}
              disabled={isTyping || !input.trim()}
              className="w-10 h-10 rounded-full bg-tg-blue text-white flex items-center justify-center hover:bg-tg-blue/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 shrink-0 shadow-md"
            >
              <Icon name="Send" size={18} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}