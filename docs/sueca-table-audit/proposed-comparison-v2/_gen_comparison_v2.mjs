/**
 * CURRENT vs PROPOSED V2 Sueca portrait geometry comparison SVGs.
 * Audit-only. Does not modify runtime.
 * V2 = numeric iteration of V1 proposal (same architecture, adjusted sizes).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
mkdirSync(__dir, { recursive: true });

const SW = 390;
const SH = 844;

/** CURRENT — from calculateSceneGeometry @ 390×844 scale=1 (unchanged) */
const CUR = {
  hud: { x: 0, y: 0, w: 390, h: 118.16 },
  felt: { x: 0, y: 118.16, w: 390, h: 388.24 },
  n: { x: 117, y: 118.16, w: 156, h: 85.41 },
  w: { x: 7.8, y: 234.63, w: 85.8, h: 139.77 },
  e: { x: 296.4, y: 234.63, w: 85.8, h: 139.77 },
  s: { x: 113.1, y: 506.4, w: 163.8, h: 84.4 },
  trick: { x: 97.94, y: 215.22, w: 194.12, h: 194.12 },
  decision: { x: 85.8, y: 420.99, w: 218.4, h: 85.41 },
  sheet: { x: 0, y: 118.16, w: 390, h: 452.38 },
  hand: { x: 0, y: 590.8, w: 390, h: 168.8 },
  handI: { x: 15.6, y: 570.54, w: 358.8, h: 209.31 },
  action: { x: 0, y: 759.6, w: 390, h: 84.4 },
  statusPlaque: null,
  card: { w: 58.39, h: 81.74, tw: 53.28, th: 74.59, ow: 37.33, oh: 52.26, lift: 26, dx: 43, dy: 41 }
};

/**
 * PROPOSED V1 (reference only — for fit dump comparison)
 * Exact numbers from first proposal prompt.
 */
const V1 = {
  hud: { x: 0, y: 0, w: 390, h: 64 },
  felt: { x: 12, y: 68, w: 366, h: 648 },
  n: { x: 66, y: 82, w: 258, h: 72 },
  w: { x: 20, y: 222, w: 48, h: 230 },
  e: { x: 322, y: 222, w: 48, h: 230 },
  s: { x: 122, y: 640, w: 146, h: 32 },
  trick: { x: 118, y: 304, w: 154, h: 178 },
  decision: { x: 25, y: 283, w: 340, h: 220 },
  sheet: { x: 25, y: 243, w: 340, h: 300 },
  statusPlaque: { x: 45, y: 337, w: 300, h: 112 },
  hand: { x: 8, y: 678, w: 374, h: 122 },
  handI: { x: 8, y: 678, w: 374, h: 122 },
  action: { x: 0, y: 800, w: 390, h: 44 },
  card: { w: 62, h: 87, tw: 58, th: 81, ow: 36, oh: 50, lift: 19, dx: 46, dy: 45 }
};

/**
 * PROPOSED V2 — numeric iteration of V1 targets.
 * Bottom stack: action 52 + hand 136 = 188 → hand.y=656, action.y=792
 * HUD 76 → felt starts ~80. Felt kept large with intentional hand overlap ~40px.
 * Seats/trick placed inside felt with breathing room; architecture unchanged.
 */
const PROP = {
  hud: { x: 0, y: 0, w: 390, h: 76 },
  felt: { x: 12, y: 80, w: 366, h: 616 }, // bottom 696; hand∩felt = 40
  n: { x: 66, y: 94, w: 258, h: 72 },
  w: { x: 20, y: 269, w: 68, h: 230 },
  e: { x: 302, y: 269, w: 68, h: 230 },
  s: { x: 122, y: 602, w: 146, h: 48 }, // 6px gap above hand
  trick: { x: 110, y: 289, w: 170, h: 190 },
  decision: { x: 25, y: 274, w: 340, h: 220 },
  sheet: { x: 25, y: 234, w: 340, h: 300 },
  statusPlaque: { x: 45, y: 328, w: 300, h: 112 },
  hand: { x: 8, y: 656, w: 374, h: 136 },
  handI: { x: 8, y: 656, w: 374, h: 136 },
  action: { x: 0, y: 792, w: 390, h: 52 },
  card: { w: 62, h: 87, tw: 58, th: 81, ow: 36, oh: 50, lift: 18, dx: 46, dy: 45 }
};

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function zone(r, fill, stroke, label, op = 0.4) {
  if (!r) return '';
  return `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${fill}" fill-opacity="${op}" stroke="${stroke}" stroke-width="1.2"/>
  <text x="${r.x + 3}" y="${r.y + 11}" font-size="8" font-family="ui-monospace,Consolas,monospace" fill="${stroke}">${esc(label)}</text>`;
}

