import { CARD_HIERARCHY, Card } from '../../types/game';
import { cardsMatch } from '../shared/clone';
import { isKingHearts } from '../shared/kingObligations';
import {
  cardWouldWinTrickStandard,
  cardWouldWinTrickSueca,
  lowestWinningCardSueca,
  lowestTrumpThatWinsSueca,
} from '../encoder/trickHelpers';
import {
  compareChosenToCheapestWinner,
  heartsEnc,
  isLeading,
  isMetricApplicable,
  kingEnc,
  lowestWinningSpade,
  notApplicable,
  result,
  spadesEnc,
  suecaEnc,
  trickLeader,
} from './evalHelpers';
import {
  cardWouldWinTrick,
  deriveOpponentSpadesPressure,
  highestRankInHand,
  isOpponentHighBidThreat,
  lowestLegalThatLoses,
} from './tierBHelpers';
import { EvaluatorContext, MetricEvaluationResult, MetricEvaluatorFn } from './types';

function evaluateT01(ctx: EvaluatorContext): MetricEvaluationResult {
  return result('T01', 'good', 'Jogada legal.');
}

function evaluateK02(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'K02')) return notApplicable('K02');
  const k = kingEnc(ctx);
  if (!k.mustPlayKingHeartsNow) return notApplicable('K02');
  if (isKingHearts(ctx.chosenCard)) {
    return result('K02', 'good', 'Cumpriu a obrigação do K♥.');
  }
  const kh = ctx.legalMoves.find(isKingHearts);
  return result(
    'K02',
    'bad',
    'Escondeu o K♥ na 1.ª oportunidade legal.',
    kh ? [kh] : []
  );
}

function evaluateK03(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'K03')) return notApplicable('K03');
  const k = kingEnc(ctx);
  if (k.cannotLeadHearts !== true) return notApplicable('K03');
  const hasOffHeart = ctx.legalMoves.some((c) => c.suit !== 'hearts');
  if (ctx.chosenCard.suit === 'hearts' && hasOffHeart) {
    const alt = ctx.legalMoves.find((c) => c.suit !== 'hearts');
    return result('K03', 'bad', 'Puxou copas com alternativa legal.', alt ? [alt] : []);
  }
  if (ctx.chosenCard.suit !== 'hearts') {
    return result('K03', 'good', 'Não puxou copas desnecessariamente.');
  }
  return result('K03', 'good', 'Seguiu copas sem alternativa off-suit.');
}

function evaluateK00(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'K00')) return notApplicable('K00');
  const k = kingEnc(ctx);
  if (k.contractId !== 'no_hearts') return notApplicable('K00');
  const offHeart = ctx.legalMoves.filter((c) => c.suit !== 'hearts');
  if (ctx.chosenCard.suit === 'hearts' && offHeart.length > 0) {
    return result('K00', 'bad', 'Descartou copa com alternativa.', [offHeart[0]]);
  }
  return result('K00', 'good', 'Respeitou o contrato de evitar copas.');
}

function evaluateK01(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'K01')) return notApplicable('K01');
  const k = kingEnc(ctx);
  if (k.contractId !== 'no_queens') return notApplicable('K01');
  if (ctx.chosenCard.rank === 'Q') {
    const safe = ctx.legalMoves.find((c) => c.rank !== 'Q');
    return result('K01', 'bad', 'Descartou dama no contrato negativo.', safe ? [safe] : []);
  }
  return result('K01', 'good', 'Evitou dama no descarte.');
}

function evaluateK08(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'K08')) return notApplicable('K08');
  const k = kingEnc(ctx);
  if (k.contractId !== 'no_queens' && k.contractId !== 'no_men') {
    return notApplicable('K08');
  }
  if (ctx.chosenCard.rank === 'Q' || ctx.chosenCard.rank === 'K') {
    const safe = ctx.legalMoves.find((c) => c.rank !== 'Q' && c.rank !== 'K');
    return result(
      'K08',
      'bad',
      'Descartou figura penalizada no contrato.',
      safe ? [safe] : []
    );
  }
  return result('K08', 'good', 'Evitou damas/homens no descarte.');
}

