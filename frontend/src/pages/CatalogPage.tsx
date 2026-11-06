import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { api, unwrap } from "../api/client";
import { LoadError, Loading } from "../components/common";
import { useLoad } from "../hooks/useLoad";

type Filter = "all" | "available" | "soon";

export function CatalogPage() {
  const nav = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const { data, error, loading, reload } = useLoad(() => unwrap(api.GET("/professions")), []);

  const q = query.trim().toLowerCase();
  const items = (data?.items ?? []).filter((p) => (filter === "all" || p.status === filter) && (!q || p.title.toLowerCase().includes(q)));

  return (
    <>
      <div className="page-head">
        <div><span className="eyebrow">Каталог</span><h1 className="mt-8">Профессии в IT</h1>
          <p className="muted">Карты тем составлены по требованиям вакансий для junior-специалистов. Откройте профессию, чтобы увидеть темы и материалы.</p></div>
      </div>
      <div className="row between mb-18">
        <div className="tabs m-0 inline-flex">
          {([["all", "Все"], ["available", "Доступные"], ["soon", "Скоро"]] as [Filter, string][]).map(([v, t]) => (
            <button key={v} className={`${filter === v ? "on" : ""} px-16`} onClick={() => setFilter(v)}>{t}</button>
          ))}
        </div>
        <div className="field search-field"><label htmlFor="catSearch" className="sr-only">Поиск по названию</label>
          <input id="catSearch" type="text" placeholder="Поиск по названию" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
      </div>
      {loading && !data ? <Loading /> : error ? <LoadError error={error} retry={reload} /> : items.length === 0 ? (
        <div className="panel stack narrow-panel"><h2>Ничего не нашлось</h2><p className="muted">Попробуйте другой запрос или фильтр.</p></div>
      ) : (
        <div className="grid3">
          {items.map((p) => {
            const live = p.status === "available";
            return (
              <button key={p.slug} className={"pcard" + (live ? "" : " stub")} onClick={() => live && nav(`/professions/${p.slug}`)} disabled={!live} aria-disabled={!live}>
                <div className="top-r">{live ? <span className="chip good">Доступно</span> : <span className="chip">Скоро</span>}</div>
                <div className="stack gap-6"><h3>{p.title}</h3>{p.description && <p className="muted fs-14">{p.description}</p>}</div>
                <dl className="pc-stats">
                  <dt>Блоков</dt><dd>{p.blocks_count}</dd>
                  <dt>Тем</dt><dd>{p.topics_count}</dd>
                </dl>
                <span className="pc-go">{live ? "Открыть карту →" : "Сообщим о запуске"}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
