import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";

import { DOCS } from "../content/docs";

const DOC_NAV: [string, string][] = [
  ["/policy", "Политика конфиденциальности"], ["/terms", "Пользовательское соглашение"],
  ["/consent", "Согласие на обработку данных"], ["/about", "О проекте"],
];

function DocNav({ cur }: { cur: string }) {
  const nav = useNavigate();
  return (
    <nav className="doc-nav" aria-label="Информация">
      <span className="eyebrow">Информация</span>
      {DOC_NAV.map(([to, t]) => <button key={to} className={cur === to ? "on" : ""} onClick={() => nav(to)}>{t}</button>)}
    </nav>
  );
}

/** Внутренние ссылки в статичном тексте документа открываем без перезагрузки. */
function useInnerLinks() {
  const nav = useNavigate();
  return (e: MouseEvent<HTMLElement>) => {
    const a = (e.target as HTMLElement).closest("a");
    const href = a?.getAttribute("href");
    if (href?.startsWith("/")) { e.preventDefault(); nav(href); }
  };
}

export function DocPage({ id }: { id: keyof typeof DOCS }) {
  const d = DOCS[id];
  const onClick = useInnerLinks();
  let n = 0;
  return (
    <div className="doc">
      <DocNav cur={`/${id}`} />
      <article className="doc-body" onClick={onClick}>
        <h1>{d.t}</h1><p className="doc-date">Редакция от 1 октября 2026</p>
        {d.s.map(([h, html], i) => (
          <section key={i}>
            {h && <h2>{++n}. {h}</h2>}
            {/* Статичный текст документа из content/docs.ts. */}
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </section>
        ))}
      </article>
    </div>
  );
}

export function AboutPage() {
  return (
    <div className="doc">
      <DocNav cur="/about" />
      <article className="doc-body">
        <h1>О проекте</h1>
        <p className="mt-12">«Карьерный навигатор IT» (IT Career Navigator) помогает понять, чего не хватает до первой работы в IT, и составить план, как это закрыть.</p>
        <section><h2>Зачем</h2><p>Новички часто учат то, что попалось в случайном курсе, а не то, что просят работодатели. Мы сравниваем навыки с требованиями вакансий junior в России и показываем разрыв: что уже есть, чего не хватает и сколько времени займёт обучение.</p></section>
        <section><h2>Как это работает</h2><ul><li>Выбираете профессию в каталоге или по тесту профориентации.</li><li>Проходите оценку навыков, около 10 минут.</li><li>Получаете процент соответствия и список пробелов.</li><li>Учитесь по персональному плану со сроками.</li></ul></section>
        <section><h2>Команда</h2><p>Проект делает команда студентов Уфимского университета науки и технологий (УУНиТ).</p></section>
        <section><h2>Контакты</h2><p>info@navigator-it.ru<br />Telegram: @navigator_it<br /><span className="muted">Пн–Пт, 10:00–19:00 (МСК)</span></p></section>
      </article>
    </div>
  );
}