function card(cx, cy, w, h, fill, stroke = '#111', rot = 0) {
  return `<g transform="translate(${cx},${cy}) rotate(${rot})">
    <rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="3.5" fill="${fill}" stroke="${stroke}" stroke-width="1"/>
    <rect x="${-w / 2 + 3}" y="${-h / 2 + 3}" width="${Math.max(8, w * 0.22)}" height="${Math.max(10, h * 0.18)}" rx="1" fill="none" stroke="${stroke}" stroke-opacity="0.35" stroke-width="0.8"/>
  </g>`;
}

function labelBox(r, name, active = false) {
  const fill = active ? '#422006' : '#1c1917';
  const stroke = active ? '#facc15' : '#d4a017';
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const bw = Math.min(r.w * 0.92, 120);
  const bh = Math.min(r.h * 0.55, 34);
  return `<rect x="${cx - bw / 2}" y="${cy - bh / 2}" width="${bw}" height="${bh}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
  <text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="9" font-family="system-ui,sans-serif" fill="#f5e6c8">${esc(name)}</text>`;
}

function handFan(g, count, selected = null, yBias = 0) {
  const { w, h, lift } = g.card;
  const area = g.handI || g.hand;
  const expose = count <= 1 ? 1 : 0.38 + (1 - Math.pow((13 - Math.min(13, Math.max(2, count))) / 11, 2)) * 0.54;
  const spacing = w * Math.min(0.55, Math.max(0.32, expose * 0.85));
  const span = (count - 1) * spacing + w;
  const avail = area.w - 8;
  const scale = span > avail ? avail / span : 1;
  const sp = spacing * scale;
  const ww = w * scale;
  const hh = h * scale;
  const startX = area.x + area.w / 2 - ((count - 1) * sp) / 2;
  const baseY = area.y + area.h * 0.58 + yBias;
  let s = '';
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1) - 0.5;
    const rot = t * 6;
    const cy = selected === i ? baseY - lift : baseY + Math.abs(t) * 3;
    const fill = selected === i ? '#fff7ed' : '#f8fafc';
    s += card(startX + i * sp, cy, ww, hh, fill, '#111', rot);
  }
  return s;
}

function oppStack(seat, count, horizontal, g) {
  const { ow: w, oh: h } = g.card;
  let s = '';
  const n = Math.min(count, 10);
  for (let i = 0; i < n; i++) {
    if (horizontal) {
      const cx = seat.x + seat.w / 2 + (i - (n - 1) / 2) * (w * 0.32);
      const cy = seat.y + seat.h * 0.62;
      s += card(cx, cy, w * 0.85, h * 0.85, '#1e3a5f', '#93c5fd');
    } else {
      const cx = seat.x + seat.w / 2;
      const cy = seat.y + seat.h * 0.35 + (i - (n - 1) / 2) * (h * 0.2);
      s += card(cx, cy, w * 0.75, h * 0.75, '#1e3a5f', '#93c5fd');
    }
  }
  return s;
}

function trickCards(g, n) {
  const { tw: w, th: h, dx, dy } = g.card;
  const cx = g.trick.x + g.trick.w / 2;
  const cy = g.trick.y + g.trick.h / 2;
  const slots = [
    { x: 0, y: dy },
    { x: dx, y: 0 },
    { x: 0, y: -dy },
    { x: -dx, y: 0 }
  ];
  let s = '';
  for (let i = 0; i < n; i++) {
    s += card(cx + slots[i].x, cy + slots[i].y, w, h, '#fef3c7', '#92400e');
  }
  const halfW = w / 2 + dx;
  const halfH = h / 2 + dy;
  const fits = halfW * 2 <= g.trick.w + 0.5 && halfH * 2 <= g.trick.h + 0.5;
  if (!fits) {
    s += `<text x="${cx}" y="${g.trick.y + 12}" text-anchor="middle" font-size="8" fill="#ef4444" font-family="ui-monospace,Consolas,monospace">CROSS OVERFLOW</text>`;
  } else {
    const marginW = (g.trick.w - halfW * 2) / 2;
    const marginH = (g.trick.h - halfH * 2) / 2;
    s += `<text x="${cx}" y="${g.trick.y + 11}" text-anchor="middle" font-size="7" fill="#fde68a" font-family="ui-monospace,Consolas,monospace">margin ${marginW.toFixed(0)}×${marginH.toFixed(0)}</text>`;
  }
  return s;
}

