const MAX_URL = "https://max.ru/u/f9LHodD0cOJ1F_v7tnC7DIg21I2x3v2AngQPF4QHozDLLMqNxBT1T7-MisE";
const TG_URL = "https://t.me/guzaerovav";
const TG_CHANNEL = "https://t.me/guzaerovataro";
const AVITO_URL = "https://www.avito.ru/brands/65139343be65c11adf199d7793f943c6?src=sharing";
const MAX_LOGO = "https://cdn.poehali.dev/projects/e584f286-df00-4d3a-882a-3f9b18d3eaa2/bucket/ab4a7ea5-6fbf-4dfe-ae2d-1e8ededa3d91.png";

const PHOTO_HERO = "https://cdn.poehali.dev/projects/e584f286-df00-4d3a-882a-3f9b18d3eaa2/files/45c870c9-c5d2-4543-be0b-07a775dc2a8f.jpg";
const PHOTO_CARDS = "https://cdn.poehali.dev/projects/e584f286-df00-4d3a-882a-3f9b18d3eaa2/files/9ce7ea31-e277-4916-8062-3679d9171969.jpg";
const PHOTO_LOVE = "https://cdn.poehali.dev/projects/e584f286-df00-4d3a-882a-3f9b18d3eaa2/files/ba55fa8e-75a0-4a13-8bb9-90c8b8bd4b5d.jpg";
const PHOTO_MATRIX = "https://cdn.poehali.dev/projects/e584f286-df00-4d3a-882a-3f9b18d3eaa2/files/d4d83f82-fd05-4e09-994d-a147f51899e6.jpg";
const PHOTO_PROTECT = "https://cdn.poehali.dev/projects/e584f286-df00-4d3a-882a-3f9b18d3eaa2/files/fc2e6e56-5955-489b-9033-fbddf7d7bc7a.jpg";

const SERVICES = [
  {
    id: 1,
    title: "Ответ на любой вопрос",
    desc: "Развёрнутый расклад с пояснением по любой ситуации в вашей жизни. Любовь, работа, деньги, решения.",
    price: "550",
    img: PHOTO_CARDS,
    badge: "Хит",
    badgeColor: "bg-amber-400 text-black",
  },
  {
    id: 2,
    title: "Расклад на отношения",
    desc: "Схематичные расклады на отношения. Подберу расклад под вашу ситуацию: новые отношения, кризис, измена, перспективы.",
    price: "1 500",
    img: PHOTO_LOVE,
    badge: "Популярно",
    badgeColor: "bg-purple-500 text-white",
  },
  {
    id: 3,
    title: "Диагностика магического воздействия",
    desc: "Есть ли воздействие извне. Как влияет на вашу жизнь и здоровье. Порча, сглаз, привязки — полная диагностика.",
    price: "2 500",
    img: PHOTO_PROTECT,
    badge: null,
    badgeColor: "",
  },
  {
    id: 4,
    title: "Матрица судьбы",
    desc: "По дате рождения. 3 ключевые энергии личности, предназначение, детско-родительский канал, таланты, финансовый поток, родовой квадрат, прошлое воплощение, личная энергия года.",
    price: "3 000",
    img: PHOTO_MATRIX,
    badge: "Глубоко",
    badgeColor: "bg-indigo-500 text-white",
  },
];

const TRAINING = [
  { title: "Обучение Таро", sub: "с 0 до практика", price: "30 000" },
  { title: "Обучение Матрице судьбы", sub: "полный курс", price: "20 000" },
];

