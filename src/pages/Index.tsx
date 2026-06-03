import { useState } from "react";
import Icon from "@/components/ui/icon";

const TG_URL = "https://t.me/guzaerovav";
const MAX_URL = "https://max.ru/u/f9LHodD0cOJ1F_v7tnC7DIg21I2x3v2AngQPF4QHozDLLMqNxBT1T7-MisE";
const PHONE_DISPLAY = "8 (909) 056-46-48";
const PHONE_TEL = "+79090564648";
const HERO_IMG = "https://cdn.poehali.dev/projects/e584f286-df00-4d3a-882a-3f9b18d3eaa2/files/2bd393bd-456c-4bdd-a2bc-0a64066d2120.jpg";

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

const formatPrice = (n: number) =>
  n.toLocaleString("ru-RU") + " ₽";

type Section = "home" | "routes" | "reviews" | "calc";

export default function Index() {
  const [section, setSection] = useState<Section>("home");
  const [km, setKm] = useState(300);
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
    <div className="min-h-screen bg-[#0a0d12] text-white font-sans">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0d12]/95 backdrop-blur border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <button onClick={() => go("home")} className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-white">ДАЛЬНЯК</span>
            <span className="text-xs text-amber-400 font-semibold tracking-widest uppercase">такси</span>
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((n) => (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  section === n.id
                    ? "bg-amber-400 text-black"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>

          {/* Mobile burger */}
          <button
            className="md:hidden p-2 rounded-lg text-white/80 hover:bg-white/10"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? "X" : "Menu"} size={24} />
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#0a0d12] px-4 py-3 flex flex-col gap-1">
            {navItems.map((n) => (
              <button
                key={n.id}
                onClick={() => go(n.id)}
                className={`w-full text-left px-4 py-3 rounded-xl text-base font-medium transition ${
                  section === n.id
                    ? "bg-amber-400 text-black"
                    : "text-white/80 hover:bg-white/10"
                }`}
              >
                {n.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      <div className="pt-16">
        {/* ========== HOME ========== */}
        {section === "home" && (
          <>
            {/* Hero */}
            <div className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
              <img
                src={HERO_IMG}
                alt="Комфортное такси"
                className="absolute inset-0 w-full h-full object-cover opacity-40"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#0a0d12]/60 via-transparent to-[#0a0d12]" />
              <div className="relative z-10 text-center px-4 max-w-2xl mx-auto">
                <div className="inline-block bg-amber-400/20 border border-amber-400/40 rounded-full px-4 py-1 text-amber-400 text-sm font-semibold mb-6 tracking-wide">
                  Межгород по всей России
                </div>
                <h1 className="text-4xl md:text-6xl font-black leading-tight mb-4">
                  Такси для<br />
                  <span className="text-amber-400">дальних поездок</span>
                </h1>
                <p className="text-white/70 text-lg md:text-xl mb-10 leading-relaxed">
                  Фиксированная цена · Комфортный салон · Без пересадок
                </p>

                {/* CTA кнопки */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href={MAX_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 bg-[#005FF9] hover:bg-[#0052d6] text-white font-bold text-lg px-8 py-5 rounded-2xl transition shadow-lg shadow-blue-900/40 active:scale-95"
                  >
                    <Icon name="MessageCircle" size={24} />
                    Написать в MAX
                  </a>
                  <a
                    href={TG_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-3 bg-[#229ED9] hover:bg-[#1a8fc7] text-white font-bold text-lg px-8 py-5 rounded-2xl transition shadow-lg shadow-sky-900/40 active:scale-95"
                  >
                    <Icon name="Send" size={24} />
                    Telegram
                  </a>
                  <a
                    href={`tel:${PHONE_TEL}`}
                    className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-lg px-8 py-5 rounded-2xl transition active:scale-95"
                  >
                    <Icon name="Phone" size={24} />
                    {PHONE_DISPLAY}
                  </a>
                </div>
              </div>
            </div>

            {/* Преимущества */}
            <div className="max-w-5xl mx-auto px-4 py-16 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: "Shield", title: "5 лет", sub: "без срывов" },
                { icon: "MapPin", title: "Вся Россия", sub: "любой маршрут" },
                { icon: "Tag", title: "Фикс. цена", sub: "без сюрпризов" },
                { icon: "Star", title: "Комфорт", sub: "премиум салон" },
              ].map((f) => (
                <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-400/20 flex items-center justify-center">
                      <Icon name={f.icon} size={24} className="text-amber-400" />
                    </div>
                  </div>
                  <div className="font-black text-lg">{f.title}</div>
                  <div className="text-white/50 text-sm">{f.sub}</div>
                </div>
              ))}
            </div>

            {/* Как заказать */}
            <div className="bg-white/5 border-y border-white/10">
              <div className="max-w-5xl mx-auto px-4 py-14">
                <h2 className="text-2xl md:text-3xl font-black text-center mb-10">Как заказать?</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { num: "1", text: "Напиши в MAX или Telegram маршрут и дату поездки" },
                    { num: "2", text: "Получи точную цену и подтверждение за 15 минут" },
                    { num: "3", text: "Садись и отдыхай — довезём комфортно и точно в срок" },
                  ].map((s) => (
                    <div key={s.num} className="flex gap-4 items-start">
                      <div className="w-10 h-10 rounded-xl bg-amber-400 text-black font-black text-lg flex items-center justify-center shrink-0">
                        {s.num}
                      </div>
                      <p className="text-white/80 text-base pt-1 leading-relaxed">{s.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Контакты внизу */}
            <div className="max-w-5xl mx-auto px-4 py-16 text-center">
              <h2 className="text-2xl md:text-3xl font-black mb-3">Готовы ехать?</h2>
              <p className="text-white/60 mb-8">Отвечаем быстро. Пиши в удобный мессенджер</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xl mx-auto">
                <a
                  href={MAX_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-3 bg-[#005FF9] hover:bg-[#0052d6] text-white font-bold text-xl px-6 py-5 rounded-2xl transition active:scale-95"
                >
                  <Icon name="MessageCircle" size={26} />
                  MAX
                </a>
                <a
                  href={TG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-3 bg-[#229ED9] hover:bg-[#1a8fc7] text-white font-bold text-xl px-6 py-5 rounded-2xl transition active:scale-95"
                >
                  <Icon name="Send" size={26} />
                  Telegram
                </a>
                <a
                  href={`tel:${PHONE_TEL}`}
                  className="flex-1 flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xl px-6 py-5 rounded-2xl transition active:scale-95"
                >
                  <Icon name="Phone" size={26} />
                  Звонок
                </a>
              </div>
            </div>
          </>
        )}

        {/* ========== ROUTES ========== */}
        {section === "routes" && (
          <div className="max-w-5xl mx-auto px-4 py-12">
            <h2 className="text-3xl md:text-4xl font-black mb-2">Популярные маршруты</h2>
            <p className="text-white/50 mb-8">Цена от 32 ₽/км · Фиксированная стоимость</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {ROUTES.map((r) => {
                const p = r.km * PRICE_PER_KM;
                return (
                  <div
                    key={r.from + r.to}
                    className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:border-amber-400/40 transition"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                      <span className="font-semibold text-base">{r.from}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 rounded-full bg-white/40 shrink-0" />
                      <span className="font-semibold text-base text-white/70">{r.to}</span>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-black text-amber-400">{formatPrice(p)}</div>
                        <div className="text-white/40 text-sm">{r.km} км</div>
                      </div>
                      <a
                        href={MAX_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#005FF9] hover:bg-[#0052d6] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition active:scale-95"
                      >
                        Заказать
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <a
                href={MAX_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-3 bg-[#005FF9] hover:bg-[#0052d6] text-white font-bold text-lg px-6 py-5 rounded-2xl transition active:scale-95"
              >
                <Icon name="MessageCircle" size={22} />
                Нет нужного маршрута? Пишите!
              </a>
            </div>
          </div>
        )}

        {/* ========== REVIEWS ========== */}
        {section === "reviews" && (
          <div className="max-w-5xl mx-auto px-4 py-12">
            <h2 className="text-3xl md:text-4xl font-black mb-2">Отзывы</h2>
            <p className="text-white/50 mb-8">Нам доверяют сотни пассажиров по всей России</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {REVIEWS.map((rv, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: rv.stars }).map((_, j) => (
                      <Icon key={j} name="Star" size={16} className="text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-white/80 leading-relaxed mb-4">«{rv.text}»</p>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <div className="font-semibold">{rv.name}</div>
                      <div className="text-white/40">{rv.city}</div>
                    </div>
                    <div className="text-white/30">{rv.date}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 text-center">
              <p className="text-white/50 mb-4">Оставьте свой отзыв в нашем чате</p>
              <a
                href={TG_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#229ED9] hover:bg-[#1a8fc7] text-white font-bold px-8 py-4 rounded-2xl text-base transition active:scale-95"
              >
                <Icon name="Send" size={20} />
                Написать в Telegram
              </a>
            </div>
          </div>
        )}

        {/* ========== CALCULATOR ========== */}
        {section === "calc" && (
          <div className="max-w-xl mx-auto px-4 py-12">
            <h2 className="text-3xl md:text-4xl font-black mb-2">Калькулятор</h2>
            <p className="text-white/50 mb-8">Быстрый расчёт стоимости поездки</p>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
              <div>
                <label className="block text-sm font-semibold text-white/60 mb-2">
                  Расстояние (км)
                </label>
                <input
                  type="number"
                  min={200}
                  max={3000}
                  value={km}
                  onChange={(e) => setKm(Number(e.target.value))}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-xl font-bold text-white focus:outline-none focus:border-amber-400 transition"
                  placeholder="Минимум 200 км"
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
                <div className="flex justify-between text-white/30 text-xs mt-1">
                  <span>200 км</span>
                  <span>2 000 км</span>
                </div>
              </div>

              <div className="bg-amber-400/10 border border-amber-400/30 rounded-xl p-5">
                {km < MIN_KM ? (
                  <div className="text-center">
                    <div className="text-amber-400 font-semibold text-sm mb-1">Минимальный заказ</div>
                    <div className="text-white font-bold text-lg">от 200 км</div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-white/50 text-sm mb-1">{km} км × 32 ₽/км</div>
                    <div className="text-4xl font-black text-amber-400">{formatPrice(price!)}</div>
                    <div className="text-white/40 text-xs mt-2">Итоговая стоимость поездки</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <a
                  href={MAX_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#005FF9] hover:bg-[#0052d6] text-white font-bold py-5 rounded-2xl text-base transition active:scale-95"
                >
                  <Icon name="MessageCircle" size={22} />
                  MAX
                </a>
                <a
                  href={TG_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-[#229ED9] hover:bg-[#1a8fc7] text-white font-bold py-5 rounded-2xl text-base transition active:scale-95"
                >
                  <Icon name="Send" size={22} />
                  Telegram
                </a>
              </div>

              <a
                href={`tel:${PHONE_TEL}`}
                className="flex items-center justify-center gap-2 w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-5 rounded-2xl text-base transition active:scale-95"
              >
                <Icon name="Phone" size={22} />
                {PHONE_DISPLAY}
              </a>
            </div>

            <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white/50 leading-relaxed">
              <strong className="text-white/70">Примечание:</strong> Расчёт ориентировочный (32 ₽/км). Точная стоимость уточняется при бронировании.
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-8">
        <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-4 text-white/30 text-sm">
          <div className="font-black text-white/50 text-base">ДАЛЬНЯК · такси</div>
          <a href={`tel:${PHONE_TEL}`} className="text-white/50 hover:text-white transition font-semibold">
            {PHONE_DISPLAY}
          </a>
          <div>Межгород по всей России</div>
        </div>
      </footer>
    </div>
  );
}