function plaque(r, lines) {
  if (!r) return '';
  let s = `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="10" fill="#3f2a14" stroke="#d4a017" stroke-width="2"/>`;
  lines.forEach((t, i) => {
    s += `<text x="${r.x + r.w / 2}" y="${r.y + 36 + i * 20}" text-anchor="middle" font-size="12" font-family="system-ui,sans-serif" fill="#f5e6c8">${esc(t)}</text>`;
  });
  return s;
}

function continueBtn(g) {
  const z = g.action;
  const bw = Math.min(150, z.w - 20);
  const bh = Math.min(28, z.h - 18);
  const bx = z.x + (z.w - bw) / 2;
  const by = z.y + 6;
  return `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="#166534" stroke="#86efac"/>
  <text x="${bx + bw / 2}" y="${by + bh / 2 + 4}" text-anchor="middle" font-size="10" font-family="system-ui,sans-serif" fill="#ecfdf5">Continuar</text>
  <text x="${z.x + z.w / 2}" y="${by + bh + 12}" text-anchor="middle" font-size="8" font-family="system-ui,sans-serif" fill="#cbd5e1">Próxima vaza · 3s</text>`;
}

function hudContent(g) {
  const h = g.hud.h;
  const pad = 6;
  const row1H = h >= 72 ? 34 : Math.max(20, h - 12);
  const y1 = g.hud.y + pad;
  let s = '';
  s += `<rect x="8" y="${y1}" width="70" height="${row1H}" rx="4" fill="#0f172a" stroke="#64748b"/>
  <text x="43" y="${y1 + 13}" text-anchor="middle" font-size="8" fill="#94a3b8">NÓS</text>
  <text x="43" y="${y1 + 26}" text-anchor="middle" font-size="12" fill="#e2e8f0" font-weight="700">42</text>`;
  s += `<rect x="160" y="${y1}" width="70" height="${row1H}" rx="4" fill="#0f172a" stroke="#64748b"/>
  <text x="195" y="${y1 + 13}" text-anchor="middle" font-size="8" fill="#94a3b8">Vaza</text>
  <text x="195" y="${y1 + 26}" text-anchor="middle" font-size="12" fill="#e2e8f0" font-weight="700">3/10</text>`;
  s += `<rect x="312" y="${y1}" width="70" height="${row1H}" rx="4" fill="#0f172a" stroke="#64748b"/>
  <text x="347" y="${y1 + 13}" text-anchor="middle" font-size="8" fill="#94a3b8">ELES</text>
  <text x="347" y="${y1 + 26}" text-anchor="middle" font-size="12" fill="#e2e8f0" font-weight="700">31</text>`;
  if (h >= 72) {
    const y2 = y1 + row1H + 4;
    s += `<rect x="8" y="${y2}" width="374" height="24" rx="4" fill="#0f172a" stroke="#475569"/>
    <text x="195" y="${y2 + 16}" text-anchor="middle" font-size="9" fill="#e2e8f0">Trunfo ♥ · Ronda 2 · Meta 4</text>`;
  }
  return s;
}

function sceneChrome(g, opts = {}) {
  let s = '';
  s += `<rect x="0" y="0" width="${SW}" height="${SH}" fill="#111827"/>`;
  s += zone(g.hud, '#1d4ed8', '#93c5fd', 'HUD', 0.45);
  s += hudContent(g);

  s += zone(g.felt, '#0f766e', '#5eead4', 'felt', 0.5);
  s += zone(g.n, '#4c1d95', '#c4b5fd', 'N', 0.2);
  s += zone(g.w, '#4c1d95', '#c4b5fd', 'W', 0.2);
  s += zone(g.e, '#4c1d95', '#c4b5fd', 'E', 0.2);
  s += zone(g.s, '#4c1d95', '#c4b5fd', 'S', 0.25);
  s += zone(g.trick, '#854d0e', '#fcd34d', 'trick', 0.18);
  s += zone(g.hand, '#065f46', '#6ee7b7', 'hand', 0.22);
  s += zone(g.action, '#334155', '#94a3b8', 'action', 0.35);

  const handTop = g.hand.y;
  const feltBottom = g.felt.y + g.felt.h;
  if (handTop < feltBottom) {
    const oh = feltBottom - handTop;
    s += `<rect x="${g.hand.x}" y="${handTop}" width="${g.hand.w}" height="${oh}" fill="#f43f5e" fill-opacity="0.12" stroke="#fb7185" stroke-dasharray="3 2"/>
    <text x="${g.hand.x + 4}" y="${handTop + 10}" font-size="7" fill="#fda4af" font-family="ui-monospace,Consolas,monospace">hand∩felt ${oh.toFixed(0)}px</text>`;
  }

  if (opts.showSheet) s += zone(g.sheet, '#b45309', '#fbbf24', 'decision overlay', 0.28);
  if (opts.showDecision) s += zone(g.decision, '#be123c', '#fb7185', 'decision', 0.25);
  if (opts.showStatus && g.statusPlaque) s += zone(g.statusPlaque, '#a16207', '#fde68a', 'status plaque', 0.35);

  return s;
}