function ContactButtons({ size = "lg" }: { size?: "sm" | "lg" }) {
  const py = size === "lg" ? "py-4" : "py-3";
  const text = size === "lg" ? "text-base" : "text-sm";
  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full">
      <a
        href={MAX_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-goal="click_max"
        className={`flex-1 flex items-center justify-center gap-2.5 bg-gradient-to-r from-[#5B5BF6] to-[#A855F7] hover:opacity-90 text-white font-bold ${text} px-5 ${py} rounded-2xl transition active:scale-95 shadow-lg shadow-purple-500/20`}
      >
        <img src={MAX_LOGO} alt="MAX" className="w-5 h-5 rounded-full shrink-0" />
        Написать в MAX
      </a>
      <a
        href={TG_URL}
        target="_blank"
        rel="noopener noreferrer"
        data-goal="click_telegram"
        className={`flex-1 flex items-center justify-center gap-2.5 bg-[#229ED9] hover:bg-[#1a8fc7] text-white font-bold ${text} px-5 ${py} rounded-2xl transition active:scale-95 shadow-lg shadow-blue-500/20`}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/></svg>
        Написать в Telegram
      </a>
    </div>
  );
}

export default function Index() {
  return (
    <div className="min-h-screen bg-[#0e0814] text-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── HERO ── */}
      <section className="relative min-h-[100svh] flex items-end overflow-hidden">
        <img
          src={PHOTO_HERO}
          alt="Вероника — таролог"
          className="absolute inset-0 w-full h-full object-cover object-top"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0814] via-[#0e0814]/60 to-[#0e0814]/20" />

        <div className="relative z-10 w-full px-4 pb-12 pt-8 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-400/15 border border-amber-400/30 rounded-full px-4 py-1.5 text-amber-300 text-sm font-semibold mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Онлайн · Отвечаю быстро
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Не откладывай —<br />
            <span className="text-amber-300">узнай своё завтра!</span>
          </h1>
          <p className="text-white/70 text-lg sm:text-xl mb-2">Расклад Таро <span className="text-amber-300 font-bold">от 550 ₽</span></p>
          <p className="text-white/50 text-base mb-8">Меня зовут Вероника. Помогаю найти ответы там, где их не видно.</p>
          <ContactButtons size="lg" />
        </div>
      </section>

      {/* ── ДОВЕРИЕ ── */}
      <section className="py-8 border-y border-white/8 bg-white/3">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            <div className="flex items-center gap-2.5">
              <div className="text-3xl font-bold text-amber-300" style={{ fontFamily: "'Cormorant Garamond', serif" }}>500+</div>
              <div className="text-white/50 text-sm">консультаций<br />проведено</div>
            </div>
            <div className="w-px h-10 bg-white/10 hidden sm:block" />
            {/* Avito badge */}
            <a href={AVITO_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:opacity-80 transition">
              <div className="w-10 h-10 rounded-xl bg-[#00AAFF] flex items-center justify-center font-black text-white text-sm">A</div>
              <div>
                <div className="flex items-center gap-1">
                  <span className="text-xl font-bold text-amber-300" style={{ fontFamily: "'Cormorant Garamond', serif" }}>4.9</span>
                  <span className="text-amber-400 text-base">★★★★★</span>
                </div>
                <div className="text-white/40 text-xs">Рейтинг на Авито</div>
              </div>
            </a>
            <div className="w-px h-10 bg-white/10 hidden sm:block" />
            <a href={TG_CHANNEL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 hover:opacity-80 transition">
              <div className="w-10 h-10 rounded-xl bg-[#229ED9] flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/></svg>
              </div>
              <div>
                <div className="text-white font-semibold text-sm">Отзывы</div>
                <div className="text-white/40 text-xs">в Telegram-канале</div>
              </div>
            </a>
          </div>
        </div>
      </section>

      {/* ── УСЛУГИ ── */}
      <section className="py-16 px-4 max-w-3xl mx-auto">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
          Услуги и цены
        </h2>
        <p className="text-white/40 text-center mb-10">Выберите то, что нужно именно вам</p>

        <div className="space-y-4">
          {SERVICES.map((s) => (
            <div key={s.id} className="group bg-white/4 hover:bg-white/7 border border-white/10 hover:border-purple-500/30 rounded-2xl overflow-hidden transition-all duration-300">
              <div className="flex gap-0">
                <div className="w-28 sm:w-36 shrink-0 relative overflow-hidden">
                  <img src={s.img} alt={s.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  {s.badge && (
                    <span className={`absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full ${s.badgeColor}`}>
                      {s.badge}
                    </span>
                  )}
                </div>
                <div className="flex-1 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3 className="font-bold text-base sm:text-lg leading-snug">{s.title}</h3>
                      <div className="text-amber-300 font-black text-lg sm:text-xl shrink-0" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                        {s.price} ₽
                      </div>
                    </div>
                    <p className="text-white/50 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <a href={MAX_URL} target="_blank" rel="noopener noreferrer" data-goal="click_max"
                      className="flex items-center gap-1.5 bg-gradient-to-r from-[#5B5BF6] to-[#A855F7] hover:opacity-90 text-white font-bold text-xs px-3 py-2 rounded-xl transition active:scale-95">
                      <img src={MAX_LOGO} alt="MAX" className="w-3.5 h-3.5 rounded-full" />MAX
                    </a>
                    <a href={TG_URL} target="_blank" rel="noopener noreferrer" data-goal="click_telegram"
                      className="flex items-center gap-1.5 bg-[#229ED9] hover:bg-[#1a8fc7] text-white font-bold text-xs px-3 py-2 rounded-xl transition active:scale-95">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/></svg>
                      Telegram
                    </a>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ОБУЧЕНИЕ ── */}
      <section className="py-12 px-4 bg-gradient-to-b from-purple-950/20 to-transparent border-y border-white/8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-2" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Обучение
          </h2>
          <p className="text-white/40 text-center mb-8">Освойте инструменты познания себя и мира</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {TRAINING.map((t) => (
              <div key={t.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition">
                <div className="text-3xl mb-3">🔮</div>
                <h3 className="font-bold text-lg mb-1">{t.title}</h3>
                <p className="text-white/40 text-sm mb-4">{t.sub}</p>
                <div className="text-amber-300 font-black text-2xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
                  {t.price} ₽
                </div>
              </div>
            ))}
          </div>
          <ContactButtons />
        </div>
      </section>

      {/* ── О ВЕРОНИКЕ ── */}
      <section className="py-16 px-4 max-w-3xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-8 items-center">
          <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden shrink-0 border-2 border-purple-500/30">
            <img src={PHOTO_HERO} alt="Вероника" className="w-full h-full object-cover object-top" loading="lazy" />
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Меня зовут Вероника</h2>
            <p className="text-white/60 leading-relaxed mb-4">
              Я практикующий таролог и специалист по матрице судьбы. Помогаю людям найти ответы на важные вопросы, разобраться в отношениях, понять своё предназначение и сделать правильный выбор.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href={AVITO_URL} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition">
                <div className="w-5 h-5 rounded-md bg-[#00AAFF] flex items-center justify-center text-white text-xs font-black">A</div>
                Отзывы на Авито · 4.9 ★
              </a>
              <a href={TG_CHANNEL} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-white/8 hover:bg-white/12 border border-white/10 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#229ED9]"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12L8.32 13.617l-2.96-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.828.942z"/></svg>
                Telegram-канал с отзывами
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── ИТОГОВЫЙ CTA ── */}
      <section className="py-16 px-4 bg-gradient-to-b from-transparent to-purple-950/30 border-t border-white/8">
        <div className="max-w-xl mx-auto text-center">
          <div className="text-5xl mb-5">🔮</div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Не откладывай —<br /><span className="text-amber-300">узнай своё завтра!</span>
          </h2>
          <p className="text-white/50 mb-8 text-lg">Расклад Таро <span className="text-amber-300 font-bold">от 550 ₽</span> · Ответ сегодня</p>
          <ContactButtons size="lg" />
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/8 py-6 px-4">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-white/25 text-sm">
          <span>Вероника — таролог · Онлайн-консультации</span>
          <div className="flex gap-4">
            <a href={AVITO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition">Авито</a>
            <a href={TG_CHANNEL} target="_blank" rel="noopener noreferrer" className="hover:text-white/50 transition">Telegram-канал</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
