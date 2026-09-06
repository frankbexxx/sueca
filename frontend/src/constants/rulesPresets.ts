import { GameVariant } from '../types/game';

export type RulesPresetId =
  | 'sueca-pt-normal'
  | 'spades-pt-normal'
  | 'spades-pt-nil'
  | 'hearts-us-normal'
  | 'king-pt-normal'
  | 'king-simplified';

export interface RulesPreset {
  id: RulesPresetId;
  variant: GameVariant;
  name: string;
  namePt: string;
  description: string;
  descriptionPt: string;
  isDefault: boolean;
  bullets: string[];
  bulletsPt: string[];
}

export const RULES_PRESETS: Record<RulesPresetId, RulesPreset> = {
  'sueca-pt-normal': {
    id: 'sueca-pt-normal',
    variant: 'sueca',
    name: 'Sueca PT · normal mode',
    namePt: 'Sueca PT · modo normal',
    description: 'Portuguese Sueca — 40 cards, teams, first to 4 hand wins.',
    descriptionPt: 'Sueca portuguesa — 40 cartas, equipas, primeiro a 4 mãos.',
    isDefault: true,
    bullets: [
      '4 players, 2 teams (N↔S, E↔W). 40-card deck.',
      'Follow suit; trump wins if you cannot follow.',
      'Hand scoring: 61–90→1, 91–119→2, 120→4 (capote).',
      '60–60 carry: next hand worth double.',
      'First team to 4 hand wins. Dealing chosen before each deal.'
    ],
    bulletsPt: [
      '4 jogadores, 2 equipas (N↔S, E↔W). Baralho de 40 cartas.',
      'Seguir naipe; trunfo ganha se não puderes seguir.',
      'Pontuação: 61–90→1, 91–119→2, 120→4 (capote).',
      '60–60 transporta: mão seguinte vale o dobro.',
      'Primeiro a 4 mãos. Distribuição escolhida antes de cada deal.'
    ]
  },
  'spades-pt-normal': {
    id: 'spades-pt-normal',
    variant: 'spades',
    name: 'Spades PT · normal mode',
    namePt: 'Spades PT · modo normal',
    description: 'Classic Spades — individual bids summed per team, race to 500.',
    descriptionPt: 'Spades clássico — bids individuais somados por equipa, corrida a 500.',
    isDefault: true,
    bullets: [
      '4 players, 2 teams. Spades always trump; follow suit.',
      'Sequential individual bids (0–13); first bidder drawn at random, then rotates.',
      'Made bid: 10×bid + overtricks (bags). Miss: −10×bid.',
      'Every 10 bags → −100. First team to 500 wins.'
    ],
    bulletsPt: [
      '4 jogadores, 2 equipas. Espadas trunfo; seguir naipe.',
      'Bids individuais sequenciais (0–13); 1.º por sorteio, rotação a cada ronda.',
      'Contrato cumprido: 10×bid + overtricks (bags). Falha: −10×bid.',
      'A cada 10 bags → −100. Primeira equipa a 500 ganha.'
    ]
  },
  'spades-pt-nil': {
    id: 'spades-pt-nil',
    variant: 'spades',
    name: 'Spades PT · nil mode',
    namePt: 'Spades PT · modo nil',
    description: 'Classic Spades with nil and blind nil bids, race to 500.',
    descriptionPt: 'Spades clássico com nil e blind nil, corrida a 500.',
    isDefault: false,
    bullets: [
      'Same as normal mode plus nil (+100/−100) and blind nil (+200/−200).',
      'Sequential bidding; first bidder drawn at random, then rotates each round.',
      'Nil bids add 0 to team contract; bonus scored individually per player.',
      'Made bid: 10×bid + bags. Every 10 bags → −100. First team to 500 wins.'
    ],
    bulletsPt: [
      'Igual ao modo normal mais nil (+100/−100) e blind nil (+200/−200).',
      'Bids sequenciais; 1.º bidder por sorteio, rotação a cada ronda.',
      'Nil conta 0 no contrato de equipa; bónus individual por jogador.',
      'Contrato: 10×bid + bags. A cada 10 bags → −100. Primeira equipa a 500 ganha.'
    ]
  },
  'hearts-us-normal': {
    id: 'hearts-us-normal',
    variant: 'hearts',
    name: 'Hearts US · normal mode',
    namePt: 'Hearts US · modo normal',
    description: 'Classic Hearts — 4 individuals, pass 3 cards, lowest score wins.',
    descriptionPt: 'Hearts clássico — 4 individuais, passar 3 cartas, menor total ganha.',
    isDefault: true,
    bullets: [
      '4 individual players. Avoid hearts (1 pt) and Q♠ (13 pts).',
      'Pass 3 cards: left → right → across → hold.',
      '2♣ opens; on first trick, hearts/Q♠ may not be discarded while another legal card exists; if void in clubs with only penalty cards, one of them may be played.',
      'Shoot the moon: 26 pts → shooter 0, others +26. Game ends at 100+; lowest wins.'
    ],
    bulletsPt: [
      '4 jogadores individuais. Evitar copas (1 pt) e Q♠ (13 pts).',
      'Passar 3 cartas: esquerda → direita → frente → sem passagem.',
      '2♣ abre; na 1ª vaza, Copas/Q♠ só são legais se não houver outra carta legal (void em ♣ só com cartas de penalização).',
      'Shoot the moon: 26 pts → shooter 0, outros +26. Fim aos 100+; ganha quem tem menos.'
    ]
  },
  'king-pt-normal': {
    id: 'king-pt-normal',
    variant: 'king',
    name: 'King PT · normal mode',
    namePt: 'King PT · modo normal',
    description: 'Full Portuguese King — 6 negative contracts, 4 festas with auction, zero-sum.',
    descriptionPt: 'King português completo — 6 negativos, 4 festas com leilão, zero-sum.',
    isDefault: true,
    bullets: [
      '4 individual players. K♥ draw sets festa order; zero-sum (1300 neg + 1300 pos).',
      '6 negative games (no trump): tricks, hearts, queens, men, K♥, last two.',
      'Hearts lead ban (with other suits); forced K♥ play in NO_KING.',
      '4 festas: auction always first; 3 pos = 1 null; 8 or nulls; 4×3×3 if weak bids.',
      'Positive +25/trick; nulls 325−75×tricks; contract settlement preserves +325/round.'
    ],
    bulletsPt: [
      '4 jogadores individuais. Viragem K♥ define ordem; zero-sum (1300 neg + 1300 pos).',
      '6 negativos (sem trunfo): vazas, copas, damas, homens, K♥, duas últimas.',
      'Proibido puxar Copas (com outro naipe); obrigação de jogar K♥ no negativo King.',
      '4 festas: leilão sempre primeiro; 3 pos = 1 nulo; 8 ou nulos; 4×3×3 se ofertas fracas.',
      'Positivo +25/vaza; nulos 325−75×vazas; contratos preservam +325/ronda.'
    ]
  },
  'king-simplified': {
    id: 'king-simplified',
    variant: 'king',
    name: 'King simplified',
    namePt: 'King simplificado',
    description: 'Light variant — 6 generic negative + 4 positive hands, ±5 per trick.',
    descriptionPt: 'Variante leve — 6 negativas genéricas + 4 positivas, ±5 por vaza.',
    isDefault: false,
    bullets: [
      '10 hands: 6 negative (avoid tricks, −5 each), 4 positive (+5 each).',
      'Rotating trump by hand index.',
      'Individual scoring; highest total wins.'
    ],
    bulletsPt: [
      '10 mãos: 6 negativas (evitar vazas, −5 cada), 4 positivas (+5 cada).',
      'Trunfo rotativo por índice de mão.',
      'Pontuação individual; maior total ganha.'
    ]
  }
};

const PRESETS_BY_VARIANT: Record<GameVariant, RulesPresetId[]> = {
  sueca: ['sueca-pt-normal'],
  spades: ['spades-pt-normal', 'spades-pt-nil'],
  hearts: ['hearts-us-normal'],
  king: ['king-pt-normal', 'king-simplified']
};

export function getPreset(id: RulesPresetId): RulesPreset {
  return RULES_PRESETS[id];
}

export function getDefaultPresetId(variant: GameVariant): RulesPresetId {
  return PRESETS_BY_VARIANT[variant].find((pid) => RULES_PRESETS[pid].isDefault) ?? PRESETS_BY_VARIANT[variant][0];
}

export function getPresetsForVariant(variant: GameVariant): RulesPreset[] {
  return PRESETS_BY_VARIANT[variant].map((id) => RULES_PRESETS[id]);
}

export function resolvePresetId(variant: GameVariant, presetId?: string): RulesPresetId {
  const allowed = PRESETS_BY_VARIANT[variant];
  if (presetId && allowed.includes(presetId as RulesPresetId)) {
    return presetId as RulesPresetId;
  }
  return getDefaultPresetId(variant);
}

export function isValidPresetId(value: string): value is RulesPresetId {
  return value in RULES_PRESETS;
}