function compose(g, kind) {
  let s = sceneChrome(g, {
    showSheet: kind === 'pre_deal',
    showStatus: kind === 'pre_deal' && !!g.statusPlaque,
    showDecision: false
  });

  if (kind === 'geometry') return s;

  if (kind === 'pre_deal') {
    s += labelBox(g.n, 'Player 3');
    s += labelBox(g.w, 'P2 · D');
    s += labelBox(g.e, 'Player 4');
    s += labelBox(g.s, 'Player 1 · BARALHA', true);
    const plaqueRect = g.statusPlaque || {
      x: g.sheet.x + g.sheet.w * 0.12,
      y: g.sheet.y + g.sheet.h * 0.35,
      w: g.sheet.w * 0.76,
      h: Math.min(112, g.sheet.h * 0.28)
    };
    s += plaque(plaqueRect, ['DISTRIBUIÇÃO', 'Player 1 está a baralhar…']);
    s += `<text x="10" y="${SH - 10}" font-size="8" fill="#fde68a" font-family="ui-monospace,Consolas,monospace">hands hidden</text>`;
    return s;
  }

  const handCount =
    kind === 'trick1' || kind === 'trick2' || kind === 'trick3' || kind === 'trick4' || kind === 'continue' ? 9 : 10;
  const opp = {
    n: kind.startsWith('trick') || kind === 'continue' ? 9 : 10,
    w: kind === 'trick2' || kind === 'trick3' || kind === 'trick4' || kind === 'continue' ? 9 : 10,
    e: kind === 'trick3' || kind === 'trick4' || kind === 'continue' ? 9 : 10
  };
  const trickN =
    kind === 'trick1' ? 1 : kind === 'trick2' ? 2 : kind === 'trick3' ? 3 : kind === 'trick4' || kind === 'continue' ? 4 : 0;

  s += oppStack(g.n, opp.n, true, g);
  s += oppStack(g.w, opp.w, false, g);
  s += oppStack(g.e, opp.e, false, g);
  s += labelBox(g.n, 'Player 3');
  s += labelBox(g.w, 'Player 2');
  s += labelBox(g.e, 'Player 4');
  s += labelBox(g.s, kind === 'local_turn' ? 'P1 · A JOGAR' : 'Player 1', kind === 'local_turn');

  if (trickN) s += trickCards(g, trickN);
  s += handFan(g, handCount, kind === 'local_turn' ? 3 : null);

  if (kind === 'continue') s += continueBtn(g);

  s += `<text x="8" y="${SH - 8}" font-size="7.5" fill="#94a3b8" font-family="ui-monospace,Consolas,monospace">hand ${g.card.w}×${g.card.h}  trick ${g.card.tw}×${g.card.th}  lift ${g.card.lift}</text>`;
  return s;
}

