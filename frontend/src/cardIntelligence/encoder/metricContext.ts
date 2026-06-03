import { GameVariant } from '../../types/game';
import {
  EncodedDecisionState,
  HeartsEncoding,
  KingEncoding,
  MetricContextEntry,
  SpadesEncoding,
  SuecaEncoding,
  VariantEncoding,
} from './types';

interface MetricDef {
  metricId: string;
  metricNameHuman: string;
  neededFields: string[];
  isApplicable: (state: EncodedDecisionState, enc: VariantEncoding) => boolean;
  reasonShort: (state: EncodedDecisionState, enc: VariantEncoding) => string;
  confidence: (state: EncodedDecisionState, enc: VariantEncoding) => number;
}

function fieldPresent(obj: Record<string, unknown>, field: string): boolean {
  if (!(field in obj)) return false;
  const v = obj[field];
  return v !== null && v !== undefined;
}

function buildEntry(
  def: MetricDef,
  state: EncodedDecisionState,
  enc: VariantEncoding
): MetricContextEntry {
  const missingFields = def.neededFields.filter((f) => {
    const flat: Record<string, unknown> = {
      ...state,
      ...(state.riskContext as unknown as Record<string, unknown>),
      ...(enc as unknown as Record<string, unknown>),
    };
    return !fieldPresent(flat, f);
  });
  const applicable = missingFields.length === 0 && def.isApplicable(state, enc);
  return {
    metricId: def.metricId,
    metricNameHuman: def.metricNameHuman,
    applicable,
    neededFields: def.neededFields,
    missingFields,
    confidence: applicable ? def.confidence(state, enc) : 0.3,
    reasonShort: def.reasonShort(state, enc),
  };
}