function evaluateK09(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'K09')) return notApplicable('K09');
  const leader = trickLeader(ctx);
  const cheapest = lowestWinningCardSueca(
    ctx.legalMoves,
    ctx.state.currentTrick,
    leader,
    ctx.state.trumpSuit
  );
  const cmp = compareChosenToCheapestWinner(
    ctx,
    'K09',
    cheapest,
    (c) =>
      cardWouldWinTrickSueca(
        c,
        ctx.state.currentTrick,
        leader,
        ctx.state.trumpSuit
      )
  );
  return cmp ?? notApplicable('K09');
}

function evaluateK10(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (ctx.fixtureId !== 'K10' && !isMetricApplicable(ctx, 'K10')) {
    return notApplicable('K10');
  }

  const k = kingEnc(ctx);
  if (
    k.isLastTwoPhase !== true ||
    k.penaltyMap === null ||
    k.trickNumberForLastTwo === null ||
    (k.trickNumberForLastTwo !== 11 && k.trickNumberForLastTwo !== 12)
  ) {
    return result('K10', 'partial', 'Endgame duas últimas — dados em falta.');
  }

  const leader = trickLeader(ctx);
  const trickBefore =
    ctx.state.trickPosition > 0
      ? ctx.state.currentTrick.slice(0, ctx.state.trickPosition)
      : [];
  const trump = ctx.state.trumpSuit;
  const chosenWins = cardWouldWinTrick(ctx, ctx.chosenCard);
  const highest = highestRankInHand(ctx.legalMoves);
  const lowestLoser = lowestLegalThatLoses(
    ctx.legalMoves,
    trickBefore,
    leader,
    trump
  );

  if (isLeading(ctx)) {
    const chosenIsHighest =
      CARD_HIERARCHY[ctx.chosenCard.rank] >= CARD_HIERARCHY[highest.rank];
    if (chosenIsHighest && ctx.legalMoves.length > 1) {
      const lowerAlt = ctx.legalMoves.find(
        (c) => CARD_HIERARCHY[c.rank] < CARD_HIERARCHY[ctx.chosenCard.rank]
      );
      if (lowerAlt) {
        return result(
          'K10',
          'bad',
          'Subiu demais na penúltima — risco no_last_two.',
          [lowerAlt]
        );
      }
    }
    if (!chosenIsHighest) {
      return result('K10', 'good', 'Abriu com carta baixa nas duas últimas.');
    }
  }

  if (!chosenWins && lowestLoser) {
    return result('K10', 'good', 'Descartou baixo — vaza já perdida.');
  }

  if (chosenWins && lowestLoser) {
    return result(
      'K10',
      'bad',
      'Ganhou vaza com carta alta — alternativa baixa existia.',
      [lowestLoser]
    );
  }

  if (chosenWins && k.trickNumberForLastTwo === 11 && ctx.legalMoves.length > 1) {
    const higherRemaining = ctx.legalMoves.filter(
      (c) =>
        !cardsMatch(c, ctx.chosenCard) &&
        CARD_HIERARCHY[c.rank] > CARD_HIERARCHY[ctx.chosenCard.rank]
    );
    if (higherRemaining.length > 0) {
      return result(
        'K10',
        'medium',
        'Ganhou vaza 11 mas ficou carta alta para a 12.',
        higherRemaining
      );
    }
  }

  return result('K10', 'good', 'Jogada prudente nas duas últimas.');
}

function evaluateK12(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'K12')) return notApplicable('K12');
  const k = kingEnc(ctx);
  if (k.nulosMode !== true) return notApplicable('K12');
  if (chosenWinsNulos(ctx)) {
    return result('K12', 'bad', 'Ganhou vaza em nulos — devia perder.', sloughMove(ctx));
  }
  return result('K12', 'good', 'Evitou ganhar vaza em nulos.');
}

