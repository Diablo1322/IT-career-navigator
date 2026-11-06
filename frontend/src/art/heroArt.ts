// Изометрическая иллюстрация главной страницы — перенесена из прототипа без изменений логики.
// Возвращает статичную SVG-разметку (данные пользователя и API в неё не попадают).

type V3 = [number, number, number];
type V2 = [number, number];

const ISO_DEFS = `<defs>
  <linearGradient id="isoAT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9DB4FF"/><stop offset="1" stop-color="#5B7CFA"/></linearGradient>
  <linearGradient id="isoAL" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4F6EF0"/><stop offset="1" stop-color="#3550C8"/></linearGradient>
  <linearGradient id="isoAR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A56D0"/><stop offset="1" stop-color="#263C9E"/></linearGradient>
  <linearGradient id="isoGT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7BE0B0"/><stop offset="1" stop-color="#3FB984"/></linearGradient>
  <linearGradient id="isoYT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFE9A0"/><stop offset="1" stop-color="#F5C84C"/></linearGradient>
  <linearGradient id="isoScr" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1B2650"/><stop offset="1" stop-color="#0E1430"/></linearGradient>
  <linearGradient id="isoRoute" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#7090FF"/><stop offset=".6" stop-color="#9B8CFF"/><stop offset="1" stop-color="#F5C84C"/></linearGradient>
  <radialGradient id="isoHalo"><stop offset="0" stop-color="#7090FF" stop-opacity=".55"/><stop offset="1" stop-color="#7090FF" stop-opacity="0"/></radialGradient>
  <radialGradient id="isoHaloY"><stop offset="0" stop-color="#F5C84C" stop-opacity=".6"/><stop offset="1" stop-color="#F5C84C" stop-opacity="0"/></radialGradient>
  <filter id="isoGlow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`;

const C = 0.866;
const P = (x: number, y: number, z: number): V2 => [(x - y) * C, (x + y) * 0.5 - z];
const f1 = (n: number) => n.toFixed(1);

