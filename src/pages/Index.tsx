import { useState } from "react";
import Icon from "@/components/ui/icon";

const TG_URL = "https://t.me/guzaerovav";
const MAX_URL = "https://max.ru/u/f9LHodD0cOJ1F_v7tnC7DIg21I2x3v2AngQPF4QHozDLLMqNxBT1T7-MisE";
const PHONE_TEL = "+79090564648";
const HERO_IMG = "https://cdn.poehali.dev/projects/e584f286-df00-4d3a-882a-3f9b18d3eaa2/files/2bd393bd-456c-4bdd-a2bc-0a64066d2120.jpg";
const MAX_LOGO = "https://cdn.poehali.dev/projects/e584f286-df00-4d3a-882a-3f9b18d3eaa2/bucket/ab4a7ea5-6fbf-4dfe-ae2d-1e8ededa3d91.png";

const ROUTES = [
  { from: "Москва", to: "Воронеж", km: 520 },
  { from: "Москва", to: "Белгород", km: 695 },
  { from: "Москва", to: "Ростов-на-Дону", km: 1080 },
  { from: "Санкт-Петербург", to: "Москва", km: 710 },
  { from: "Воронеж", to: "Ровеньки", km: 340 },
  { from: "Белгород", to: "Ровеньки", km: 180 },
  { from: "Москва", to: "Липецк", km: 430 },
  { from: "Москва", to: "Курск", km: 540 },
  { from: "Воронеж", to: "Белгород", km: 215 },
  { from: "Москва", to: "Старый Оскол", km: 620 },
  { from: "Москва", to: "Тула", km: 185 },
  { from: "Москва", to: "Орёл", km: 370 },
];

const REVIEWS = [
  {
    name: "Анна К.",
    city: "Москва → Воронеж",
    text: "Отличная поездка! Водитель был вежлив, машина чистая и комфортная. Выехали вовремя, приехали даже раньше. Обязательно закажу снова!",
    stars: 5,
    date: "март 2025",
  },
  {
    name: "Дмитрий М.",
    city: "Белгород → Москва",
    text: "Давно ищу надёжного перевозчика для дальних поездок. Нашёл! Цена адекватная, комфорт на высоте — кресло раскладывается, можно поспать в дороге.",
    stars: 5,
    date: "февраль 2025",
  },
  {
    name: "Светлана П.",
    city: "Москва → Ростов-на-Дону",
    text: "Ехали с мужем и двумя чемоданами. Всё поместилось, ехать комфортно. Водитель предложил остановиться пообедать — очень внимательный. Спасибо!",
    stars: 5,
    date: "апрель 2025",
  },
  {
    name: "Игорь Т.",
    city: "Воронеж → Ровеньки",
    text: "Уже третий раз пользуюсь. Всегда точно в срок, никаких сюрпризов. Цена фиксированная — знаешь заранее сколько заплатишь. Рекомендую!",
    stars: 5,
    date: "май 2025",
  },
  {
    name: "Ольга В.",
    city: "СПб → Москва",
    text: "Отличный сервис! Удобный просторный салон, водитель профессиональный. Ехали ночью — всё прошло спокойно. Добрались с комфортом.",
    stars: 5,
    date: "январь 2025",
  },
  {
    name: "Александр Н.",
    city: "Москва → Старый Оскол",
    text: "Заказывал срочно, договорились быстро. Выехали через 2 часа. Водитель вёл аккуратно, машина BMW — кожа, климат-контроль. Всё на уровне!",
    stars: 5,
    date: "март 2025",
  },
];

const PRICE_PER_KM = 32;
const MIN_KM = 200;
const formatPrice = (n: number) => n.toLocaleString("ru-RU") + " ₽";

type Section = "home" | "routes" | "reviews" | "calc";

