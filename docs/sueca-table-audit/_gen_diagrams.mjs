/**
 * Generates Sueca table audit SVGs from coded geometry formulas
 * (mirrors frontend/src/scene/calculateSceneGeometry.ts + constants).
 * Run: node docs/sueca-table-audit/_gen_diagrams.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, 'diagrams');
mkdirSync(outDir, { recursive: true });

const PORTRAIT = { hud: 0.14, felt: 0.46, southSeat: 0.1, hand: 0.2, actionStatus: 0.1 };
const FELT = {
  northSeatHeight: 0.22,
  northSeatWidth: 0.4,
  decisionHeight: 0.22,
  sideSeatWidth: 0.22,
  sideSeatHeight: 0.36,
  trickSize: 0.5,
  decisionWidth: 0.56,
  sideSeatInsetX: 0.02,
  sideSeatCenterY: 0.48
};
const LOCAL = {
  southSeatWidth: 0.42,
  labelWidthOfSeat: 0.72,
  labelHeightOfSeat: 0.36,
  handInteractionPadY: 0.12,
  handInteractionPadX: 0.04
};
const CARD = {
  aspect: 1.4,
  baseW: 48,
  handPresence: 1.22,
  trickScale: 1.11,
  selectedLift: 26,
  fx: 0.8,
  fy: 0.55
};
const SUECA_RITUAL_STATUS_CLEAN_MIN_HEIGHT_PX = 86;

function rect(x, y, w, h) {
  return { x, y, w, h };
}

function build(sceneW, sceneH) {
  const bands = PORTRAIT;
  const hudH = sceneH * bands.hud;
  const feltH = sceneH * bands.felt;
  const southH = sceneH * bands.southSeat;
  const handH = sceneH * bands.hand;
  const actionH = sceneH * bands.actionStatus;
  const hud = rect(0, 0, sceneW, hudH);
  const felt = rect(0, hudH, sceneW, feltH);
  const southBandY = hudH + feltH;
  const southW = sceneW * LOCAL.southSeatWidth;
  const south = rect((sceneW - southW) / 2, southBandY, southW, southH);
  const hand = rect(0, southBandY + southH, sceneW, handH);
  const action = rect(0, hand.y + handH, sceneW, actionH);
  const northH = felt.h * FELT.northSeatHeight;
  const northW = sceneW * FELT.northSeatWidth;
  const north = rect((sceneW - northW) / 2, felt.y, northW, northH);
  const sideW = felt.w * FELT.sideSeatWidth;
  const sideH = felt.h * FELT.sideSeatHeight;
  const sideY = felt.y + felt.h * FELT.sideSeatCenterY - sideH / 2;
  const inset = felt.w * FELT.sideSeatInsetX;
  const west = rect(felt.x + inset, sideY, sideW, sideH);
  const east = rect(felt.x + felt.w - inset - sideW, sideY, sideW, sideH);
  const decisionH = felt.h * FELT.decisionHeight;
  const decisionW = felt.w * FELT.decisionWidth;
  const decision = rect(
    felt.x + (felt.w - decisionW) / 2,
    felt.y + felt.h - decisionH,
    decisionW,
    decisionH
  );
  const trickSize = Math.min(felt.w, felt.h) * FELT.trickSize;
  const trickTop = north.y + north.h;
  const trickBottom = decision.y;
  const trickBandH = Math.max(0, trickBottom - trickTop);
  const trickY = trickTop + (trickBandH - trickSize) / 2;
  const trick = rect((sceneW - trickSize) / 2, trickY, trickSize, trickSize);
  const padX = hand.w * LOCAL.handInteractionPadX;
  const padY = hand.h * LOCAL.handInteractionPadY;
  const hiY = Math.max(0, hand.y - padY);
  const handI = rect(
    hand.x + padX,
    hiY,
    hand.w - padX * 2,
    Math.min(sceneH - hiY, hand.h + padY * 2)
  );
  const sheet = rect(0, hud.y + hud.h, sceneW, Math.max(0, handI.y - (hud.y + hud.h)));
  const label = (s) => {
    const w = s.w * LOCAL.labelWidthOfSeat;
    const h = s.h * LOCAL.labelHeightOfSeat;
    return rect(s.x + (s.w - w) / 2, s.y + (s.h - h) / 2, w, h);
  };
  const baseW = CARD.baseW;
  const baseH = Math.round(CARD.baseW * CARD.aspect);
  const nomHandH = baseH * CARD.handPresence;
  const maxHandH = Math.max(0, handI.h - CARD.selectedLift);
  const handDH = Math.min(nomHandH, maxHandH);
  const handDW = handDH / CARD.aspect;
  const cardW = handDW / CARD.handPresence;
  const cardH = handDH / CARD.handPresence;
  let lo = 0;
  let hi = Math.min(trick.w, trick.h / CARD.aspect);
  for (let i = 0; i < 48; i++) {
    const mid = (lo + hi) / 2;
    const th = mid * CARD.aspect;
    const dx = Math.round(mid * CARD.fx);
    const dy = Math.round(th * CARD.fy);
    const fits =
      mid + 2 * dx <= trick.w + 1e-9 && th + 2 * dy <= trick.h + 1e-9;
    if (fits) lo = mid;
    else hi = mid;
  }
  const trickCW = Math.min(baseW * CARD.trickScale, lo);
  const trickCH = trickCW * CARD.aspect;
  const dx = Math.round(trickCW * CARD.fx);
  const dy = Math.round(trickCH * CARD.fy);
  return {
    sceneW,
    sceneH,
    hud,
    felt,
    north,
    west,
    east,
    south,
    trick,
    decision,
    sheet,
    hand,
    handI,
    action,
    labels: { n: label(north), w: label(west), e: label(east), s: label(south) },
    cards: {
      cardW,
      cardH,
      handDW,
      handDH,
      trickCW,
      trickCH,
      oppW: cardW * 0.78,
      oppH: cardH * 0.78,
      dx,
      dy,
      selectedLift: CARD.selectedLift
    },
    statusZone:
      decision.h + 1e-6 >= SUECA_RITUAL_STATUS_CLEAN_MIN_HEIGHT_PX
        ? 'decisionRect'
        : 'decisionSheetRect',
    gapDecisionToHand: hand.y - (decision.y + decision.h)
  };
}

const G = build(390, 844);

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function zone(r, fill, stroke, label, opts = {}) {
  const op = opts.opacity ?? 0.35;
  const dash = opts.dash ? ` stroke-dasharray="${opts.dash}"` : '';
  const sw = opts.sw ?? 1.2;
  let out = `<rect x="${r.x.toFixed(2)}" y="${r.y.toFixed(2)}" width="${r.w.toFixed(2)}" height="${r.h.toFixed(2)}" fill="${fill}" fill-opacity="${op}" stroke="${stroke}" stroke-width="${sw}"${dash}/>`;
  if (label) {
    const lx = r.x + 4;
    const ly = r.y + 12;
    out += `<text x="${lx.toFixed(2)}" y="${ly.toFixed(2)}" font-size="9" font-family="ui-monospace,Consolas,monospace" fill="${stroke}">${esc(label)}</text>`;
  }
  return out;
}

function cardBox(cx, cy, w, h, fill = '#f5f0e6', stroke = '#222') {
  return `<rect x="${(cx - w / 2).toFixed(2)}" y="${(cy - h / 2).toFixed(2)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
}

function panel(title, ox, oy, content) {
  return `
  <g transform="translate(${ox},${oy})">
    <rect x="0" y="0" width="${G.sceneW}" height="${G.sceneH}" fill="#1a1a1a" stroke="#444" stroke-width="2"/>
    <text x="8" y="-8" font-size="12" font-family="system-ui,sans-serif" fill="#111" font-weight="600">${esc(title)}</text>
    ${content}
  </g>`;
}

function baseGeometryZones(opts = {}) {
  const showSheet = opts.showSheet;
  const showDecision = opts.showDecision;
  const sheetOp = opts.sheetOpacity ?? 0.22;
  let s = '';
  s += zone(G.hud, '#3b82f6', '#1d4ed8', 'hudRect');
  s += zone(G.felt, '#0f766e', '#115e59', 'feltRect', { opacity: 0.45 });
  s += zone(G.north, '#a78bfa', '#6d28d9', 'seatN', { opacity: 0.25 });
  s += zone(G.west, '#a78bfa', '#6d28d9', 'seatW', { opacity: 0.25 });
  s += zone(G.east, '#a78bfa', '#6d28d9', 'seatE', { opacity: 0.25 });
  s += zone(G.south, '#a78bfa', '#6d28d9', 'seatS', { opacity: 0.25 });
  s += zone(G.trick, '#fbbf24', '#b45309', 'trickRect', { opacity: 0.2, dash: '4 2' });
  s += zone(G.decision, '#fb7185', '#be123c', 'decisionRect', { opacity: 0.2, dash: '3 2' });
  s += zone(G.hand, '#34d399', '#047857', 'handRect', { opacity: 0.28 });
  s += zone(G.handI, '#86efac', '#166534', 'handInteractionRect', {
    opacity: 0.12,
    dash: '2 2'
  });
  s += zone(G.action, '#94a3b8', '#334155', 'actionStatusRect', { opacity: 0.3 });
  if (showDecision) {
    s += zone(G.decision, '#f43f5e', '#9f1239', 'decisionRect ACTIVE', { opacity: 0.45 });
  }
  if (showSheet) {
    s += zone(G.sheet, '#f59e0b', '#92400e', 'decisionSheetRect ACTIVE', {
      opacity: sheetOp
    });
  }
  // labels
  for (const [k, lab] of Object.entries(G.labels)) {
    s += zone(lab, '#e2e8f0', '#0f172a', `label${k.toUpperCase()}`, { opacity: 0.55, sw: 1 });
  }
  return s;
}

function drawHand(count, selectedIndex = null, hidden = false) {
  if (hidden) {
    return `<text x="${(G.hand.x + 12).toFixed(2)}" y="${(G.hand.y + G.hand.h / 2).toFixed(2)}" font-size="11" font-family="system-ui,sans-serif" fill="#94a3b8">hand HIDDEN (presentation gate)</text>`;
  }
  const { handDW: w, handDH: h, selectedLift } = G.cards;
  const expose = 0.38 + (1 - (13 - Math.min(13, Math.max(2, count))) / 11) ** 2 * (0.92 - 0.38);
  // approximate expose via same ease as handExposedFraction for count
  const hi = 13,
    lo = 2;
  const t = Math.max(0, Math.min(1, (hi - count) / (hi - lo)));
  const eased = 1 - (1 - t) * (1 - t);
  const exp = 0.38 + eased * (0.92 - 0.38);
  const spacing = w * exp;
  const span = (count - 1) * spacing + w;
  const startX = G.hand.x + G.hand.w / 2 - span / 2 + w / 2;
  const baseY = G.hand.y + G.hand.h / 2;
  let s = '';
  for (let i = 0; i < count; i++) {
    const cx = startX + i * spacing;
    const cy = selectedIndex === i ? baseY - selectedLift : baseY;
    s += cardBox(cx, cy, w, h, selectedIndex === i ? '#fff7ed' : '#f8fafc', '#111');
  }
  return s;
}

function drawOpponents(counts = { n: 10, w: 10, e: 10 }, hidden = false) {
  if (hidden) return '';
  const { oppW: w, oppH: h } = G.cards;
  let s = '';
  const place = (zone, n, horizontal) => {
    for (let i = 0; i < Math.min(n, 10); i++) {
      if (horizontal) {
        const cx = zone.x + zone.w / 2 + (i - (Math.min(n, 10) - 1) / 2) * (w * 0.35);
        const cy = zone.y + zone.h * 0.55;
        s += cardBox(cx, cy, w * 0.7, h * 0.7, '#1e3a5f', '#93c5fd');
      } else {
        const cx = zone.x + zone.w / 2;
        const cy = zone.y + zone.h / 2 + (i - (Math.min(n, 10) - 1) / 2) * (h * 0.22);
        s += cardBox(cx, cy, w * 0.65, h * 0.65, '#1e3a5f', '#93c5fd');
      }
    }
  };
  place(G.north, counts.n, true);
  place(G.west, counts.w, false);
  place(G.east, counts.e, false);
  return s;
}

function drawTrick(n) {
  const { trickCW: w, trickCH: h, dx, dy } = G.cards;
  const cx = G.trick.x + G.trick.w / 2;
  const cy = G.trick.y + G.trick.h / 2;
  // Sueca order relative to leader=south for diagram: S, E, N, W (playDirection right = ACW)
  const slots = [
    { x: 0, y: dy }, // south
    { x: dx, y: 0 }, // east
    { x: 0, y: -dy }, // north
    { x: -dx, y: 0 } // west
  ];
  let s = '';
  for (let i = 0; i < n; i++) {
    s += cardBox(cx + slots[i].x, cy + slots[i].y, w, h, '#fef3c7', '#92400e');
  }
  return s;
}

function drawPlaque(zoneName, textLines) {
  const z = zoneName === 'decisionRect' ? G.decision : G.sheet;
  const boxW = Math.min(z.w * 0.72, 260);
  const boxH = Math.min(88, z.h * 0.35);
  const bx = z.x + (z.w - boxW) / 2;
  const by = z.y + (z.h - boxH) / 2;
  let s = `<rect x="${bx.toFixed(2)}" y="${by.toFixed(2)}" width="${boxW.toFixed(2)}" height="${boxH.toFixed(2)}" rx="8" fill="#3f2a14" stroke="#d4a017" stroke-width="2"/>`;
  textLines.forEach((t, i) => {
    s += `<text x="${(bx + boxW / 2).toFixed(2)}" y="${(by + 28 + i * 18).toFixed(2)}" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="#f5e6c8">${esc(t)}</text>`;
  });
  return s;
}

function drawContinueCta() {
  const z = G.action;
  const bw = 160;
  const bh = 36;
  const bx = z.x + (z.w - bw) / 2;
  const by = z.y + (z.h - bh) / 2;
  return `<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="6" fill="#166534" stroke="#86efac"/><text x="${bx + bw / 2}" y="${by + 23}" text-anchor="middle" font-size="11" font-family="system-ui,sans-serif" fill="#ecfdf5">Continuar (actionStatusRect)</text>`;
}

function drawModal() {
  return `<rect x="0" y="0" width="${G.sceneW}" height="${G.sceneH}" fill="#000" fill-opacity="0.55"/><rect x="40" y="220" width="310" height="280" rx="10" fill="#1c1917" stroke="#d4a017" stroke-width="2"/><text x="195" y="270" text-anchor="middle" font-size="14" font-family="system-ui,sans-serif" fill="#f5e6c8">RoundEndModal</text><text x="195" y="295" text-anchor="middle" font-size="10" font-family="ui-monospace,Consolas,monospace" fill="#a8a29e">fullSceneModalRect overlay</text>`;
}

function dualSvg(id, title, actualContent, note) {
  const pad = 40;
  const gap = 36;
  const W = G.sceneW * 2 + gap + pad * 2;
  const H = G.sceneH + pad * 2 + 48;
  const geom = baseGeometryZones({ showSheet: false, showDecision: false });
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="100%" height="100%" fill="#f8fafc"/>
  <text x="${pad}" y="22" font-size="14" font-family="system-ui,sans-serif" fill="#0f172a" font-weight="700">${esc(title)}</text>
  <text x="${pad}" y="38" font-size="10" font-family="ui-monospace,Consolas,monospace" fill="#475569">${esc(note)}</text>
  ${panel('ACTUAL (composition implied by current Sueca code)', pad, pad + 20, actualContent)}
  ${panel('CANONICAL zone rects (calculateSceneGeometry, phase-independent)', pad + G.sceneW + gap, pad + 20, geom)}
</svg>
`;
  writeFileSync(join(outDir, `${id}.svg`), svg);
  console.log('wrote', id);
}

// --- states ---

dualSvg(
  'sueca_state_01_geometry_shell',
  '01 — Geometry shell / empty table zones',
  baseGeometryZones() +
    `<text x="12" y="820" font-size="10" fill="#cbd5e1" font-family="ui-monospace,Consolas,monospace">No cards. Zones always present when supported.</text>`,
  'portrait designFrame 390×844, sceneScale=1; PROVISIONAL bands'
);

dualSvg(
  'sueca_state_02_pre_deal_ritual',
  '02 — Pre-deal ritual (waitingForRoundStart + SuecaDealingModal)',
  baseGeometryZones({ showSheet: true, sheetOpacity: 0.28 }) +
    drawOpponents({ n: 0, w: 0, e: 0 }, true) +
    drawHand(0, null, true) +
    drawPlaque(G.statusZone, ['DISTRIBUIÇÃO', 'Player 1 está a baralhar…']) +
    `<text x="12" y="820" font-size="9" fill="#fde68a" font-family="ui-monospace,Consolas,monospace">status zone pick: ${G.statusZone} (decisionH=${G.decision.h.toFixed(2)} vs min ${SUECA_RITUAL_STATUS_CLEAN_MIN_HEIGHT_PX})</text>`,
  'hideHands via waitingForRoundStart; ritual uses decisionSheetRect for decision/human; status may also fall to sheet'
);

dualSvg(
  'sueca_state_03_post_deal_distributing',
  '03 — Post-deal distributing (hands + trump HUD hidden)',
  baseGeometryZones({ showSheet: true, sheetOpacity: 0.25 }) +
    drawHand(10, null, true) +
    drawPlaque('decisionSheetRect', ['A DISTRIBUIR', 'cartas…']) +
    `<text x="12" y="820" font-size="9" fill="#fde68a" font-family="ui-monospace,Consolas,monospace">postDealHandsHidden + postDealTrumpHudHidden + playLocked</text>`,
  'SuecaPostDealPhase deal-confirmed | distributing'
);

dualSvg(
  'sueca_state_04_post_deal_hands_reveal',
  '04 — Post-deal hands-reveal (hands shown, trump still hidden, play locked)',
  baseGeometryZones({ showSheet: true, sheetOpacity: 0.18 }) +
    drawOpponents({ n: 10, w: 10, e: 10 }) +
    drawHand(10) +
    drawPlaque('decisionSheetRect', ['MÃOS', 'reveladas']) +
    `<text x="12" y="820" font-size="9" fill="#fde68a" font-family="ui-monospace,Consolas,monospace">hideTrump still true; playLocked true</text>`,
  'SuecaPostDealPhase hands-reveal'
);

dualSvg(
  'sueca_state_05_post_deal_trump_first',
  '05 — Post-deal trump-reveal / first-player plaques',
  baseGeometryZones({ showSheet: true, sheetOpacity: 0.18 }) +
    drawOpponents({ n: 10, w: 10, e: 10 }) +
    drawHand(10) +
    drawPlaque('decisionSheetRect', ['TRUNFO / 1.º JOGADOR', 'SuecaPostDealCard']) +
    `<text x="12" y="820" font-size="9" fill="#fde68a" font-family="ui-monospace,Consolas,monospace">playLocked until phase null</text>`,
  'phases trump-reveal and first-player share sheet envelope; table zones unchanged'
);

dualSvg(
  'sueca_state_06_ready_play_idle',
  '06 — Ready to play / not local turn',
  baseGeometryZones() +
    drawOpponents({ n: 10, w: 10, e: 10 }) +
    drawHand(10) +
    zone(G.labels.w, '#facc15', '#854d0e', 'A JOGAR cue (active seat)', {
      opacity: 0.65
    }) +
    `<text x="12" y="820" font-size="9" fill="#cbd5e1" font-family="ui-monospace,Consolas,monospace">suecaPlayReady; hand readOnly / hand-inactive styling</text>`,
  'postDealPhase=null; waitingForRoundStart=false'
);

dualSvg(
  'sueca_state_07_local_turn_no_select',
  '07 — Local turn, no selected card',
  baseGeometryZones() +
    drawOpponents({ n: 10, w: 9, e: 10 }) +
    drawHand(10) +
    zone(G.labels.s, '#facc15', '#854d0e', 'local A JOGAR', { opacity: 0.7 }) +
    `<text x="12" y="820" font-size="9" fill="#cbd5e1" font-family="ui-monospace,Consolas,monospace">selectedCard=null; playable vs illegal card visuals</text>`,
  'currentPlayerIndex === local'
);

dualSvg(
  'sueca_state_08_local_turn_selected',
  '08 — Local turn, selected card (lift)',
  baseGeometryZones() +
    drawOpponents({ n: 10, w: 9, e: 10 }) +
    drawHand(10, 3) +
    `<text x="12" y="820" font-size="9" fill="#cbd5e1" font-family="ui-monospace,Consolas,monospace">selectedLift=${CARD.selectedLift}px; must stay inside handInteractionRect</text>`,
  'HUMAN_HAND_LAYOUT.selectedLift / PROVISIONAL_CARD_METRICS.selectedLiftPad'
);

for (let n = 1; n <= 4; n++) {
  dualSvg(
    `sueca_state_${String(8 + n).padStart(2, '0')}_trick_${n}`,
    `${8 + n} — Trick in progress (${n} card${n > 1 ? 's' : ''} on table)`,
    baseGeometryZones() +
      drawOpponents({
        n: 10 - (n >= 3 ? 1 : 0),
        w: 10 - (n >= 2 ? 1 : 0),
        e: 10 - (n >= 4 ? 1 : 0)
      }) +
      drawHand(10 - (n >= 1 ? 1 : 0)) +
      drawTrick(n) +
      `<text x="12" y="820" font-size="9" fill="#cbd5e1" font-family="ui-monospace,Consolas,monospace">premiumTrickOffset: dx=round(tw*0.8)=${G.cards.dx}, dy=round(th*0.55)=${G.cards.dy}</text>`,
    'trick cards centered on trickCenter; compass cross'
  );
}

dualSvg(
  'sueca_state_13_trick_continue',
  '13 — Trick complete / continue CTA',
  baseGeometryZones() +
    drawOpponents({ n: 9, w: 9, e: 9 }) +
    drawHand(9) +
    drawTrick(4) +
    drawContinueCta() +
    `<text x="12" y="820" font-size="9" fill="#cbd5e1" font-family="ui-monospace,Consolas,monospace">waitingForTrickEnd → GameActions in actionStatusRect band</text>`,
  'shouldShowTrickContinueCta / shouldShowTrickContinueChrome'
);

dualSvg(
  'sueca_state_14_round_end_modal',
  '14 — Round-end modal over table',
  baseGeometryZones() +
    drawOpponents({ n: 0, w: 0, e: 0 }) +
    drawHand(0, null, true) +
    drawModal() +
    `<text x="12" y="820" font-size="9" fill="#fde68a" font-family="ui-monospace,Consolas,monospace">RoundEndModal uses modal-overlay (fullSceneModalRect intent)</text>`,
  'waitingForRoundEnd && !isGameOver'
);

dualSvg(
  'sueca_state_15_unsupported_viewport',
  '15 — Unsupported geometry gate',
  `<rect x="0" y="0" width="${G.sceneW}" height="${G.sceneH}" fill="#111827"/>
   <text x="${G.sceneW / 2}" y="${G.sceneH / 2}" text-anchor="middle" font-size="14" fill="#f8fafc" font-family="system-ui,sans-serif">Viewport too small for the game table.</text>
   <text x="${G.sceneW / 2}" y="${G.sceneH / 2 + 24}" text-anchor="middle" font-size="10" fill="#94a3b8" font-family="ui-monospace,Consolas,monospace">supported:false — no sceneFrame host</text>`,
  'landscape shell &lt; 1024×600 or minSceneScale/minimums fail'
);

// dump numbers for markdown
writeFileSync(
  join(__dir, '_computed_portrait_390x844.json'),
  JSON.stringify(
    {
      ...G,
      note: 'Derived from calculateSceneGeometry formulas at designFrame portrait 390×844, sceneScale=1, zero insets'
    },
    null,
    2
  )
);
console.log('statusZone', G.statusZone, 'decisionH', G.decision.h);
