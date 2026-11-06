import { useNavigate } from "react-router-dom";

import type { Loaded } from "../../hooks/useLoad";
import type { Match } from "../../api/client";
import { Meter, plural } from "../../components/common";

// «ноябрь 2026» — без «г.», чтобы предложение заканчивалось одной точкой.
const fmtPeriod = (d: string) => {
  const date = new Date(d + "T00:00:00");
  return `${date.toLocaleDateString("ru-RU", { month: "long" })} ${date.getFullYear()}`;
};

/** Блок «Соответствие вакансиям» в виде краткого отчёта из прототипа. */
export function MatchPanel({ title, match, authed, onOpenTopic, loginTo }: {
  title: string;
  match: Loaded<Match>;
  authed: boolean;
  onOpenTopic: (topicId: number) => void;
  loginTo: string;
}) {
  const nav = useNavigate();
  const head = (pct: number | null, text: React.ReactNode) => (
    <div className="row gap-24 items-center nowrap gap-head">
      <div className="ring" style={{ ["--p" as string]: pct ?? 0 }}><b>{pct === null ? "—" : `${Math.round(pct)}%`}</b></div>
      <div className="stack gap-6 min-0"><span className="eyebrow">Соответствие вакансиям</span><h3>{title}, junior</h3><p className="muted fs-14">{text}</p></div>
    </div>
  );

  if (!authed) {
    return (
      <div className="panel" id="match">
        <div className="stack gap-24">
          {head(null, "Войдите и отмечайте изученные темы — покажем, на сколько процентов вы уже соответствуете требованиям вакансий и каких навыков не хватает.")}
          <div><button className="btn primary" onClick={() => nav(loginTo)}>Войти и узнать свой процент</button></div>
        </div>
      </div>
    );
  }
  if (match.loading && !match.data) return <div className="panel" id="match"><span className="muted">Считаем соответствие…</span></div>;
  if (match.error) {
    return (
      <div className="panel stack" id="match">
        <h3>Соответствие вакансиям</h3><p className="muted">{match.error.message}</p>
        <div><button className="btn ghost sm" onClick={match.reload}>Повторить</button></div>
      </div>
    );
  }
  const m = match.data;
  if (!m || !m.snapshot || m.percent === null) {
    return (
      <div className="panel" id="match">
        {head(null, "Данные о вакансиях по этой профессии ещё собираются. Процент соответствия появится после первой загрузки вакансий.")}
      </div>
    );
  }

  const s = m.snapshot;
  return (
    <div className="panel" id="match">
      <div className="stack gap-24">
        {head(m.percent, <>Сравнили изученные темы с требованиями {s.vacancy_count} {plural(s.vacancy_count, ["вакансии", "вакансий", "вакансий"])} junior за {fmtPeriod(s.period)}. Процент рядом с навыком показывает, в какой доле вакансий он встречается.</>)}
        {s.preliminary && <div className="warn"><b>!</b><span>Предварительная оценка: вакансий пока меньше 200, цифры уточнятся после следующих загрузок.</span></div>}
        <div className="stack">
          <div className="row"><h3>Чего не хватает больше всего</h3><span className="chip gap">{m.missing.length}</span>
            <span className="chip good">закрыто {m.key_skills_covered} из {m.key_skills_total}</span></div>
          {m.missing.length === 0 ? <p className="muted">Все ключевые навыки закрыты — отличный результат.</p> : (
            <div className="skills">
              {m.missing.map((sk) => (
                <div key={sk.skill_id} className="skill miss">
                  <span className="stack gap-4 min-0">
                    <span>{sk.name}{sk.level > 0 && <span className="muted fs-13"> · частично</span>}</span>
                    <span className="row gap-6">{sk.topics.map((t) => (
                      <button key={t.id} className="btn link fs-13" onClick={() => onOpenTopic(t.id)}>{t.studied ? "✓ " : ""}{t.title}</button>
                    ))}</span>
                  </span>
                  <Meter pct={sk.weight * 100} />
                  <span className="pct">{Math.round(sk.weight * 100)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
