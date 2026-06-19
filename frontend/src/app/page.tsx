import Link from "next/link";
import Backdrop from "@/components/Backdrop";

const TEMPLATES = [
  {
    emoji: "🌳",
    bg: "bg-purple-soft",
    badge: { text: "Популярное", cls: "bg-purple text-white" },
    title: "Зачарованный лес",
    age: "3–7 лет",
    desc: "Волшебный лес, где смелость растёт, как деревья.",
    tag: { text: "Фэнтези", cls: "bg-purple-soft text-purple" },
  },
  {
    emoji: "🧭",
    bg: "bg-peach",
    badge: { text: "Новинка", cls: "bg-pink text-white" },
    title: "Смелый исследователь",
    age: "4–8 лет",
    desc: "Путешествие по картам, горам и скрытым сокровищам.",
    tag: { text: "Приключения", cls: "bg-peach text-pink" },
  },
  {
    emoji: "🌊",
    bg: "bg-green-soft",
    badge: null,
    title: "Друзья океана",
    age: "3–6 лет",
    desc: "Спокойная подводная история о доброте и природе.",
    tag: { text: "Природа", cls: "bg-green-soft text-green" },
  },
];

const STEPS = [
  {
    emoji: "🧒",
    bg: "bg-peach",
    step: "ШАГ 1",
    stepCls: "text-pink",
    title: "Расскажите о ребёнке",
    desc: "Имя, возраст, увлечения и фото — герой станет узнаваемым.",
  },
  {
    emoji: "🎨",
    bg: "bg-purple-soft",
    step: "ШАГ 2",
    stepCls: "text-purple",
    title: "Выберите сюжет и стиль",
    desc: "Шаблон, тема, тёплая тема о страхах и стиль иллюстраций.",
  },
  {
    emoji: "📚",
    bg: "bg-green-soft",
    step: "ШАГ 3",
    stepCls: "text-green",
    title: "Получите книгу",
    desc: "Читайте онлайн разворотами или скачивайте PDF для печати.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Backdrop />
      <main className="relative z-[2]">
        {/* mini top bar */}
        <div className="mx-auto flex max-w-[1240px] items-center px-12 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[13px] bg-primary text-[21px] shadow-[0_5px_14px_rgba(232,130,90,0.4)]">
              📖
            </div>
            <span className="font-display text-[23px] font-extrabold">StoryCraft</span>
          </div>
          <div className="flex-1" />
          <Link
            href="/login"
            className="rounded-pill px-[18px] py-2.5 text-[15px] font-bold text-ink-soft hover:bg-[#f3e8d9]"
          >
            Войти
          </Link>
          <Link
            href="/login"
            className="ml-1.5 rounded-pill bg-ink px-[22px] py-2.5 font-display text-[15px] font-bold text-white hover:bg-[#564b44]"
          >
            Начать
          </Link>
        </div>

        {/* hero */}
        <section className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-12 px-12 pt-10 pb-8 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-pill border border-border bg-surface px-[15px] py-[7px] text-[13px] font-bold text-pink shadow-[0_4px_12px_rgba(120,90,60,0.05)]">
              🪄 Персональные сказки за 2 минуты
            </div>
            <h1 className="mt-5 font-display text-[58px] font-extrabold leading-[1.04] tracking-[-1px] text-balance">
              Сказки, где главный
              <br />
              герой — <span className="text-primary">ваш ребёнок</span>
            </h1>
            <p className="mt-5 max-w-[480px] text-[19px] leading-[1.55] text-[#7a6f67]">
              Выберите шаблон, расскажите о ребёнке и его страхах — и получите
              тёплую иллюстрированную книгу, написанную именно для него.
            </p>
            <div className="mt-[30px] flex gap-3.5">
              <Link
                href="/login"
                className="inline-flex items-center gap-2.5 rounded-pill bg-primary px-[30px] py-4 font-display text-[18px] font-bold text-white shadow-[0_8px_22px_rgba(232,130,90,0.38)] transition hover:-translate-y-0.5"
              >
                Создать книгу бесплатно →
              </Link>
              <Link
                href="/login"
                className="rounded-pill border-2 border-[#efe6da] bg-surface px-[26px] py-4 font-display text-[18px] font-bold text-ink transition hover:border-primary hover:text-primary-dark"
              >
                Как это работает
              </Link>
            </div>
            <div className="mt-[26px] flex items-center gap-2.5 text-sm font-semibold text-faint">
              <div className="flex">
                <div className="flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-bg bg-[#ffe0cd] text-[15px]">🧒</div>
                <div className="-ml-2.5 flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-bg bg-[#e0f3ea] text-[15px]">👧</div>
                <div className="-ml-2.5 flex h-[34px] w-[34px] items-center justify-center rounded-full border-2 border-bg bg-[#ece0fb] text-[15px]">👦</div>
              </div>
              <span>Более 12 000 сказок уже создано родителями</span>
            </div>
          </div>

          {/* hero illustration */}
          <div className="relative hidden h-[420px] lg:block">
            <div className="animate-floaty-slow absolute inset-0 m-auto h-[330px] w-[420px] -rotate-3 overflow-hidden rounded-[26px] border border-border bg-surface shadow-[0_24px_60px_rgba(120,90,60,0.16)]">
              <div className="grid h-full grid-cols-2">
                <div className="flex flex-col items-center justify-center gap-3.5 border-r-2 border-dashed border-[rgba(124,58,237,0.25)] bg-purple-soft p-[22px]">
                  <div className="text-[64px]">🌳</div>
                  <div className="h-20 w-20 rounded-full bg-white/55" />
                </div>
                <div className="flex flex-col justify-center gap-[11px] bg-[#fff6f0] px-[22px] py-6">
                  <div className="h-[11px] w-[85%] rounded-md bg-[#f3d9c8]" />
                  <div className="h-[11px] w-[95%] rounded-md bg-[#f3d9c8]" />
                  <div className="h-[11px] w-[70%] rounded-md bg-[#f3d9c8]" />
                  <div className="h-[11px] w-[90%] rounded-md bg-[#f6e5da]" />
                  <div className="h-[11px] w-[55%] rounded-md bg-[#f6e5da]" />
                  <div className="mt-2 font-display text-sm font-bold text-pink">
                    …и Эмма больше не боялась темноты.
                  </div>
                </div>
              </div>
            </div>
            <div className="animate-floaty absolute top-1.5 right-6 flex h-[74px] w-[74px] rotate-[8deg] items-center justify-center rounded-[20px] bg-[#fff9e6] text-[34px] shadow-[0_10px_24px_rgba(120,90,60,0.14)]">⭐</div>
            <div className="animate-floaty absolute bottom-4 left-1 flex h-16 w-16 -rotate-[9deg] items-center justify-center rounded-[18px] bg-[#eefaf5] text-[30px] shadow-[0_10px_24px_rgba(120,90,60,0.14)]">🦊</div>
          </div>
        </section>

        {/* how it works */}
        <section className="mx-auto mt-8 max-w-[1100px] px-12">
          <div className="mb-8 text-center">
            <h2 className="font-display text-[34px] font-extrabold">Как это работает</h2>
            <p className="mt-2 text-[17px] text-muted">Три простых шага до личной сказки</p>
          </div>
          <div className="grid grid-cols-1 gap-[22px] md:grid-cols-3">
            {STEPS.map((s) => (
              <div
                key={s.step}
                className="rounded-card border border-border bg-surface p-[30px] text-center shadow-card"
              >
                <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-[20px] text-[30px] ${s.bg}`}>
                  {s.emoji}
                </div>
                <div className={`mt-4 font-display text-sm font-bold ${s.stepCls}`}>{s.step}</div>
                <h3 className="my-1 font-display text-[21px] font-bold">{s.title}</h3>
                <p className="text-[15px] leading-[1.5] text-muted">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* templates */}
        <section className="mx-auto mt-14 max-w-[1240px] px-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="font-display text-[34px] font-extrabold">Шаблоны сказок</h2>
              <p className="mt-1.5 text-[17px] text-muted">Шесть миров на выбор — для любого возраста</p>
            </div>
            <Link href="/login" className="font-display text-[15px] font-bold text-primary-dark">
              Все шаблоны →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-[22px] md:grid-cols-3">
            {TEMPLATES.map((t) => (
              <Link
                href="/login"
                key={t.title}
                className="overflow-hidden rounded-card border border-border bg-surface shadow-card transition hover:-translate-y-1.5 hover:shadow-pop"
              >
                <div className={`relative flex h-[150px] items-center justify-center ${t.bg}`}>
                  <div className="text-[58px]">{t.emoji}</div>
                  {t.badge && (
                    <div className={`absolute top-3.5 left-4 rounded-pill px-[11px] py-1 text-xs font-bold ${t.badge.cls}`}>
                      {t.badge.text}
                    </div>
                  )}
                </div>
                <div className="px-5 pt-[18px] pb-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-xl font-bold">{t.title}</h3>
                    <span className="text-[13px] font-bold text-faint">{t.age}</span>
                  </div>
                  <p className="mt-[7px] text-sm leading-[1.45] text-muted">{t.desc}</p>
                  <span className={`mt-3 inline-block rounded-pill px-3 py-1 text-xs font-bold ${t.tag.cls}`}>
                    {t.tag.text}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* bottom CTA */}
        <section className="mx-auto mt-14 mb-[70px] max-w-[1240px] px-12">
          <div className="relative overflow-hidden rounded-[30px] bg-ink p-14">
            <div className="absolute -top-10 right-10 h-[180px] w-[180px] rounded-full bg-[rgba(232,130,90,0.35)]" />
            <div className="absolute -bottom-12 right-[200px] h-[120px] w-[120px] rounded-full bg-[rgba(192,112,154,0.3)]" />
            <div className="relative max-w-[560px]">
              <h2 className="font-display text-[38px] font-extrabold leading-[1.1] text-white">
                Подарите ребёнку сказку, в которой он — герой
              </h2>
              <p className="mt-3.5 mb-6 text-[18px] text-[#d8cdc4]">
                Первая книга бесплатно. Без карты, без подписки — просто попробуйте.
              </p>
              <Link
                href="/login"
                className="inline-block rounded-pill bg-primary px-8 py-4 font-display text-[18px] font-bold text-white shadow-[0_8px_22px_rgba(232,130,90,0.45)] transition hover:-translate-y-0.5"
              >
                Создать первую книгу →
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