/* ── Переиспользуемые кнопки связи ── */
function ContactButtons({ size = "lg" }: { size?: "sm" | "lg" }) {
  const py = size === "lg" ? "py-5" : "py-4";
  const text = size === "lg" ? "text-lg" : "text-base";
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <a
        href={MAX_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex-1 flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#5B5BF6] to-[#A855F7] hover:opacity-90 text-white font-bold ${text} px-6 ${py} rounded-2xl transition shadow-lg active:scale-95`}
      >
        <img src={MAX_LOGO} alt="MAX" className="w-6 h-6 rounded-full" />
        Написать в MAX
      </a>
      <a
        href={TG_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex-1 flex items-center justify-center gap-2.5 bg-[#229ED9] hover:bg-[#1a8fc7] text-white font-bold ${text} px-6 ${py} rounded-2xl transition shadow-lg active:scale-95`}
      >
        <Icon name="Send" size={22} />
        Telegram
      </a>
    </div>
  );
}

export default function Index() {
  const [section, setSection] = useState<Section>("home");
  const [km, setKm] = useState(350);
  const [menuOpen, setMenuOpen] = useState(false);

  const price = km >= MIN_KM ? km * PRICE_PER_KM : null;

  const navItems: { id: Section; label: string }[] = [
    { id: "home", label: "Главная" },
    { id: "routes", label: "Маршруты" },
    { id: "reviews", label: "Отзывы" },
    { id: "calc", label: "Калькулятор" },
  ];

  const go = (s: Section) => {
    setSection(s);
    setMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d1117]/95 backdrop-blur-md border-b border-white/8">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => go("home")} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Icon name="Car" size={18} className="text-black" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">Комфорт</span>
              <span className="text-xl font-black tracking-tight text-amber-400 ml-1.5">Такси</span>
            </div>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((n) => (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                  section === n.id
                    ? "bg-amber-400 text-black"
                    : "text-white/60 hover:text-white hover:bg-white/8"
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>

          {/* Desktop quick-contact */}
          <div className="hidden md:flex items-center gap-2">
            <a
              href={MAX_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-gradient-to-r from-[#5B5BF6] to-[#A855F7] hover:opacity-90 text-white font-bold text-sm px-4 py-2 rounded-xl transition active:scale-95"
            >
              <img src={MAX_LOGO} alt="MAX" className="w-4 h-4 rounded-full" />
              MAX
            </a>
            <a
              href={TG_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-[#229ED9] hover:bg-[#1a8fc7] text-white font-bold text-sm px-4 py-2 rounded-xl transition active:scale-95"
            >
              <Icon name="Send" size={14} />
              Telegram
            </a>
          </div>

          <button
            className="md:hidden p-2 rounded-lg text-white/70 hover:bg-white/8"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? "X" : "Menu"} size={24} />
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-white/8 bg-[#0d1117] px-4 py-3 flex flex-col gap-1">
            {navItems.map((n) => (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-base font-semibold transition ${
                  section === n.id ? "bg-amber-400 text-black" : "text-white/80 hover:bg-white/8"
                }`}
              >
                {n.label}
              </button>
            ))}
            <div className="pt-2 flex flex-col gap-2">
              <a
                href={MAX_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#5B5BF6] to-[#A855F7] text-white font-bold py-3.5 rounded-xl transition"
              >
                <img src={MAX_LOGO} alt="MAX" className="w-5 h-5 rounded-full" />
                Написать в MAX
              </a>
              <a
                href={TG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-[#229ED9] text-white font-bold py-3.5 rounded-xl transition"
              >
                <Icon name="Send" size={18} />
                Telegram
              </a>
            </div>
          </div>
        )}
      </nav>

      <div className="pt-16">

        {/* ══════════════ HOME ══════════════ */}
        {section === "home" && (
          <>
            {/* Hero */}
            <div className="relative min-h-[92vh] flex items-end justify-center overflow-hidden pb-12 md:items-center md:pb-0">
              <img
                src={HERO_IMG}
                alt="Комфортное такси"
                className="absolute inset-0 w-full h-full object-cover object-center opacity-45"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d1117] via-[#0d1117]/40 to-[#0d1117]/70" />
              <div className="relative z-10 text-center px-4 max-w-2xl mx-auto w-full">
                <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 rounded-full px-4 py-1.5 text-amber-400 text-sm font-semibold mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Межгород по всей России
                </div>
                <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4">
                  Такси для<br />
                  <span className="text-amber-400">дальних поездок</span>
                </h1>
                <p className="text-white/65 text-lg md:text-xl mb-8 leading-relaxed">
                  Комфортный салон · Фиксированная цена · Без пересадок
                </p>
                <div className="max-w-md mx-auto">
                  <ContactButtons size="lg" />
                </div>
              </div>
            </div>

            {/* Трастовые значки */}
            <div className="max-w-5xl mx-auto px-4 py-14 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: "ShieldCheck", title: "5+ лет", sub: "без единого срыва" },
                { icon: "MapPin", title: "Вся Россия", sub: "любой маршрут" },
                { icon: "Tag", title: "Фикс. цена", sub: "платите ровно столько" },
                { icon: "Star", title: "Премиум", sub: "кожаный салон, климат" },
              ].map((f) => (
                <div key={f.title} className="bg-white/4 border border-white/8 rounded-2xl p-5 text-center hover:border-amber-400/30 transition">
                  <div className="flex justify-center mb-3">
                    <div className="w-11 h-11 rounded-xl bg-amber-400/15 flex items-center justify-center">
                      <Icon name={f.icon} size={22} className="text-amber-400" />
                    </div>
                  </div>
                  <div className="font-black text-lg">{f.title}</div>
                  <div className="text-white/45 text-sm mt-0.5">{f.sub}</div>
                </div>
              ))}
            </div>

            {/* Как заказать */}
            <div className="bg-gradient-to-b from-white/3 to-transparent border-y border-white/8">
              <div className="max-w-5xl mx-auto px-4 py-14">
                <h2 className="text-2xl md:text-3xl font-black text-center mb-10">Как заказать?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  {[
                    { num: "1", text: "Напиши в MAX или Telegram — укажи маршрут и дату" },
                    { num: "2", text: "Получи точную цену и подтверждение за 15 минут" },
                    { num: "3", text: "Садись и отдыхай — довезём с комфортом точно в срок" },
                  ].map((s) => (
                    <div key={s.num} className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-amber-400 text-black font-black text-lg flex items-center justify-center shrink-0">
                        {s.num}
                      </div>
                      <p className="text-white/75 text-base pt-1 leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                </div>
                <ContactButtons />
              </div>
            </div>

            {/* Популярные маршруты превью */}
            <div className="max-w-5xl mx-auto px-4 py-14">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-black">Популярные маршруты</h2>
                <button
                  onClick={() => go("routes")}
                  className="text-amber-400 font-semibold text-sm hover:text-amber-300 transition"
                >
                  Все маршруты →
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                {ROUTES.slice(0, 6).map((r) => (
                  <div
                    key={r.from + r.to}
                    className="bg-white/4 border border-white/8 rounded-xl p-4 hover:border-amber-400/30 transition"
                  >
                    <div className="text-sm font-semibold">{r.from}</div>
                    <div className="text-white/40 text-xs my-1">↓ {r.km} км</div>
                    <div className="text-sm font-semibold text-white/70">{r.to}</div>
                  </div>
                ))}
              </div>
              {/* Кнопка с чётким указанием куда писать */}
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={MAX_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#5B5BF6] to-[#A855F7] hover:opacity-90 text-white font-bold text-base px-6 py-4 rounded-2xl transition active:scale-95"
                >
                  <img src={MAX_LOGO} alt="MAX" className="w-5 h-5 rounded-full" />
                  Заказать маршрут в MAX
                </a>
                <a
                  href={TG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2.5 bg-[#229ED9] hover:bg-[#1a8fc7] text-white font-bold text-base px-6 py-4 rounded-2xl transition active:scale-95"
                >
                  <Icon name="Send" size={20} />
                  Заказать маршрут в Telegram
                </a>
              </div>
            </div>

            {/* CTA блок */}
            <div className="bg-gradient-to-r from-amber-400/8 to-orange-400/5 border-y border-amber-400/15 py-14">
              <div className="max-w-2xl mx-auto px-4 text-center">
                <h2 className="text-2xl md:text-3xl font-black mb-2">Готовы ехать?</h2>
                <p className="text-white/50 mb-8">Отвечаем быстро в обоих мессенджерах</p>
                <ContactButtons size="lg" />
                <p className="text-white/25 text-sm mt-5">
                  Звонок: <a href={`tel:${PHONE_TEL}`} className="underline hover:text-white/50 transition">по запросу</a>
                </p>
              </div>
            </div>
          </>
        )}

        {/* ══════════════ ROUTES ══════════════ */}
        {section === "routes" && (
          <div className="max-w-5xl mx-auto px-4 py-12">
            <h2 className="text-3xl md:text-4xl font-black mb-2">Популярные маршруты</h2>
            <p className="text-white/45 mb-8">Уточняйте цену в мессенджере — ответим за 15 минут</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {ROUTES.map((r) => (
                <div
                  key={r.from + r.to}
                  className="bg-white/4 border border-white/8 rounded-2xl p-5 hover:border-amber-400/30 transition"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="font-bold text-base">{r.from}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4 pl-1">
                    <div className="w-px h-5 bg-white/15 ml-[3px]" />
                    <span className="text-white/35 text-xs ml-1">{r.km} км</span>
                  </div>
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-2 h-2 rounded-full bg-white/30 shrink-0" />
                    <span className="font-semibold text-base text-white/70">{r.to}</span>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={MAX_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-gradient-to-r from-[#5B5BF6] to-[#A855F7] hover:opacity-90 text-white font-bold px-3 py-2.5 rounded-xl text-sm transition active:scale-95"
                    >
                      <img src={MAX_LOGO} alt="MAX" className="w-4 h-4 rounded-full" />
                      MAX
                    </a>
                    <a
                      href={TG_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#229ED9] hover:bg-[#1a8fc7] text-white font-bold px-3 py-2.5 rounded-xl text-sm transition active:scale-95"
                    >
                      <Icon name="Send" size={14} />
                      Telegram
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Нет нужного маршрута */}
            <div className="bg-white/4 border border-white/8 rounded-2xl p-6 text-center">
              <div className="text-white/60 mb-1 text-lg font-semibold">Нет нужного маршрута?</div>
              <p className="text-white/40 text-sm mb-5">Везём в любую точку России — просто напишите</p>
              <ContactButtons />
            </div>
          </div>
        )}

        {/* ══════════════ REVIEWS ══════════════ */}
        {section === "reviews" && (
          <div className="max-w-5xl mx-auto px-4 py-12">
            <h2 className="text-3xl md:text-4xl font-black mb-2">Отзывы</h2>
            <p className="text-white/45 mb-8">Нам доверяют сотни пассажиров по всей России</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
              {REVIEWS.map((rv, i) => (
                <div key={i} className="bg-white/4 border border-white/8 rounded-2xl p-6 hover:border-white/15 transition">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: rv.stars }).map((_, j) => (
                      <Icon key={j} name="Star" size={15} className="text-amber-400" />
                    ))}
                  </div>
                  <p className="text-white/75 leading-relaxed mb-5">«{rv.text}»</p>
                  <div className="flex items-center justify-between text-sm border-t border-white/8 pt-4">
                    <div>
                      <div className="font-semibold">{rv.name}</div>
                      <div className="text-white/35 text-xs mt-0.5">{rv.city}</div>
                    </div>
                    <div className="text-white/25 text-xs">{rv.date}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white/4 border border-white/8 rounded-2xl p-6 text-center">
              <p className="text-white/50 mb-5 font-semibold">Поделитесь своим впечатлением о поездке</p>
              <ContactButtons />
            </div>
          </div>
        )}

        {/* ══════════════ CALCULATOR ══════════════ */}
        {section === "calc" && (
          <div className="max-w-xl mx-auto px-4 py-12">
            <h2 className="text-3xl md:text-4xl font-black mb-2">Калькулятор</h2>
            <p className="text-white/45 mb-8">Быстрый расчёт стоимости поездки</p>

            <div className="bg-white/4 border border-white/8 rounded-2xl p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white/50 mb-2">
                  Расстояние (км) — минимум 200 км
                </label>
                <input
                  type="number"
                  min={200}
                  max={3000}
                  value={km}
                  onChange={(e) => setKm(Number(e.target.value))}
                  className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-4 text-2xl font-bold text-white focus:outline-none focus:border-amber-400 transition"
                />
              </div>

              <div>
                <input
                  type="range"
                  min={200}
                  max={2000}
                  step={10}
                  value={km}
                  onChange={(e) => setKm(Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
                <div className="flex justify-between text-white/25 text-xs mt-1">
                  <span>200 км</span>
                  <span>2 000 км</span>
                </div>
              </div>

              <div className="bg-amber-400/8 border border-amber-400/25 rounded-xl p-5 text-center">
                {km < MIN_KM ? (
                  <>
                    <div className="text-amber-400 font-semibold text-sm mb-1">Минимальный заказ</div>
                    <div className="text-white font-bold text-xl">от 200 км</div>
                  </>
                ) : (
                  <>
                    <div className="text-white/40 text-sm mb-1">{km} км × 32 ₽/км</div>
                    <div className="text-5xl font-black text-amber-400">{formatPrice(price!)}</div>
                    <div className="text-white/35 text-xs mt-2">Ориентировочная стоимость</div>
                  </>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-white/40 text-sm text-center">Напишите нам — уточним точную цену за 15 минут</p>
                <a
                  href={MAX_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full bg-gradient-to-r from-[#5B5BF6] to-[#A855F7] hover:opacity-90 text-white font-bold text-lg py-5 rounded-2xl transition active:scale-95"
                >
                  <img src={MAX_LOGO} alt="MAX" className="w-6 h-6 rounded-full" />
                  Заказать в MAX
                </a>
                <a
                  href={TG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full bg-[#229ED9] hover:bg-[#1a8fc7] text-white font-bold text-lg py-5 rounded-2xl transition active:scale-95"
                >
                  <Icon name="Send" size={22} />
                  Заказать в Telegram
                </a>
              </div>
            </div>

            <div className="mt-5 bg-white/3 border border-white/8 rounded-xl p-4 text-sm text-white/40 leading-relaxed">
              <strong className="text-white/55">Примечание:</strong> Расчёт ориентировочный (32 ₽/км). Точная стоимость уточняется при бронировании.
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/8 mt-8">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Icon name="Car" size={15} className="text-black" />
              </div>
              <span className="font-black text-white/60">Комфорт Такси</span>
            </div>
            <div className="flex gap-3">
              <a
                href={MAX_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-gradient-to-r from-[#5B5BF6] to-[#A855F7] text-white font-bold text-sm px-4 py-2 rounded-xl transition hover:opacity-90"
              >
                <img src={MAX_LOGO} alt="MAX" className="w-4 h-4 rounded-full" />
                MAX
              </a>
              <a
                href={TG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-[#229ED9] text-white font-bold text-sm px-4 py-2 rounded-xl transition hover:bg-[#1a8fc7]"
              >
                <Icon name="Send" size={13} />
                Telegram
              </a>
            </div>
            <div className="text-white/25 text-sm">Межгород по всей России</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