function chosenWinsNulos(ctx: EvaluatorContext): boolean {
  return cardWouldWinTrickStandard(
    ctx.chosenCard,
    ctx.state.currentTrick,
    trickLeader(ctx),
    null
  );
}

function sloughMove(ctx: EvaluatorContext): Card[] {
  const leader = trickLeader(ctx);
  const loser = ctx.legalMoves.find(
    (c) =>
      !cardWouldWinTrickStandard(c, ctx.state.currentTrick, leader, null)
  );
  return loser ? [loser] : [];
}

function spadesTrumpWin(
  card: Card,
  trickBefore: Card[],
  leader: number
): boolean {
  return cardWouldWinTrickStandard(card, trickBefore, leader, 'spades');
}

function evaluateSP09(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'SP09')) return notApplicable('SP09');
  const s = spadesEnc(ctx);
  if (s.avoidBagMode !== true) return notApplicable('SP09');
  const leader = trickLeader(ctx);
  const trickBefore = ctx.state.currentTrick;
  const wins = spadesTrumpWin(ctx.chosenCard, trickBefore, leader);
  const slough = ctx.legalMoves.find(
    (c) => !spadesTrumpWin(c, trickBefore, leader)
  );
  if (wins && slough) {
    return result('SP09', 'bad', 'Bid cumprido — overtrick desnecessário (bag).', [slough]);
  }
  return result('SP09', 'good', 'Bid cumprido — evitou bag.');
}

function evaluateSP06(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'SP06')) return notApplicable('SP06');
  const s = spadesEnc(ctx);
  if (s.partnerWinning !== true) return notApplicable('SP06');
  const leader = trickLeader(ctx);
  const trickBefore = ctx.state.currentTrick;
  const steals = spadesTrumpWin(ctx.chosenCard, trickBefore, leader);
  const feed = ctx.legalMoves.find(
    (c) => !spadesTrumpWin(c, trickBefore, leader)
  );
  if (steals && feed) {
    return result('SP06', 'medium', 'Roubou vaza ao parceiro.', [feed]);
  }
  return result('SP06', 'good', 'Protegeu o parceiro — jogou baixo.');
}

function evaluateSP08(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'SP08')) return notApplicable('SP08');
  const cheapest = lowestWinningSpade(ctx);
  return (
    compareChosenToCheapestWinner(ctx, 'SP08', cheapest, (c) => {
      const leader = trickLeader(ctx);
      return spadesTrumpWin(c, ctx.state.currentTrick, leader);
    }) ?? notApplicable('SP08')
  );
}

function evaluateSP01(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'SP01')) return notApplicable('SP01');
  return result('SP01', 'good', 'Proxy play-phase — bid real fora v0.');
}

function evaluateSP14(ctx: EvaluatorContext): MetricEvaluationResult | null {
  const isFixture = ctx.fixtureId === 'SP14';
  if (!isFixture && !isMetricApplicable(ctx, 'SP14')) {
    return notApplicable('SP14');
  }

  const pressure = deriveOpponentSpadesPressure(ctx);
  if (!pressure) {
    return isFixture
      ? result('SP14', 'partial', 'Pressão bid adversária — score em falta.')
      : notApplicable('SP14');
  }

  if (!isOpponentHighBidThreat(pressure)) {
    return isFixture
      ? result('SP14', 'partial', 'Sem ameaça activa de bid adversária alta.')
      : notApplicable('SP14');
  }

  const leader = trickLeader(ctx);
  const trickBefore =
    ctx.state.trickPosition > 0
      ? ctx.state.currentTrick.slice(0, ctx.state.trickPosition)
      : [];
  const chosenWins = spadesTrumpWin(ctx.chosenCard, trickBefore, leader);
  const winningAlt = ctx.legalMoves.find((c) =>
    spadesTrumpWin(c, trickBefore, leader)
  );
  const losingAlt = ctx.legalMoves.find(
    (c) => !spadesTrumpWin(c, trickBefore, leader)
  );
  const cheapest = lowestWinningSpade(ctx);

  if (!chosenWins && winningAlt) {
    return result(
      'SP14',
      'bad',
      'Deixou escapar vaza com bid adversária em jogo.',
      [winningAlt]
    );
  }

  if (
    chosenWins &&
    cheapest &&
    !cardsMatch(ctx.chosenCard, cheapest) &&
    CARD_HIERARCHY[ctx.chosenCard.rank] > CARD_HIERARCHY[cheapest.rank]
  ) {
    return result('SP14', 'medium', 'Bloqueou mas gastou espada alta.', [cheapest]);
  }

  if (chosenWins && losingAlt) {
    return result('SP14', 'good', 'Bloqueou pressão da bid adversária.');
  }

  if (!chosenWins && !winningAlt) {
    return result('SP14', 'good', 'Não havia forma de ganhar — descarte aceitável.');
  }

  return result('SP14', 'good', 'Resposta adequada à bid adversária.');
}

