import type { Block } from "../../api/client";

export type RmNode = {
  key: string;
  kind: "main" | "sub";
  blockId: number;
  topicId?: number;
  x: number; y: number; w: number; h: number;
};

/**
 * Раскладка карты как в прототипе: блоки — по центральной оси,
 * темы блока — по бокам (первая половина слева, вторая справа).
 */
export function roadmapLayout(blocks: Block[]) {
  const W = 960, MW = 230, MX = (W - MW) / 2, MH = 50, SW = 210, SX_L = 24, SX_R = W - 24 - SW, SH = 40, SG = 10, PAD = 40;
  let y = PAD;
  const nodes: RmNode[] = [];
  const lines: string[] = [];
  let prev: { y: number; h: number } | null = null;

  for (const b of blocks) {
    const half = Math.ceil(b.topics.length / 2);
    const L = b.topics.slice(0, half), R = b.topics.slice(half);
    const sideH = (k: number) => (k ? k * SH + (k - 1) * SG : 0);
    const rowH = Math.max(MH, sideH(L.length), sideH(R.length));
    const my = y + (rowH - MH) / 2;
    nodes.push({ key: `b${b.id}`, kind: "main", blockId: b.id, x: MX, y: my, w: MW, h: MH });
    if (prev) lines.push(`M${W / 2} ${prev.y + prev.h} L${W / 2} ${my}`);
    prev = { y: my, h: MH };

    for (const [arr, sx, left] of [[L, SX_L, true], [R, SX_R, false]] as const) {
      let sy = y + (rowH - sideH(arr.length)) / 2;
      for (const t of arr) {
        nodes.push({ key: `b${b.id}t${t.id}`, kind: "sub", blockId: b.id, topicId: t.id, x: sx, y: sy, w: SW, h: SH });
        const x1 = left ? MX : MX + MW, y1 = my + MH / 2, x2 = left ? sx + SW : sx, y2 = sy + SH / 2, cx = (x1 + x2) / 2;
        lines.push(`sub:M${x1} ${y1} C${cx} ${y1} ${cx} ${y2} ${x2} ${y2}`);
        sy += SH + SG;
      }
    }
    y += rowH + 34;
  }
  return { W, H: y + PAD - 34, nodes, lines };
}