function dual(id, title, kind) {
  const pad = 36;
  const gap = 28;
  const W = SW * 2 + gap + pad * 2;
  const H = SH + pad * 2 + 56;
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="#f1f5f9"/>
  <text x="${pad}" y="22" font-size="15" font-family="system-ui,sans-serif" font-weight="700" fill="#0f172a">${esc(title)}</text>
  <text x="${pad}" y="40" font-size="10" font-family="ui-monospace,Consolas,monospace" fill="#475569">390×844 portrait · LEFT=CURRENT · RIGHT=PROPOSED V2 (not implemented)</text>
  <g transform="translate(${pad},${pad + 28})">
    <text x="0" y="-6" font-size="11" font-family="system-ui,sans-serif" font-weight="600" fill="#1e293b">CURRENT</text>
    <rect x="-1" y="-1" width="${SW + 2}" height="${SH + 2}" fill="none" stroke="#94a3b8" stroke-width="1"/>
    ${compose(CUR, kind)}
  </g>
  <g transform="translate(${pad + SW + gap},${pad + 28})">
    <text x="0" y="-6" font-size="11" font-family="system-ui,sans-serif" font-weight="600" fill="#1e293b">PROPOSED V2</text>
    <rect x="-1" y="-1" width="${SW + 2}" height="${SH + 2}" fill="none" stroke="#94a3b8" stroke-width="1"/>
    ${compose(PROP, kind)}
  </g>
</svg>
`;
  writeFileSync(join(__dir, id), svg);
  console.log('wrote', id);
}

dual('01_geometry_shell_current_vs_v2.svg', '01 Geometry shell — CURRENT vs PROPOSED V2', 'geometry');
dual('02_pre_deal_current_vs_v2.svg', '02 Pre-deal ritual — CURRENT vs PROPOSED V2', 'pre_deal');
dual('03_ready_play_current_vs_v2.svg', '03 Ready play — CURRENT vs PROPOSED V2', 'ready');
dual('04_local_turn_current_vs_v2.svg', '04 Local turn (selected) — CURRENT vs PROPOSED V2', 'local_turn');
dual('05_trick_1_current_vs_v2.svg', '05 Trick 1 card — CURRENT vs PROPOSED V2', 'trick1');
dual('06_trick_2_current_vs_v2.svg', '06 Trick 2 cards — CURRENT vs PROPOSED V2', 'trick2');
dual('07_trick_3_current_vs_v2.svg', '07 Trick 3 cards — CURRENT vs PROPOSED V2', 'trick3');
dual('08_trick_4_current_vs_v2.svg', '08 Trick 4 cards — CURRENT vs PROPOSED V2', 'trick4');
dual('09_trick_continue_current_vs_v2.svg', '09 Trick continue — CURRENT vs PROPOSED V2', 'continue');

function crossFit(g) {
  const { tw: w, th: h, dx, dy } = g.card;
  const needW = w + 2 * dx;
  const needH = h + 2 * dy;
  return {
    needW,
    needH,
    haveW: g.trick.w,
    haveH: g.trick.h,
    marginW: (g.trick.w - needW) / 2,
    marginH: (g.trick.h - needH) / 2,
    okW: needW <= g.trick.w + 0.5,
    okH: needH <= g.trick.h + 0.5
  };
}

function handFit(g) {
  const expose = 0.45;
  const spacing = g.card.w * expose;
  const span10 = 9 * spacing + g.card.w;
  return {
    span10,
    avail: g.hand.w,
    fits: span10 <= g.hand.w,
    liftRoom: g.hand.h - g.card.h - g.card.lift,
    card: `${g.card.w}x${g.card.h}`,
    lift: g.card.lift
  };
}

function pack(g) {
  return {
    hud: g.hud,
    felt: g.felt,
    n: g.n,
    w: g.w,
    e: g.e,
    s: g.s,
    trick: g.trick,
    hand: g.hand,
    action: g.action,
    decision: g.decision,
    sheet: g.sheet,
    statusPlaque: g.statusPlaque,
    card: g.card,
    feltVsHandOverlap: g.felt.y + g.felt.h - g.hand.y,
    southVsHandGap: g.hand.y - (g.s.y + g.s.h),
    southInsideFelt: g.s.y + g.s.h <= g.felt.y + g.felt.h + 0.1,
    feltFractionOfViewport: +(g.felt.h / SH).toFixed(3),
    trickFit: crossFit(g),
    handFit: handFit(g),
    remainingBelowAction: SH - (g.action.y + g.action.h),
    // dead space between N bottom and trick top, W/E vs trick
    gapNorthToTrick: g.trick.y - (g.n.y + g.n.h),
    gapTrickToSouth: g.s.y - (g.trick.y + g.trick.h),
    gapWestToTrick: g.trick.x - (g.w.x + g.w.w),
    gapTrickToEast: g.e.x - (g.trick.x + g.trick.w)
  };
}

const report = {
  viewport: { w: SW, h: SH },
  proposedV2: pack(PROP),
  proposedV1: pack(V1),
  current: {
    trickFit: crossFit(CUR),
    handFit: handFit(CUR),
    feltFractionOfViewport: +(CUR.felt.h / SH).toFixed(3),
    hudH: CUR.hud.h,
    actionH: CUR.action.h
  }
};
writeFileSync(join(__dir, '_fit_checks.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report.proposedV2, null, 2));
