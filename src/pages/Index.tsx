import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const ALICE_URL = "https://functions.poehali.dev/43a3c28f-95df-4c13-b492-834ef01e281a";
const LOGO_URL = "https://cdn.poehali.dev/projects/e584f286-df00-4d3a-882a-3f9b18d3eaa2/bucket/60a2f7e9-50aa-4be3-898b-2395df495665.jpg";
const HERO_IMAGE = "https://cdn.poehali.dev/projects/e584f286-df00-4d3a-882a-3f9b18d3eaa2/files/bf4e0d5e-91f4-4664-a3f7-c71ac68bf0c5.jpg";

type Message = { role: "user" | "alice"; text: string };

const INITIAL_MSG = "Добрый день! Алиса, менеджер Такси Дальняк 🚗 Хотите быстро узнать стоимость поездки? Скажите маршрут — назову цену за минуту, без звонков!";

export default function Index() {
  const [splashDone, setSplashDone] = useState(false);
  const [splashFading, setSplashFading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "alice", text: INITIAL_MSG },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<Message[]>([{ role: "alice", text: INITIAL_MSG }]);

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
    const newMsg: Message = { role: "user", text: trimmed };
    const updated = [...historyRef.current, newMsg];
    historyRef.current = updated;
    setMessages([...updated]);
    setInput("");
    setIsTyping(true);
    try {
      const res = await fetch(ALICE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updated }),
      });
      const data = await res.json();
      const aliceMsg: Message = { role: "alice", text: data.reply };
      historyRef.current = [...updated, aliceMsg];
      setMessages([...historyRef.current]);
    } catch {
      const err: Message = { role: "alice", text: "У нас небольшая заминка. Оставьте номер телефона — менеджер перезвонит в течение 15 минут!" };
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
    <div className="min-h-screen bg-warm-white text-charcoal font-body">

      {/* SPLASH */}
      {!splashDone && (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-taxi-yellow transition-opacity duration-700 ${splashFading ? "opacity-0" : "opacity-100"}`}>
          <div className="flex flex-col items-center gap-6 animate-splash-in">
            <img src={LOGO_URL} alt="Такси Дальняк" className="w-48 h-48 object-contain rounded-3xl shadow-2xl" />
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
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 py-3 bg-warm-white/95 backdrop-blur-sm border-b border-stone-200 shadow-sm">
        <img src={LOGO_URL} alt="Такси Дальняк" className="h-10 w-10 object-contain rounded-xl" />
        <div className="flex items-center gap-2 md:gap-3">
          <a
            href="https://t.me/dalniak_max"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-tg-blue text-white rounded-xl text-sm font-medium hover:bg-tg-blue/90 transition-colors"
          >
            <Icon name="Send" size={15} />
            <span className="hidden sm:inline">Telegram Макс</span>
            <span className="sm:hidden">Telegram</span>
          </a>
          <a
            href="tel:+79956455125"
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-taxi-yellow text-black rounded-xl text-sm font-bold hover:bg-taxi-yellow/80 transition-colors"
          >
            <Icon name="Phone" size={15} />
            <span className="hidden sm:inline">8 (995) 645-51-25</span>
            <span className="sm:hidden">Звонок</span>
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-16 h-[55vh] min-h-[320px] flex items-end overflow-hidden">
        <img src={HERO_IMAGE} alt="Такси дальняк" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-warm-white via-black/30 to-black/10" />
        <div className="relative z-10 w-full px-4 md:px-8 pb-10 max-w-3xl mx-auto">
          <div className="inline-block bg-taxi-yellow text-black text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3">
            Межгород по всей России
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight text-white drop-shadow-lg">
            Такси <span className="text-taxi-yellow">Дальняк</span>
          </h1>
          <p className="text-white/85 text-base mt-2 drop-shadow">
            Надёжно, по фиксированной цене, 5 лет без срывов
          </p>
        </div>
      </section>

      {/* CHAT */}
      <section className="px-4 md:px-8 py-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg border border-stone-200 overflow-hidden">

          {/* Chat header */}
          <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-taxi-yellow/20 to-amber-50 border-b border-stone-200">
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-taxi-yellow flex items-center justify-center text-lg font-bold text-black shadow">А</div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
            </div>
            <div>
              <p className="font-semibold text-charcoal text-sm">Алиса</p>
              <p className="text-xs text-stone-500">Менеджер · Онлайн сейчас</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-xs text-stone-400">
              <Icon name="Shield" size={12} className="text-green-500" />
              <span>Безопасный чат</span>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[380px] overflow-y-auto px-4 py-4 space-y-3 bg-stone-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-msg-in`}>
                {msg.role === "alice" && (
                  <div className="w-7 h-7 rounded-full bg-taxi-yellow flex items-center justify-center text-xs font-bold text-black mr-2 mt-1 shrink-0">А</div>
                )}
                <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-taxi-yellow text-black font-medium rounded-br-sm"
                    : "bg-white text-charcoal border border-stone-200 rounded-bl-sm shadow-sm"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-full bg-taxi-yellow flex items-center justify-center text-xs font-bold text-black mr-2 shrink-0">А</div>
                <div className="bg-white border border-stone-200 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm flex gap-1 items-center">
                  <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 rounded-full bg-stone-400 animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-4 py-3 border-t border-stone-200 bg-white">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Напишите маршрут или вопрос..."
              className="flex-1 bg-stone-100 rounded-xl px-4 py-2.5 text-sm text-charcoal placeholder-stone-400 outline-none focus:ring-2 focus:ring-taxi-yellow/50 transition-all"
            />
            <button
              onClick={sendMessage}
              disabled={isTyping || !input.trim()}
              className="w-10 h-10 rounded-xl bg-taxi-yellow text-black flex items-center justify-center hover:bg-taxi-yellow/80 disabled:opacity-40 transition-all active:scale-95"
            >
              <Icon name="Send" size={16} />
            </button>
          </div>
        </div>

        {/* Trust badges */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: "MapPin", text: "Вся Россия и новые территории" },
            { icon: "Shield", text: "5 лет без срывов" },
            { icon: "Clock", text: "Подача за 15 мин" },
            { icon: "Star", text: "Фиксированная цена" },
          ].map((b) => (
            <div key={b.text} className="flex items-center gap-2 bg-white rounded-xl px-3 py-3 border border-stone-200 shadow-sm">
              <Icon name={b.icon} fallback="Check" size={16} className="text-taxi-yellow shrink-0" />
              <span className="text-xs text-stone-600 leading-snug">{b.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-6 text-xs text-stone-400 border-t border-stone-200 mt-4">
        © 2024 Такси Дальняк · <a href="tel:+79956455125" className="text-amber-600 hover:underline">8 (995) 645-51-25</a>
      </footer>
    </div>
  );
}
