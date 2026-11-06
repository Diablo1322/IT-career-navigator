import { useEffect, useRef } from "react";

import type { Block, Topic } from "../../api/client";
import { plural } from "../../components/common";

const RES_TYPE: Record<string, string> = { article: "Статья", video: "Видео", course: "Курс", docs: "Документация", practice: "Практика" };

export type Selection = { blockId: number; topicId?: number } | null;

/** Боковая панель темы или блока — как в прототипе. */
export function TopicDrawer({ sel, blocks, authed, busy, onClose, onSelect, onToggle, onLogin }: {
  sel: Selection;
  blocks: Block[];
  authed: boolean;
  busy: boolean;
  onClose: () => void;
  onSelect: (s: Selection) => void;
  onToggle: (t: Topic) => void;
  onLogin: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = sel !== null;
  useEffect(() => { if (open) closeRef.current?.focus(); }, [open, sel?.topicId, sel?.blockId]);

  const block = sel ? blocks.find((b) => b.id === sel.blockId) : undefined;
  const topic = sel?.topicId !== undefined ? block?.topics.find((t) => t.id === sel.topicId) : undefined;

  let body: React.ReactNode = null;
  if (block && topic) {
    body = (
      <>
        <div className="stack gap-8 pr-36">
          <span className="eyebrow">{block.title}</span><h2>{topic.title}</h2>
          <div className="row gap-6">
            {topic.studied && <span className="chip good">Изучено</span>}
            {topic.optional && <span className="chip">Не обязательно для junior</span>}
          </div>
        </div>
        <p>{topic.description ?? "Описание темы появится позже."}</p>
        <div className="grid2 cols-2 gap-14">
          <div className="stack gap-6"><span className="eyebrow">Время</span><b className="mono">≈ {topic.hours} ч</b></div>
          <div className="stack gap-6"><span className="eyebrow">Материалы</span><b className="mono">{topic.resources.length}</b></div>
        </div>
        <div className="stack gap-8"><span className="eyebrow">Материалы для изучения</span>
          {topic.resources.length === 0 ? <span className="muted fs-14">Команда ещё подбирает материалы к этой теме.</span> : (
            <div className="res">
              {topic.resources.map((r) => (
                <a key={r.id} href={/^https?:\/\//.test(r.url) ? r.url : "#"} target="_blank" rel="noopener noreferrer">
                  <span className="chip accent">{RES_TYPE[r.type] ?? r.type}</span><span className="grow min-0">{r.title}</span>
                  <span className="mono muted fs-12">{r.language.toUpperCase()}</span>
                  {r.is_free ? <span className="chip good">Бесплатно</span> : <span className="chip">Платно</span>}
                </a>
              ))}
            </div>
          )}
        </div>
        <div className="stack gap-10 mt-auto">
          {authed ? (
            <button className={"btn " + (topic.studied ? "ghost" : "primary")} disabled={busy} onClick={() => onToggle(topic)}>
              {busy ? "Сохраняем…" : topic.studied ? "Изучено ✓ (снять отметку)" : "Изучено"}
            </button>
          ) : (
            <>
              <button className="btn primary" onClick={onLogin}>Изучено</button>
              <span className="muted fs-13">Чтобы отметки сохранялись, нужно войти.</span>
            </>
          )}
        </div>
      </>
    );
  } else if (block) {
    const studied = block.topics.filter((t) => t.studied).length;
    const hours = block.topics.reduce((s, t) => s + t.hours, 0);
    body = (
      <>
        <div className="stack gap-8 pr-36"><span className="eyebrow">Блок</span><h2>{block.title}</h2>
          {authed && <div className="row gap-6"><span className={"chip" + (studied === block.topics.length ? " good" : "")}>Изучено {studied} из {block.topics.length}</span></div>}
        </div>
        <div className="grid2 cols-2 gap-14">
          <div className="stack gap-6"><span className="eyebrow">Время</span><b className="mono">≈ {hours} ч</b></div>
          <div className="stack gap-6"><span className="eyebrow">Темы</span><b className="mono">{block.topics.length} {plural(block.topics.length, ["тема", "темы", "тем"])}</b></div>
        </div>
        <div className="stack gap-6"><span className="eyebrow">Что входит</span>
          <div className="row gap-6">{block.topics.map((t) => (
            <button key={t.id} className={"chip chip-btn" + (t.studied ? " good" : "")} onClick={() => onSelect({ blockId: block.id, topicId: t.id })}>{t.title}</button>
          ))}</div>
        </div>
      </>
    );
  }

  return (
    <div className={"drawer" + (open ? " open" : "")} aria-hidden={!open} role="dialog" aria-label={topic?.title ?? block?.title ?? "Тема"}>
      <button ref={closeRef} className="x" aria-label="Закрыть" onClick={onClose}>×</button>
      {body}
    </div>
  );
}
