import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { api, ApiError, unwrap, type Block, type Topic } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { LoadError, Loading, plural } from "../components/common";
import { useToast } from "../components/Toast";
import { MatchPanel } from "../features/profession/MatchPanel";
import { roadmapLayout, type RmNode } from "../features/profession/roadmapLayout";
import { TopicDrawer, type Selection } from "../features/profession/TopicDrawer";
import { useLoad } from "../hooks/useLoad";

function nodeClass(kind: "main" | "sub", done: boolean, optional: boolean, selected: boolean) {
  let cls = `node ${kind}`;
  if (done) cls += " done";
  else if (kind === "sub" && optional) cls += " optn";
  if (selected) cls += " sel";
  return cls;
}

export function ProfessionPage() {
  const { slug = "" } = useParams();
  const { user, forget } = useAuth();
  const nav = useNavigate();
  const { pathname, hash } = useLocation();
  const toast = useToast();
  const [sel, setSel] = useState<Selection>(null);
  const [busy, setBusy] = useState(false);

  const detail = useLoad(() => unwrap(api.GET("/professions/{slug}", { params: { path: { slug } } })), [slug, user?.id]);
  const match = useLoad(user ? () => unwrap(api.GET("/professions/{slug}/match", { params: { path: { slug } } })) : null, [slug, user?.id]);

  const p = detail.data;
  const blocks = useMemo(() => p?.blocks ?? [], [p]);
  const layout = useMemo(() => roadmapLayout(blocks), [blocks]);
  const loginTo = `/auth?tab=login&next=${encodeURIComponent(pathname)}`;

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setSel(null); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, []);

  // Переход по ссылке «…#match» — прокрутить к блоку соответствия.
  useEffect(() => {
    if (hash === "#match" && p) document.getElementById("match")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [hash, p]);

  const findTopic = useCallback((topicId: number): Selection => {
    const b = blocks.find((x) => x.topics.some((t) => t.id === topicId));
    return b ? { blockId: b.id, topicId } : null;
  }, [blocks]);

  const toggle = async (t: Topic) => {
    setBusy(true);
    try {
      const req = { params: { path: { id: t.id } } };
      await unwrap(t.studied ? api.DELETE("/topics/{id}/progress", req) : api.PUT("/topics/{id}/progress", req));
      // Тема может стоять в нескольких блоках и профессиях — перезапрашиваем карточку и процент.
      detail.reload();
      match.reload();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) { forget(); nav(loginTo); return; }
      toast(e instanceof ApiError ? e.message : "Не удалось сохранить отметку");
    } finally {
      setBusy(false);
    }
  };

  if (detail.loading && !p) return <Loading />;
  if (detail.error && !p) return <LoadError error={detail.error} retry={detail.reload} />;
  if (!p) return null;

  const pr = p.progress;
  const pct = pr && pr.total ? Math.round((pr.studied / pr.total) * 100) : 0;
  const snapshot = match.data?.snapshot;
  const isSel = (n: { blockId: number; topicId?: number }) => sel?.blockId === n.blockId && sel?.topicId === n.topicId;
  const blockDone = (b: Block) => b.topics.length > 0 && b.topics.every((t) => t.studied);

  const renderNode = (n: RmNode, style?: React.CSSProperties) => {
    const b = blocks.find((x) => x.id === n.blockId)!;
    if (n.kind === "main") {
      return <button key={n.key} style={style} className={nodeClass("main", blockDone(b), false, isSel(n))} onClick={() => setSel({ blockId: b.id })}>{b.title}</button>;
    }
    const t = b.topics.find((x) => x.id === n.topicId)!;
    return <button key={n.key} style={style} className={nodeClass("sub", t.studied, t.optional, isSel(n))} onClick={() => setSel({ blockId: b.id, topicId: t.id })}>{t.title}</button>;
  };
  const hours = blocks.reduce((s, b) => s + b.topics.reduce((h, t) => h + t.hours, 0), 0);

  return (
    <>
      <div className="page-head mb-18">
        <div>
          <div className="row"><span className="eyebrow">Карточка профессии</span><span className="chip">Базовый режим</span></div>
          <h1 className="mt-8">{p.title}</h1>
          <p className="muted">{p.for_whom ? `Кому подходит: ${p.for_whom.charAt(0).toLowerCase()}${p.for_whom.slice(1)} ` : ""}Нажмите на тему, чтобы открыть описание и материалы.</p>
          <div className="row mt-12 gap-8">
            <span className="chip">Блоков: <b className="mono">{blocks.length}</b></span>
            <span className="chip">Тем: <b className="mono">{pr?.total ?? blocks.reduce((s, b) => s + b.topics.length, 0)}</b></span>
            <span className="chip">Всего учиться: <b className="mono">≈ {Math.round(hours)} ч</b></span>
            {snapshot && <span className="chip">Вакансий проанализировано: <b className="mono">{snapshot.vacancy_count}</b></span>}
          </div>
        </div>
        <div className="row"><button className="btn primary" onClick={() => document.getElementById("match")?.scrollIntoView({ behavior: "smooth" })}>Узнать мои пробелы</button></div>
      </div>

      <div className="rm-bar">
        <div className="row gap-10 nowrap grow min-220">
          <b className="mono fs-14">{pct}%</b>
          <div className="meter grow"><i className="bar-good" style={{ width: `${pct}%` }} /></div>
          <span className="muted mono fs-13 no-wrap">{pr ? `${pr.studied} из ${pr.total} ${plural(pr.total, ["темы", "тем", "тем"])} изучено` : `0 из ${blocks.reduce((s, b) => s + b.topics.length, 0)} изучено`}</span>
        </div>
        {!user && <span className="muted fs-13">Войдите, чтобы отмечать изученное</span>}
      </div>
      <div className="legend mb-14">
        <span><i className="sw-known" />Изучено</span>
        <span><i className="lg-opt" />Не обязательно для junior</span>
      </div>

      <div className="rm-scroll">
        <div className="rm" style={{ width: layout.W, height: layout.H }}>
          <svg width={layout.W} height={layout.H} viewBox={`0 0 ${layout.W} ${layout.H}`} aria-hidden="true">
            {layout.lines.map((d, i) => d.startsWith("sub:")
              ? <path key={i} d={d.slice(4)} stroke="var(--spine)" strokeWidth="1.6" strokeDasharray="1 5" strokeLinecap="round" fill="none" />
              : <path key={i} d={d} stroke="var(--spine)" strokeWidth="3" fill="none" />)}
          </svg>
          {layout.nodes.map((n) => renderNode(n, { left: n.x, top: n.y, width: n.w, height: n.h }))}
        </div>
      </div>
      <div className="rm-list">
        {blocks.map((b) => (
          <div key={b.id} className="rl-step">
            {renderNode({ key: `lb${b.id}`, kind: "main", blockId: b.id, x: 0, y: 0, w: 0, h: 0 })}
            {b.topics.length > 0 && <div className="rl-subs">{b.topics.map((t) => renderNode({ key: `lb${b.id}t${t.id}`, kind: "sub", blockId: b.id, topicId: t.id, x: 0, y: 0, w: 0, h: 0 }))}</div>}
          </div>
        ))}
      </div>
      <p className="muted fs-13 mt-10 mb-20">Темы и материалы — черновик команды, уточняются.</p>

      <MatchPanel title={p.title} match={match} authed={Boolean(user)} loginTo={loginTo}
        onOpenTopic={(id) => setSel(findTopic(id))} />

      <TopicDrawer sel={sel} blocks={blocks} authed={Boolean(user)} busy={busy}
        onClose={() => setSel(null)} onSelect={setSel} onToggle={toggle} onLogin={() => nav(loginTo)} />
    </>
  );
}