function evaluateS08(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'S08')) return notApplicable('S08');
  const s = suecaEnc(ctx);
  const leader = trickLeader(ctx);
  const cheapest = lowestWinningCardSueca(
    ctx.legalMoves,
    ctx.state.currentTrick,
    leader,
    ctx.state.trumpSuit
  );
  if (s.cutRisk === null && cheapest !== null && ctx.state.currentTrick.length > 0) {
    return result('S08', 'partial', 'Risco de corte indisponível — avaliação parcial.');
  }
  if (s.cutRisk === null) return notApplicable('S08');
  return (
    compareChosenToCheapestWinner(ctx, 'S08', cheapest, (c) =>
      cardWouldWinTrickSueca(c, ctx.state.currentTrick, leader, ctx.state.trumpSuit)
    ) ?? notApplicable('S08')
  );
}

function evaluateS12(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'S12')) return notApplicable('S12');
  const leader = trickLeader(ctx);
  const cheapest = lowestTrumpThatWinsSueca(
    ctx.legalMoves,
    ctx.state.currentTrick,
    leader,
    ctx.state.trumpSuit
  );
  if (!cheapest) return notApplicable('S12');
  if (cardsMatch(ctx.chosenCard, cheapest)) {
    return result('S12', 'good', 'Cortou com o trunfo mínimo que chegava.');
  }
  if (
    ctx.chosenCard.suit === ctx.state.trumpSuit &&
    CARD_HIERARCHY[ctx.chosenCard.rank] > CARD_HIERARCHY[cheapest.rank]
  ) {
    return result('S12', 'medium', 'Cortou alto demais.', [cheapest]);
  }
  return result('S12', 'good', 'Corte adequado.');
}

function evaluateS16(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'S16')) return notApplicable('S16');
  if (!isLeading(ctx)) return notApplicable('S16');
  const s = suecaEnc(ctx);
  const sevenDPlayed = s.sevensSeenBySuit.diamonds;
  const sevenD = ctx.legalMoves.find(
    (c) => c.suit === 'diamonds' && c.rank === '7'
  );
  if (sevenD && !sevenDPlayed && cardsMatch(ctx.chosenCard, sevenD)) {
    return result(
      'S16',
      'bad',
      'Abriu manilha de ouros antes do Ás sair.',
      ctx.legalMoves.filter((c) => !cardsMatch(c, sevenD))
    );
  }
  return result('S16', 'good', 'Não abriu manilha prematuramente.');
}

function evaluateS19(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'S19')) return notApplicable('S19');
  const s = suecaEnc(ctx);
  if (s.partnerWinning !== true) return notApplicable('S19');
  const leader = trickLeader(ctx);
  const wins = cardWouldWinTrickSueca(
    ctx.chosenCard,
    ctx.state.currentTrick,
    leader,
    ctx.state.trumpSuit
  );
  if (wins && ctx.legalMoves.length > 1) {
    const lower = ctx.legalMoves
      .filter((c) => !cardsMatch(c, ctx.chosenCard))
      .sort((a, b) => CARD_HIERARCHY[a.rank] - CARD_HIERARCHY[b.rank])[0];
    if (lower) {
      return result('S19', 'medium', 'Subiu vaza do parceiro.', [lower]);
    }
  }
  return result('S19', 'good', 'Parceiro ganha — jogou baixo.');
}

