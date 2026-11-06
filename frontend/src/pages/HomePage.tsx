import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";

import { api, unwrap } from "../api/client";
import { heroArtHtml } from "../art/heroArt";
import { useAuth } from "../auth/AuthContext";
import { plural } from "../components/common";
import { ProfIcon } from "../components/icons";
import { useLoad } from "../hooks/useLoad";

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

/** Иллюстрация с параллаксом за курсором, как в прототипе. */
function HeroArt() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const move = (e: MouseEvent) => {
      const a = ref.current;
      if (!a) return;
      const r = a.getBoundingClientRect();
      const inside = e.clientX > r.left - 200 && e.clientX < r.right + 200 && e.clientY > r.top - 200 && e.clientY < r.bottom + 200;
      const clamp = (v: number) => Math.max(-1, Math.min(1, v));
      const mx = inside ? clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2)) : 0;
      const my = inside ? clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2)) : 0;
      a.style.setProperty("--mx", mx.toFixed(3));
      a.style.setProperty("--my", my.toFixed(3));
    };
    document.addEventListener("mousemove", move);
    return () => document.removeEventListener("mousemove", move);
  }, []);
  // Статичная SVG-разметка из art/heroArt.ts, без данных API.
  return <div ref={ref} className="o-art iso-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: heroArtHtml() }} />;
}

function ContactForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sent, setSent] = useState(false);
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const errs: Record<string, string> = {};
    if (!String(f.get("name")).trim()) errs.name = "Напишите, как к вам обращаться";
    if (!isEmail(String(f.get("email")).trim())) errs.email = "Проверьте адрес почты";
    if (String(f.get("msg")).trim().length < 5) errs.msg = "Напишите вопрос";
    if (!f.get("ok")) errs.ok = "Отметьте согласие на обработку персональных данных.";
    setErrors(errs);
    // Приёма обращений в API пока нет: не делаем вид, что письмо ушло.
    if (Object.keys(errs).length === 0) setSent(true);
  };
  if (sent) {
    return (
      <div className="stack o-form sent-box">
        <span className="chip">Форма пока не отправляет письма</span>
        <h2>Напишите нам на почту</h2>
        <p className="muted">Приём обращений через сайт появится позже. Пока пишите на <a href="mailto:info@navigator-it.ru">info@navigator-it.ru</a> — ответим в течение рабочего дня.</p>
      </div>
    );
  }
  const field = (id: string) => errors[id] ? { "aria-invalid": true, "aria-describedby": `fb-${id}-err` } : {};
  return (
    <form className="stack o-form" noValidate onSubmit={submit}>
      <div className="o-form-row">
        <div className="field"><label htmlFor="fbName">Имя</label><input id="fbName" name="name" type="text" placeholder="Как к вам обращаться" {...field("name")} />{errors.name && <span className="err" id="fb-name-err">{errors.name}</span>}</div>
        <div className="field"><label htmlFor="fbMail">Почта</label><input id="fbMail" name="email" type="email" placeholder="you@example.ru" {...field("email")} />{errors.email && <span className="err" id="fb-email-err">{errors.email}</span>}</div>
      </div>
      <div className="field"><label htmlFor="fbMsg">Сообщение</label><textarea id="fbMsg" name="msg" placeholder="Ваш вопрос" {...field("msg")} />{errors.msg && <span className="err" id="fb-msg-err">{errors.msg}</span>}</div>
      <label className="check"><input type="checkbox" name="ok" /><span>Даю <Link to="/consent">согласие на обработку персональных данных</Link> и принимаю <Link to="/policy">политику конфиденциальности</Link></span></label>
      {errors.ok && <span className="err">{errors.ok}</span>}
      <div><button className="btn primary" type="submit">Отправить</button></div>
    </form>
  );
}

const HOW_PREV = [
  <div className="row gap-6"><span className="chip accent">QA</span><span className="chip">Python</span><span className="chip">Java</span></div>,
  <div className="stack gap-8"><span className="fs-13">Что выведет typeof null?</span><div className="progress m-0"><i className="on" /><i className="on" /><i /><i /></div></div>,
  <div className="row gap-10 nowrap"><b className="mono fs-20">46%</b><div className="grow"><div className="meter"><i className="w-78" /></div></div></div>,
  <div className="stack gap-4 fs-13"><div className="row between"><span>Основы SQL</span><span className="mono muted">25 ч</span></div><div className="row between"><span>Postman</span><span className="mono muted">10 ч</span></div></div>,
];