function scene() {
  const out: string[] = [];
  const all: V2[] = [];
  const extra: V2[] = [];
  const add = (svg: string, ps?: V3[]) => { out.push(svg); ps?.forEach((p) => all.push(P(...p))); };
  const pts = (a: V3[]) => a.map((p) => P(...p).map(f1).join(",")).join(" ");
  const poly = (a: V3[], cls: string) => add(`<polygon class="${cls}" points="${pts(a)}"/>`, a);
  const box = (x: number, y: number, z: number, w: number, d: number, h: number, c: string) => {
    poly([[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], c + " l");
    poly([[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], c + " r");
    poly([[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], c + " t");
  };
  const quadTop = (x: number, y: number, z: number, w: number, d: number, c: string) =>
    poly([[x, y, z], [x + w, y, z], [x + w, y + d, z], [x, y + d, z]], c);
  const quadFront = (x: number, y: number, z: number, w: number, h: number, c: string) =>
    poly([[x, y, z], [x + w, y, z], [x + w, y, z + h], [x, y, z + h]], c);
  const raw = (svg: string, ps?: V3[]) => add(svg, ps);
  const done = (pad = 16) => {
    all.push(...extra.splice(0));
    const xs = all.map((p) => p[0]), ys = all.map((p) => p[1]);
    const x0 = Math.min(...xs) - pad, y0 = Math.min(...ys) - pad;
    const w = Math.max(...xs) - x0 + pad, h = Math.max(...ys) - y0 + pad;
    return `<svg class="iso" viewBox="${x0.toFixed(0)} ${y0.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}">${ISO_DEFS}${out.join("")}</svg>`;
  };
  return { box, quadTop, quadFront, raw, done, extra };
}

function route(): string {
  const s = scene();
  const halo = (x: number, y: number, z: number, r: number, id: string) => {
    const [hx, hy] = P(x, y, z);
    s.raw(`<ellipse cx="${f1(hx)}" cy="${f1(hy)}" rx="${r * 1.25}" ry="${r * 0.75}" fill="url(#${id})"/>`);
  };
  // карточка с графиком сзади слева
  s.box(-150, -10, 40, 92, 92, 6, "s");
  ([[-138, 2, 30, "k"], [-114, 2, 56, "a"], [-90, 2, 40, "k"], [-138, 36, 20, "k"], [-114, 36, 70, "a"], [-90, 36, 46, "k"]] as [number, number, number, string][])
    .sort((p, q) => p[0] + p[1] - (q[0] + q[1]))
    .forEach(([x, y, h, c]) => s.box(x, y, 46, 16, 16, h, c));
  // ноутбук
  s.box(0, 60, 0, 220, 150, 8, "s");
  for (let r = 0; r < 4; r++) for (let k = 0; k < 12; k++) s.quadTop(14 + k * 16.6, 76 + r * 15, 8.2, 12.4, 11, "key");
  s.quadTop(80, 140, 8.2, 70, 40, "pad");
  s.box(0, 52, 8, 220, 8, 150, "s");
  s.quadFront(8, 60, 15, 204, 136, "scr");
  halo(110, 60, 90, 90, "isoHalo");
  s.quadFront(18, 60.5, 134, 184, 6, "ln m");
  s.quadFront(18, 60.6, 135, 26, 4, "ln a");
  ([[0.92, "g"], [0.8, "g"], [0.48, "a"], [0.3, "k"], [0.18, "k"]] as [number, string][]).forEach(([p, c], i) => {
    const z = 114 - i * 20;
    s.quadFront(18, 60.6, z, 11, 11, "ln " + c);
    s.quadFront(36, 60.6, z + 3, 112, 6, "trk");
    s.quadFront(36, 60.7, z + 3, 112 * p, 6, "ln " + c);
  });
  [30, 52, 40, 72, 58].forEach((h, i) => s.quadFront(160 + i * 9, 60.6, 26, 6, h, "ln " + (i === 3 ? "a" : "k")));
  // маршрут от экрана к цели
  const A: V3 = [214, 60, 118], B: V3 = [318, -150, 262], N = 5;
  const R: V3[] = [...Array(N)].map((_, k) => A.map((a, d) => a + ((B[d] - a) * k) / (N - 1)) as V3);
  const pr = R.map((p) => P(...p));
  s.raw(`<line class="route-glow" x1="${f1(pr[0][0])}" y1="${f1(pr[0][1])}" x2="${f1(pr[N - 1][0])}" y2="${f1(pr[N - 1][1])}"/>`, R);
  for (let k = 0; k < N - 1; k++) {
    const [x0, y0] = pr[k], [x1, y1] = pr[k + 1];
    s.raw(`<line class="route" x1="${f1(x0)}" y1="${f1(y0)}" x2="${f1(x1)}" y2="${f1(y1)}"/>`);
  }
  const mp = `M${pr.map((p) => f1(p[0]) + "," + f1(p[1])).join(" L")}`;
  s.raw(`<circle r="7" class="spark"><animateMotion dur="3.6s" repeatCount="indefinite" path="${mp}" keyPoints="0;1;1" keyTimes="0;.62;1" calcMode="linear"/><animate attributeName="opacity" values="0;1;1;0;0" keyTimes="0;.06;.58;.68;1" dur="3.6s" repeatCount="indefinite"/></circle>`);
  // узлы-навыки поверх линии
  ([[R[1], "g"], [R[2], "g"], [R[3], "a"]] as [V3, string][]).forEach(([[x, y, z], c]) => {
    if (c === "a") halo(x, y, z, 30, "isoHalo");
    s.box(x - 14, y - 14, z - 14, 28, 28, 28, c);
  });
  // цель
  const [tx, ty, tz] = R[4];
  halo(tx, ty, tz + 10, 60, "isoHaloY");
  s.box(tx - 38, ty - 38, tz - 16, 76, 76, 12, "s");
  s.box(tx - 16, ty - 16, tz - 4, 32, 32, 36, "y");
  const [fx, fy] = P(tx, ty, tz + 32), [gx, gy] = P(tx, ty, tz + 96);
  s.raw(`<line class="pole" x1="${fx}" y1="${fy}" x2="${gx}" y2="${gy}"/><path class="flag" d="M${gx},${gy} q20,-5 42,8 q-20,10 -42,17z"/>`, [[tx, ty, tz + 106]]);
  // подписи-плашки над узлами
  const tag = (x: number, y: number, z: number, t: string, c: string) => {
    const [lx, ly] = P(x, y, z);
    const w = t.length * 9.2 + 28;
    s.raw(`<g class="tag ${c}" transform="translate(${f1(lx - w / 2)},${f1(ly - 32)})"><rect width="${w}" height="28" rx="14"/><text x="${w / 2}" y="19" text-anchor="middle">${t}</text></g>`, [[x, y, z + 40]]);
  };
  tag(R[1][0], R[1][1], R[1][2] + 30, "HTML ✓", "done");
  tag(R[2][0], R[2][1], R[2][2] + 30, "JS ✓", "done");
  tag(R[3][0], R[3][1], R[3][2] + 30, "React", "now");
  {
    const [gx2, gy2] = P(tx, ty, tz - 16);
    const w = 88;
    s.raw(`<g class="tag goal" transform="translate(${f1(gx2 + 36)},${f1(gy2 - 6)})"><rect width="${w}" height="30" rx="15"/><text x="${w / 2}" y="20" text-anchor="middle">Junior</text></g>`);
    s.extra.push([gx2 + 36 + w + 6, gy2 - 10], [gx2 + 36 + w + 6, gy2 + 30]);
  }
  return s.done(10);
}

const BADGES = `<span class="art-b t1 lg-js s1">JS</span><span class="art-b t2 lg-ts s1">TS</span><span class="art-b t3 lg-re s1"><svg viewBox="-12 -12 24 24" width="62%" height="62%"><g fill="none" stroke="#61DAFB" stroke-width="1.3"><ellipse rx="10" ry="4"/><ellipse rx="10" ry="4" transform="rotate(60)"/><ellipse rx="10" ry="4" transform="rotate(120)"/></g><circle r="2" fill="#61DAFB"/></svg></span><span class="art-b t4 lg-py s1"><svg viewBox="0 0 24 24" width="52%" height="52%"><path d="M11.9 2C7 2 7.3 4.1 7.3 4.1v2.2h4.7v.7H5.4S2 6.6 2 11.9s2.9 5.1 2.9 5.1h1.8v-2.5s-.1-2.9 2.9-2.9h4.9s2.8 0 2.8-2.7V4.5S17.7 2 11.9 2zM9.2 3.6a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8z" fill="#3776AB"/><path d="M12.1 22c4.9 0 4.6-2.1 4.6-2.1v-2.2H12v-.7h6.6s3.4.4 3.4-4.9-2.9-5.1-2.9-5.1h-1.8v2.5s.1 2.9-2.9 2.9H9.5s-2.8 0-2.8 2.7v4.4S6.3 22 12.1 22zm2.7-1.6a.9.9 0 1 1 0-1.8.9.9 0 0 1 0 1.8z" fill="#FFD43B"/></svg></span><span class="art-b t5 lg-html s2"><svg viewBox="0 0 24 24" width="54%" height="54%"><path d="M3 2h18l-1.6 18L12 22l-7.4-2z" fill="#E8A33D"/><path d="M12 3.5v16.9l6-1.7 1.4-15.2z" fill="#F2B65A"/><text x="12" y="16" text-anchor="middle" font-family="Arial" font-weight="700" font-size="10" fill="#fff">5</text></svg></span><span class="art-b t6 lg-css s2"><svg viewBox="0 0 24 24" width="54%" height="54%"><path d="M3 2h18l-1.6 18L12 22l-7.4-2z" fill="#2965F1"/><path d="M12 3.5v16.9l6-1.7 1.4-15.2z" fill="#3B82F6"/><text x="12" y="16" text-anchor="middle" font-family="Arial" font-weight="700" font-size="10" fill="#fff">3</text></svg></span><span class="art-b t7 lg-node s2"><svg viewBox="0 0 24 24" width="56%" height="56%"><path d="M12 1.8l8.8 5.1v10.2L12 22.2l-8.8-5.1V6.9z" fill="#5FA04E"/><text x="12" y="15.6" text-anchor="middle" font-family="Arial" font-weight="700" font-size="8" fill="#fff">JS</text></svg></span><span class="art-b t8 lg-dock s2"><svg viewBox="0 0 24 24" width="60%" height="60%"><g fill="#2496ED"><rect x="3" y="10" width="3.2" height="3" rx=".4"/><rect x="6.8" y="10" width="3.2" height="3" rx=".4"/><rect x="10.6" y="10" width="3.2" height="3" rx=".4"/><rect x="6.8" y="6.5" width="3.2" height="3" rx=".4"/><rect x="10.6" y="6.5" width="3.2" height="3" rx=".4"/><rect x="10.6" y="3" width="3.2" height="3" rx=".4"/><rect x="14.4" y="10" width="3.2" height="3" rx=".4"/><path d="M1.5 14h19.6c.9-1.2 1.9-1.6 2.4-1.5-.4-1.3-1.6-1.8-2.6-1.6-.3-1.2-1.2-2-1.2-2s-1.2 1.2-.9 3.1H1.5c-.3 4.4 3 7.2 8.6 7.2 6 0 9.5-2.6 11-5.2"/></g></svg></span><span class="art-b t9 lg-go s3"><b>GO</b></span><span class="art-b t10 lg-kt s3"><svg viewBox="0 0 24 24" width="50%" height="50%"><defs><linearGradient id="ktG" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#7F52FF"/><stop offset=".5" stop-color="#C711E1"/><stop offset="1" stop-color="#E9A23B"/></linearGradient></defs><path d="M2 2h20L12 12l10 10H2z" fill="url(#ktG)"/></svg></span><span class="art-b t11 lg-sql s3">SQL</span><span class="art-b t12 lg-git s3">git</span>`;

let cached: string | null = null;

/** Внутренняя разметка блока .o-art.iso-art. */
export function heroArtHtml(): string {
  cached ??= route() + BADGES;
  return cached;
}