function evaluateS25(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (ctx.fixtureId !== 'S25' && !isMetricApplicable(ctx, 'S25')) {
    return notApplicable('S25');
  }

  const synth = ctx.tierBTestContext?.s25;
  if (!synth) {
    return result('S25', 'partial', 'Destrunfar parceiro — void parceiro indisponível.');
  }

  if (synth.partnerWasCutting === true) {
    return result('S25', 'bad', 'Destrunfou quando parceiro ia cortar.');
  }

  if (
    synth.leadingTrump === true &&
    synth.partnerVoidInLedSuit === true &&
    isLeading(ctx)
  ) {
    return result('S25', 'good', 'Destrunfou trunfo a favor do parceiro void.');
  }

  return result('S25', 'partial', 'Destrunfar parceiro — sinal void/corte em falta.');
}

function evaluateH13(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'H13')) return notApplicable('H13');
  const h = heartsEnc(ctx);
  if (h.trickIsSafeAndPointless !== true) return notApplicable('H13');
  const isDangerous =
    ctx.chosenCard.suit === 'hearts' ||
    (ctx.chosenCard.rank === 'Q' && ctx.chosenCard.suit === 'spades');
  if (isDangerous) {
    return result('H13', 'good', 'Limpou carta perigosa em vaza nossa sem pontos.');
  }
  const dangerous = ctx.legalMoves.find(
    (c) => c.suit === 'hearts' || (c.rank === 'Q' && c.suit === 'spades')
  );
  if (dangerous) {
    return result('H13', 'medium', 'Manteve carta perigosa na mão.', [dangerous]);
  }
  return result('H13', 'good', 'Vaza segura sem pontos.');
}

function evaluateH01(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'H01')) return notApplicable('H01');
  const h = heartsEnc(ctx);
  const points = h.pointsInTrick ?? 0;
  if (points > 0 && ctx.chosenCard.suit === 'hearts') {
    const off = ctx.legalMoves.find((c) => c.suit !== 'hearts');
    if (off) {
      return result('H01', 'bad', 'Aumentou pontos desnecessários na vaza.', [off]);
    }
  }
  if (points > 0 && ctx.chosenCard.suit !== 'hearts') {
    return result('H01', 'good', 'Evitou pontos na vaza.');
  }
  return result('H01', 'good', 'Sem penalização de pontos.');
}

function evaluateH11(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'H11')) return notApplicable('H11');
  if (ctx.state.ledSuit !== 'spades') return notApplicable('H11');
  if (ctx.chosenCard.rank === 'Q' && ctx.chosenCard.suit === 'spades') {
    const low = ctx.legalMoves.find(
      (c) => c.suit === 'spades' && c.rank !== 'Q'
    );
    return result('H11', 'bad', 'Jogou Q♠ quando havia espada baixa.', low ? [low] : []);
  }
  return result('H11', 'good', 'Seguiu espadas com carta baixa.');
}

function evaluateH05(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'H05')) return notApplicable('H05');
  return result('H05', 'good', 'Proxy pass — pass real fora v0.');
}

