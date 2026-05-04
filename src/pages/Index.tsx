import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const HERO_IMAGE =
  "https://cdn.poehali.dev/projects/e584f286-df00-4d3a-882a-3f9b18d3eaa2/files/bf4e0d5e-91f4-4664-a3f7-c71ac68bf0c5.jpg";

type Message = {
  role: "user" | "alice";
  text: string;
};

function getAliceReply(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("откуда") || lower.includes("из") || lower.includes("еду"))
    return "Отлично. Укажите, пожалуйста, ваш город отправления и дату поездки.";
  if (
    lower.includes("москв") ||
    lower.includes("питер") ||
    lower.includes("город") ||
    lower.includes("маршрут")
  )
    return "Принято. Маршрут зафиксирован. Сколько пассажиров и есть ли пожелания по автомобилю?";
  return "Понял вас. Передаю заявку менеджеру — он свяжется с вами в течение 15 минут для подтверждения. Спасибо за обращение.";
}

export default function Index() {
  const [activeSection, setActiveSection] = useState<"chat" | "contacts">("chat");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "alice",
      text: "Здравствуйте. Я Алиса — ваш персональный диспетчер. Куда планируете поездку?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { role: "alice", text: getAliceReply(trimmed) }]);
      setIsTyping(false);
    }, 1200);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-noir text-cream font-body">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 bg-noir/90 backdrop-blur-md border-b border-gold/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border border-gold flex items-center justify-center">
            <Icon name="Car" size={14} className="text-gold" />
          </div>
          <span className="font-display text-base tracking-[0.3em] uppercase text-cream">
            TransCity
          </span>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => setActiveSection("chat")}
            className={`px-5 py-2 text-xs tracking-[0.2em] uppercase transition-all duration-300 ${
              activeSection === "chat"
                ? "text-gold border-b border-gold"
                : "text-cream/40 hover:text-cream/70"
            }`}
          >
            Заказ
          </button>
          <button
            onClick={() => setActiveSection("contacts")}
            className={`px-5 py-2 text-xs tracking-[0.2em] uppercase transition-all duration-300 ${
              activeSection === "contacts"
                ? "text-gold border-b border-gold"
                : "text-cream/40 hover:text-cream/70"
            }`}
          >
            Контакты
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative h-screen flex items-end overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="Ночная дорога"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/55 to-noir/10" />
        <div className="relative z-10 w-full px-8 pb-24 md:pb-32 max-w-5xl mx-auto">
          <p className="text-gold text-xs tracking-[0.5em] uppercase mb-5 animate-fade-in">
            Межгород · Деловые поездки
          </p>
          <h1 className="font-display text-5xl md:text-7xl leading-none mb-6 animate-fade-in">
            Надёжно.<br />
            <span className="text-gold">Точно в срок.</span>
          </h1>
          <p className="text-cream/60 text-lg max-w-md animate-fade-in leading-relaxed">
            Персональный трансфер между городами. Фиксированная цена, опытные
            водители, автомобили бизнес-класса.
          </p>
        </div>
        <div className="absolute bottom-8 right-8 flex flex-col items-center gap-2 text-cream/25 text-xs tracking-widest">
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-gold/40 mx-auto" />
          <span>scroll</span>
        </div>
      </section>

      {/* ADVANTAGES */}
      <section className="py-0 max-w-5xl mx-auto px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gold/8 border border-gold/10">
          {[
            {
              icon: "Shield",
              title: "Безопасность",
              desc: "Лицензированные водители, страховка, GPS-мониторинг каждого рейса",
            },
            {
              icon: "Clock",
              title: "Пунктуальность",
              desc: "Выезд строго по расписанию. Возмещаем ожидание при задержке",
            },
            {
              icon: "Star",
              title: "Комфорт",
              desc: "Автомобили бизнес-класса, кондиционер, тишина, зарядка для устройств",
            },
          ].map((item) => (
            <div
              key={item.icon}
              className="p-8 bg-noir hover:bg-white/[0.02] transition-all duration-500 group"
            >
              <div className="w-10 h-10 mb-6 flex items-center justify-center border border-gold/25 group-hover:border-gold/60 transition-colors duration-300">
                <Icon name={item.icon} fallback="Circle" size={18} className="text-gold" />
              </div>
              <h3 className="font-display text-xl mb-3 text-cream">{item.title}</h3>
              <p className="text-cream/45 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MAIN SECTION */}
      <section className="py-24 px-8 max-w-5xl mx-auto">
        {activeSection === "chat" ? (
          <div className="grid md:grid-cols-5 gap-12 items-start">
            <div className="md:col-span-2">
              <p className="text-gold text-xs tracking-[0.4em] uppercase mb-4">
                Онлайн-заказ
              </p>
              <h2 className="font-display text-4xl leading-tight mb-5 text-cream">
                Алиса
                <br />
                оформит заявку
              </h2>
              <p className="text-cream/50 text-sm leading-relaxed">
                Напишите маршрут, дату и пожелания — диспетчер подберёт
                оптимальный вариант и свяжется с вами.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-cream/35 text-xs tracking-[0.2em] uppercase">
                  Онлайн сейчас
                </span>
              </div>
            </div>

            <div className="md:col-span-3 flex flex-col h-[480px] border border-gold/15 bg-noir-light">
              <div className="flex items-center gap-3 px-6 py-4 border-b border-gold/10">
                <div className="w-8 h-8 bg-gold/10 border border-gold/30 flex items-center justify-center">
                  <Icon name="Bot" size={14} className="text-gold" />
                </div>
                <div>
                  <p className="text-cream text-sm font-medium">Алиса</p>
                  <p className="text-cream/35 text-xs">Диспетчер · Онлайн</p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-gold text-noir font-medium"
                          : "bg-white/5 text-cream/80 border border-gold/10"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 border border-gold/10 px-4 py-3 flex gap-1.5 items-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce [animation-delay:0ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce [animation-delay:150ms]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-gold/60 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="flex border-t border-gold/10">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Напишите маршрут или вопрос..."
                  className="flex-1 bg-transparent px-6 py-4 text-sm text-cream placeholder-cream/25 outline-none"
                />
                <button
                  onClick={sendMessage}
                  className="px-6 text-gold hover:text-noir hover:bg-gold transition-all duration-300 border-l border-gold/10"
                >
                  <Icon name="Send" size={16} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-gold text-xs tracking-[0.4em] uppercase mb-4">
                Связь с нами
              </p>
              <h2 className="font-display text-4xl leading-tight mb-6 text-cream">
                Контакты
              </h2>
              <p className="text-cream/50 text-sm leading-relaxed mb-10">
                Работаем круглосуточно. Для срочных заявок — звоните напрямую.
              </p>
              <div className="space-y-6">
                {[
                  { icon: "Phone", label: "Телефон", value: "+7 (900) 000-00-00" },
                  { icon: "Mail", label: "Email", value: "zakaz@transcity.ru" },
                  { icon: "MapPin", label: "Офис", value: "Москва, ул. Примерная, 1" },
                  { icon: "Clock", label: "Режим работы", value: "Ежедневно, 24/7" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4 group">
                    <div className="w-10 h-10 flex items-center justify-center border border-gold/20 group-hover:border-gold/50 transition-colors duration-300 shrink-0">
                      <Icon name={item.icon} fallback="Circle" size={16} className="text-gold" />
                    </div>
                    <div>
                      <p className="text-cream/35 text-xs tracking-[0.2em] uppercase mb-1">
                        {item.label}
                      </p>
                      <p className="text-cream text-base">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-gold/15 p-8 bg-noir-light">
              <h3 className="font-display text-2xl mb-6 text-cream">
                Быстрая заявка
              </h3>
              <div className="space-y-4">
                {[
                  "Ваше имя",
                  "Телефон",
                  "Маршрут (откуда → куда)",
                  "Дата и время",
                ].map((placeholder) => (
                  <input
                    key={placeholder}
                    placeholder={placeholder}
                    className="w-full bg-transparent border border-gold/15 hover:border-gold/30 focus:border-gold/50 px-4 py-3 text-sm text-cream placeholder-cream/30 outline-none transition-colors duration-300"
                  />
                ))}
                <button className="w-full py-4 bg-gold text-noir font-display text-sm tracking-[0.2em] uppercase hover:bg-gold/80 transition-colors duration-300 mt-2">
                  Отправить заявку
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gold/10 px-8 py-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display text-sm tracking-[0.3em] uppercase text-cream/25">
            TransCity
          </span>
          <p className="text-cream/20 text-xs tracking-wider">
            © 2024 · Межгородское такси · Все права защищены
          </p>
          <div className="flex items-center gap-2 text-cream/20 text-xs">
            <Icon name="Shield" size={12} />
            <span>Лицензия № 123456</span>
          </div>
        </div>
      </footer>
    </div>
  );
}