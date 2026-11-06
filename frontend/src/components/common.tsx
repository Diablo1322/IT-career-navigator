import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import type { ApiError } from "../api/client";

export const Meter = ({ pct, good }: { pct: number; good?: boolean }) => (
  <div className="meter"><i className={good ? "bar-good" : undefined} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} /></div>
);

/** Ошибка загрузки: общее сообщение и «Повторить». */
export function LoadError({ error, retry }: { error: ApiError; retry: () => void }) {
  const nav = useNavigate();
  if (error.status === 404) return <NotFoundView />;
  return (
    <div className="panel stack narrow-panel">
      <h2>Не удалось загрузить</h2>
      <p className="muted">{error.status === 0 ? "Нет связи с сервером. Проверьте интернет." : error.message}</p>
      <div className="row"><button className="btn primary" onClick={retry}>Повторить</button><button className="btn ghost" onClick={() => nav("/")}>На главную</button></div>
    </div>
  );
}

export const Loading = ({ text = "Загружаем…" }: { text?: string }) => (
  <div className="panel stack narrow-panel" aria-busy="true"><span className="muted">{text}</span></div>
);

export function NotFoundView() {
  const nav = useNavigate();
  return (
    <div className="stack nf-wrap">
      <span className="mono nf-code">404</span>
      <h1>Страница не найдена</h1>
      <p className="muted">Возможно, ссылка устарела или в адресе опечатка.</p>
      <button className="btn primary" onClick={() => nav("/")}>На главную</button>
    </div>
  );
}

/** Раздел, которого ещё нет в API: честная заглушка в стиле прототипа. */
export function ComingSoon({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  const nav = useNavigate();
  return (
    <div className="panel stack narrow-panel">
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      <p className="muted">{children}</p>
      <span className="stub-note">Раздел в разработке — появится в следующей версии.</span>
      <div className="row mt-8"><button className="btn primary" onClick={() => nav("/catalog")}>Каталог профессий</button></div>
    </div>
  );
}

/** Склонение: plural(5, ["тема", "темы", "тем"]). */
export function plural(n: number, [one, few, many]: [string, string, string]): string {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