const BASE_METRICS: Record<GameVariant, MetricDef[]> = {
  sueca: [
    {
      metricId: 'T01',
      metricNameHuman: 'Jogada legal',
      neededFields: ['legalMoves', 'chosenCard'],
      isApplicable: () => true,
      reasonShort: () => 'Fase de jogada',
      confidence: () => 1,
    },
    {
      metricId: 'S08',
      metricNameHuman: 'Ganhar com carta mínima',
      neededFields: ['canWinCheaply'],
      isApplicable: (_, e) => (e as SuecaEncoding).canWinCheaply !== null,
      reasonShort: () => 'Contexto trick Sueca',
      confidence: () => 0.85,
    },
    {
      metricId: 'S12',
      metricNameHuman: 'Cortar com trunfo mínimo',
      neededFields: ['canCutWithLowestTrump', 'cutRisk'],
      isApplicable: (_, e) =>
        (e as SuecaEncoding).canCutWithLowestTrump !== null ||
        (e as SuecaEncoding).cutRisk !== null,
      reasonShort: () => 'Trunfo e trick',
      confidence: () => 0.85,
    },
    {
      metricId: 'S16',
      metricNameHuman: 'Não abrir manilha antes do Ás',
      neededFields: ['sevensSeenBySuit', 'acesSeenBySuit'],
      isApplicable: (s) => s.trickPosition === 0,
      reasonShort: () => 'Leading trick',
      confidence: () => 0.8,
    },
    {
      metricId: 'S19',
      metricNameHuman: 'Dar pontos ao parceiro só com vaza segura',
      neededFields: ['partnerWinning'],
      isApplicable: (_, e) => (e as SuecaEncoding).partnerWinning !== null,
      reasonShort: (_, e) =>
        (e as SuecaEncoding).partnerWinning ? 'Parceiro a ganhar trick' : 'Parceiro não ganha',
      confidence: () => 0.9,
    },
    {
      metricId: 'T04',
      metricNameHuman: 'Ganhar barato quando desejável',
      neededFields: ['canWinCheaply'],
      isApplicable: (_, e) => (e as SuecaEncoding).canWinCheaply !== null,
      reasonShort: () => 'Economia trick',
      confidence: () => 0.8,
    },
    {
      metricId: 'T05',
      metricNameHuman: 'Não roubar parceiro',
      neededFields: ['partnerWinning'],
      isApplicable: (_, e) => (e as SuecaEncoding).partnerWinning === true,
      reasonShort: () => 'Parceiro a ganhar',
      confidence: () => 0.85,
    },
  ],
  spades: [
    {
      metricId: 'T01',
      metricNameHuman: 'Jogada legal',
      neededFields: ['legalMoves', 'chosenCard'],
      isApplicable: () => true,
      reasonShort: () => 'Fase de jogada',
      confidence: () => 1,
    },
    {
      metricId: 'SP06',
      metricNameHuman: 'Proteger parceiro',
      neededFields: ['partnerWinning'],
      isApplicable: (_, e) => (e as SpadesEncoding).partnerWinning === true,
      reasonShort: () => 'Parceiro a ganhar trick',
      confidence: () => 0.85,
    },
    {
      metricId: 'SP08',
      metricNameHuman: 'Cortar com espada mínima',
      neededFields: ['spadesBroken'],
      isApplicable: (s) => s.trickPosition > 0,
      reasonShort: () => 'Follow trick',
      confidence: () => 0.8,
    },
    {
      metricId: 'SP09',
      metricNameHuman: 'Evitar bag com bid cumprido',
      neededFields: ['avoidBagMode', 'bidMet'],
      isApplicable: (_, e) => (e as SpadesEncoding).avoidBagMode !== null,
      reasonShort: () => 'Gestão bags',
      confidence: () => 0.85,
    },
    {
      metricId: 'T05',
      metricNameHuman: 'Não roubar parceiro',
      neededFields: ['partnerWinning'],
      isApplicable: (_, e) => (e as SpadesEncoding).partnerWinning === true,
      reasonShort: () => 'Parceiro a ganhar',
      confidence: () => 0.85,
    },
    {
      metricId: 'T06',
      metricNameHuman: 'Bid cumprido',
      neededFields: ['bidMet'],
      isApplicable: (_, e) => (e as SpadesEncoding).bidMet !== null,
      reasonShort: (_, e) =>
        (e as SpadesEncoding).bidMet ? 'Equipa atingiu bid' : 'Bid ainda por cumprir',
      confidence: () => 0.85,
    },
  ],
  hearts: [
    {
      metricId: 'T01',
      metricNameHuman: 'Jogada legal',
      neededFields: ['legalMoves', 'chosenCard'],
      isApplicable: () => true,
      reasonShort: () => 'Fase de jogada',
      confidence: () => 1,
    },
    {
      metricId: 'H01',
      metricNameHuman: 'Evitar pontos desnecessários',
      neededFields: ['pointsInTrick'],
      isApplicable: (_, e) => (e as HeartsEncoding).pointsInTrick !== null,
      reasonShort: () => 'Pontos na vaza',
      confidence: () => 0.85,
    },
    {
      metricId: 'H05',
      metricNameHuman: 'Pass / perigo na mão',
      neededFields: ['dangerousCardsInHand'],
      isApplicable: (_, e) => (e as HeartsEncoding).dangerousCardsInHand.length > 0,
      reasonShort: () => 'Cartas perigosas na mão',
      confidence: () => 0.75,
    },
    {
      metricId: 'H11',
      metricNameHuman: 'Q♠ vista / risco',
      neededFields: ['queenSpadesPlayed'],
      isApplicable: () => true,
      reasonShort: (_, e) =>
        (e as HeartsEncoding).queenSpadesPlayed ? 'Q♠ já saiu' : 'Q♠ ainda por sair',
      confidence: () => 0.85,
    },
    {
      metricId: 'H13',
      metricNameHuman: 'Trick seguro e sem pontos',
      neededFields: ['trickIsSafeAndPointless'],
      isApplicable: (_, e) => (e as HeartsEncoding).trickIsSafeAndPointless !== null,
      reasonShort: () => 'Limpar ou alimentar parceiro',
      confidence: () => 0.85,
    },
    {
      metricId: 'T06',
      metricNameHuman: 'Evitar pontos quando possível',
      neededFields: ['pointsInTrick'],
      isApplicable: (_, e) => (e as HeartsEncoding).pointsInTrick !== null,
      reasonShort: () => 'Pontos na vaza',
      confidence: () => 0.8,
    },
    {
      metricId: 'T07',
      metricNameHuman: 'Limpar carta perigosa (P1 alargado)',
      neededFields: ['canCleanDangerousCard'],
      isApplicable: (_, e) => (e as HeartsEncoding).canCleanDangerousCard !== null,
      reasonShort: () => 'Descarte de perigo',
      confidence: () => 0.7,
    },
  ],
  king: [
    {
      metricId: 'T01',
      metricNameHuman: 'Jogada legal',
      neededFields: ['legalMoves', 'chosenCard'],
      isApplicable: () => true,
      reasonShort: () => 'Fase de jogada',
      confidence: () => 1,
    },
    {
      metricId: 'K00',
      metricNameHuman: 'Contrato activo',
      neededFields: ['contractId'],
      isApplicable: (_, e) => (e as KingEncoding).contractId !== null,
      reasonShort: (_, e) => `Contrato ${(e as KingEncoding).contractId}`,
      confidence: () => 0.95,
    },
    {
      metricId: 'K01',
      metricNameHuman: 'Penalizações do contrato',
      neededFields: ['penaltyMap'],
      isApplicable: (_, e) => (e as KingEncoding).penaltyMap !== null,
      reasonShort: () => 'Mapa penalização',
      confidence: () => 0.85,
    },
    {
      metricId: 'K02',
      metricNameHuman: 'K♥ obrigatório 1.ª oportunidade',
      neededFields: ['mustPlayKingHeartsNow'],
      isApplicable: () => true,
      reasonShort: (_, e) =>
        (e as KingEncoding).mustPlayKingHeartsNow
          ? 'Obrigação K♥ activa'
          : 'Sem obrigação K♥',
      confidence: () => 0.95,
    },
    {
      metricId: 'K03',
      metricNameHuman: 'Não puxar copas',
      neededFields: ['cannotLeadHearts'],
      isApplicable: (s) => s.trickPosition === 0,
      reasonShort: () => 'Leading trick King',
      confidence: () => 0.85,
    },
    {
      metricId: 'K08',
      metricNameHuman: 'Fase festa / contrato',
      neededFields: ['festaPhase'],
      isApplicable: (_, e) => (e as KingEncoding).festaPhase !== null,
      reasonShort: () => 'Contexto festa',
      confidence: () => 0.7,
    },
    {
      metricId: 'K09',
      metricNameHuman: 'Positivo económico',
      neededFields: ['contractType'],
      isApplicable: (_, e) =>
        typeof (e as KingEncoding).contractType === 'string' &&
        !(e as KingEncoding).contractType!.startsWith('no_'),
      reasonShort: () => 'Contrato positivo',
      confidence: () => 0.65,
    },
    {
      metricId: 'K12',
      metricNameHuman: 'Modo nulos',
      neededFields: ['nulosMode'],
      isApplicable: (_, e) => (e as KingEncoding).nulosMode !== null,
      reasonShort: () => 'Nulos/festa',
      confidence: () => 0.75,
    },
    {
      metricId: 'T04',
      metricNameHuman: 'Economia trick',
      neededFields: ['contractPenaltiesInTrick'],
      isApplicable: (_, e) => (e as KingEncoding).contractPenaltiesInTrick !== null,
      reasonShort: () => 'Penalização na vaza',
      confidence: () => 0.7,
    },
    {
      metricId: 'T06',
      metricNameHuman: 'Nulos / evitar penalização',
      neededFields: ['nulosMode'],
      isApplicable: (_, e) => (e as KingEncoding).nulosMode === true,
      reasonShort: () => 'Modo nulos activo',
      confidence: () => 0.75,
    },
  ],
};

export function buildMetricContext(state: EncodedDecisionState): MetricContextEntry[] {
  const defs = BASE_METRICS[state.variant] ?? [];
  return defs.map((def) => buildEntry(def, state, state.variantEncoding));
}