function evaluateH10(ctx: EvaluatorContext): MetricEvaluationResult | null {
  const isFixture = ctx.fixtureId === 'H10';
  if (!isFixture && !isMetricApplicable(ctx, 'H10')) {
    return notApplicable('H10');
  }

  const h = heartsEnc(ctx);
  if (h.moonThreatLevel === null || h.moonThreatLevel === 'none') {
    return isFixture
      ? result('H10', 'partial', 'Shoot the moon — ameaça moon indisponível.')
      : notApplicable('H10');
  }

  const offMoonFeed = ctx.legalMoves.find(
    (c) => c.suit !== 'hearts' && !(c.rank === 'Q' && c.suit === 'spades')
  );
  const feedsMoon =
    ctx.chosenCard.suit === 'hearts' ||
    (ctx.chosenCard.rank === 'Q' && ctx.chosenCard.suit === 'spades');

  if (h.moonThreatLevel === 'likely' && feedsMoon && offMoonFeed) {
    return result('H10', 'bad', 'Alimentou moon quando podia cortar.', [offMoonFeed]);
  }

  if (!feedsMoon) {
    return result('H10', 'good', 'Evitou alimentar shoot the moon.');
  }

  if (
    feedsMoon &&
    ctx.state.ledSuit === 'hearts' &&
    (h.pointsInTrick ?? 0) > 0
  ) {
    return result('H10', 'good', 'Levou pontos contra candidato a moon.');
  }

  return result('H10', 'partial', 'Moon possível — decisão estrategicamente ambígua.');
}

function evaluateT04(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (ctx.state.variant === 'hearts') return notApplicable('T04');
  return evaluateS08(ctx) ?? notApplicable('T04');
}

function evaluateT06(ctx: EvaluatorContext): MetricEvaluationResult | null {
  if (!isMetricApplicable(ctx, 'T06')) return notApplicable('T06');
  if (ctx.state.variant === 'spades') {
    return evaluateSP09(ctx) ?? notApplicable('T06');
  }
  if (ctx.state.variant === 'hearts') {
    if (ctx.state.currentTrick.length === 0) return notApplicable('T06');
    const h = heartsEnc(ctx);
    if ((h.pointsInTrick ?? 0) > 0) return notApplicable('T06');
    const leader = trickLeader(ctx);
    const wins = cardWouldWinTrickStandard(
      ctx.chosenCard,
      ctx.state.currentTrick,
      leader,
      null
    );
    if (wins) {
      const slough = ctx.legalMoves.find(
        (c) =>
          !cardWouldWinTrickStandard(c, ctx.state.currentTrick, leader, null)
      );
      return result('T06', 'medium', 'Devia jogar baixo para perder.', slough ? [slough] : []);
    }
    return result('T06', 'good', 'Jogou baixo para perder.');
  }
  if (ctx.state.variant === 'king') {
    return evaluateK12(ctx) ?? notApplicable('T06');
  }
  return notApplicable('T06');
}

export const P0_EVALUATION_ORDER: string[] = [
  'T01',
  'K02',
  'K03',
  'K00',
  'K01',
  'K08',
  'SP09',
  'H13',
  'S08',
  'SP06',
  'S12',
  'S16',
  'S19',
  'SP08',
  'H01',
  'H11',
  'T04',
  'T06',
  'SP01',
  'H05',
  'SP14',
  'H10',
  'S25',
  'K10',
  'K09',
  'K12',
];

export const METRIC_EVALUATORS: Record<string, MetricEvaluatorFn> = {
  T01: evaluateT01,
  K02: evaluateK02,
  K03: evaluateK03,
  K00: evaluateK00,
  K01: evaluateK01,
  K08: evaluateK08,
  SP09: evaluateSP09,
  H13: evaluateH13,
  S08: evaluateS08,
  SP06: evaluateSP06,
  S12: evaluateS12,
  S16: evaluateS16,
  S19: evaluateS19,
  SP08: evaluateSP08,
  H01: evaluateH01,
  H11: evaluateH11,
  T04: evaluateT04,
  T06: evaluateT06,
  SP01: evaluateSP01,
  H05: evaluateH05,
  SP14: evaluateSP14,
  H10: evaluateH10,
  S25: evaluateS25,
  K10: evaluateK10,
  K09: evaluateK09,
  K12: evaluateK12,
};

export function evaluateMetric(
  ctx: EvaluatorContext,
  metricId: string
): MetricEvaluationResult | null {
  const fn = METRIC_EVALUATORS[metricId];
  if (!fn) return null;
  return fn(ctx);
}