export function HomePage() {
  const nav = useNavigate();
  const { user } = useAuth();
  const catalog = useLoad(() => unwrap(api.GET("/professions")), []);
  const items = catalog.data?.items ?? [];
  const available = items.filter((p) => p.status === "available");
  const topicsTotal = items.reduce((s, p) => s + p.topics_count, 0);
  const first = available[0]?.slug;

  const steps: [string, string, string, string][] = [
    ["Выберите профессию", "Из каталога или по итогам теста на профориентацию, если ещё не определились.", "/catalog", "Каталог"],
    ["Оцените свои навыки", "Около 10 минут вопросов по темам, которые встречаются в вакансиях.", "/assess", "Пример оценки"],
    ["Посмотрите отчёт", "Процент соответствия вакансиям и навыки, которых не хватает.", first ? `/professions/${first}#match` : "/catalog", "Пример отчёта"],
    ["Идите по плану", "Порядок тем, часы на каждую и срок с учётом вашего свободного времени.", "/plan", "Пример плана"],
  ];

  return (
    <>
      <section className="o-hero">
        <div className="o-copy">
          <span className="eyebrow">Для студентов, выпускников и тех, кто меняет профессию</span>
          <h1 className="mt-14">Узнайте, чего вам не хватает до первой работы в IT</h1>
          <p className="lead">Выберите профессию, пройдите оценку навыков и сравните себя с требованиями реальных вакансий. Затем получите план: что учить, в каком порядке и сколько это займёт.</p>
          <div className="row">
            <button className="btn primary lg" onClick={() => nav(user ? "/catalog" : "/auth?tab=register")}>Начать бесплатно</button>
            <button className="btn ghost lg" onClick={() => nav("/catalog")}>Каталог профессий</button>
          </div>
          <dl className="o-facts">
            <div><dt>{items.length || "—"}</dt><dd>{plural(items.length, ["профессия", "профессии", "профессий"])} в IT</dd></div>
            <div><dt>{topicsTotal || "—"}</dt><dd>{plural(topicsTotal, ["тема", "темы", "тем"])} в картах профессий</dd></div>
            <div><dt>0&nbsp;₽</dt><dd>каталог и карта тем</dd></div>
          </dl>
        </div>
        <HeroArt />
      </section>

      <section className="section">
        <h2>Кем хотите стать?</h2>
        <div className="p3-wrap">
          <div className="p3-card p3-pick p3y">
            <div className="p3-h"><span className="p3-n">Уже знаю</span><h3>Выберите профессию</h3><span className="muted p3-p">Откроем карту навыков и требования работодателей.</span></div>
            <div className="pk-grid">
              {items.slice(0, 5).map((p) => (
                <button key={p.slug} className="pk-t" onClick={() => nav(`/professions/${p.slug}`)}>
                  <ProfIcon slug={p.slug} />
                  <span className="pk-tt"><b>{p.title}</b><span className="mono">{p.topics_count} {plural(p.topics_count, ["тема", "темы", "тем"])}</span></span>
                </button>
              ))}
              <button className="pk-t pk-more" onClick={() => nav("/catalog")}>
                <span className="pk-stack">{items.slice(0, 3).map((p) => <ProfIcon key={p.slug} slug={p.slug} />)}</span>
                <span className="pk-tt"><b>Все профессии</b><span className="mono">каталог →</span></span>
              </button>
            </div>
          </div>
          <button className="p3-card p3-quiz p3y" onClick={() => nav("/quiz")}>
            <span className="p3-h"><span className="p3-n">Пока не знаю</span><h3>Пройдите тест</h3><span className="muted p3-p">7 вопросов, и подберём профессию под вас.</span></span>
            <span className="p3-b">
              <span className="qz-prev">
                {items.slice(0, 3).map((p, i) => {
                  const m = [92, 84, 76][i];
                  return (
                    <span key={p.slug} className="qz-row" style={{ ["--w" as string]: `${m}%`, ["--d" as string]: `${i * 0.15}s` }}>
                      <ProfIcon slug={p.slug} small /><span className="qz-n">{p.title}</span><span className="qz-bar"><i /></span><span className="mono qz-p">{m}%</span>
                    </span>
                  );
                })}
              </span>
              <span className="qz-foot"><span className="qz-btn">Пройти тест →</span><span className="mono muted">≈ 2 минуты</span></span>
            </span>
          </button>
        </div>
      </section>

      <section className="section">
        <h2>Как это работает</h2>
        <p className="muted mt-8">Четыре шага от выбора профессии до плана. Нажмите на шаг, чтобы открыть пример экрана.</p>
        <div className="o-how">
          {steps.map(([t, d, to, l], i) => (
            <button key={t} className="o-how-step" onClick={() => nav(to)}>
              <span className="o-how-n">Шаг {i + 1}</span>
              <h3>{t}</h3><p>{d}</p>
              <div className="o-how-prev">{HOW_PREV[i]}</div>
              <span className="o-how-go">{l} →</span>
            </button>
          ))}
        </div>
      </section>

      <section className="section o-contact">
        <div className="o-contact-info">
          <div className="stack gap-8"><h2>Остались вопросы?</h2><p className="muted">Напишите нам, ответим на почту в течение рабочего дня.</p></div>
          <dl className="o-contacts">
            <div><dt>Почта</dt><dd>info@navigator-it.ru</dd></div>
            <div><dt>Telegram</dt><dd>@navigator_it</dd></div>
            <div><dt>Часы работы</dt><dd>Пн–Пт, 10:00–19:00 (МСК)</dd></div>
          </dl>
          <div className="o-social"><span className="muted fs-14">Мы в соцсетях:</span><span className="chip">ВКонтакте</span><span className="chip">Telegram-канал</span></div>
        </div>
        <ContactForm />
      </section>
    </>
  );
}
