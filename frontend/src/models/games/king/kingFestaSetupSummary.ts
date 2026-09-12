import { Suit } from '../../../types/game';
import {
  KingActiveContract,
  KingBid,
  KingFestaMode,
  KingPhase,
  kingHudContractPrimary
} from './kingContracts';
import { formatBid } from './kingAuction';

const SUIT_LABEL_PT: Record<Suit, string> = {
  clubs: 'Paus',
  diamonds: 'Ouros',
  hearts: 'Copas',
  spades: 'Espadas'
};

const SUIT_LABEL_EN: Record<Suit, string> = {
  clubs: 'Clubs',
  diamonds: 'Diamonds',
  hearts: 'Hearts',
  spades: 'Spades'
};

const SUIT_SYMBOL: Record<Suit, string> = {
  clubs: '♣',
  diamonds: '♦',
  hearts: '♥',
  spades: '♠'
};

export interface FestaSetupSummaryInput {
  winnerName: string;
  winnerIndex: number | null;
  localPlayerIndex: number;
  bid: KingBid | null;
  festaMode: KingFestaMode | null;
  noTrump: boolean;
  trump: Suit | null;
  firstPlayerName: string;
  firstPlayerIndex: number;
  locale?: 'pt' | 'en';
}

export interface FestaSetupSummaryLines {
  winnerLine: string;
  contractLine: string;
  firstPlayerLine: string;
}

function youLabel(locale: 'pt' | 'en'): string {
  return locale === 'pt' ? 'Tu' : 'You';
}

function displaySeatName(
  name: string,
  seatIndex: number,
  localPlayerIndex: number,
  locale: 'pt' | 'en'
): string {
  if (seatIndex === localPlayerIndex) return youLabel(locale);
  return name;
}

/**
 * Presentation-only summary for festa setup confirm (no scoring / rules).
 */
export function formatFestaFinalContract(
  input: Pick<
    FestaSetupSummaryInput,
    'bid' | 'festaMode' | 'noTrump' | 'trump' | 'locale'
  >
): string {
  const locale = input.locale ?? 'pt';
  const suitLabels = locale === 'pt' ? SUIT_LABEL_PT : SUIT_LABEL_EN;

  if (input.festaMode === 'negative_festa' || input.bid?.bidType === 'null') {
    if (input.bid?.bidType === 'null') {
      return formatBid(input.bid, locale);
    }
    return locale === 'pt' ? 'Nulos' : 'Nulls';
  }

  const amountPart =
    input.bid?.bidType === 'positive'
      ? formatBid(input.bid, locale)
      : locale === 'pt'
        ? 'Positivas'
        : 'Positive';

  if (input.noTrump || !input.trump) {
    if (!input.bid) {
      return locale === 'pt' ? 'Sem trunfo' : 'No trump';
    }
    return locale === 'pt' ? `${amountPart} sem trunfo` : `${amountPart} no trump`;
  }

  const suit = suitLabels[input.trump];
  return locale === 'pt' ? `${amountPart} com ${suit}` : `${amountPart} with ${suit}`;
}

/**
 * Compact contract detail for the live CONTRATO HUD during festa_play.
 * Reuses bid / suit terminology; middle-dot layout matches play strip examples.
 */
export function formatFestaPlayHudDetail(
  input: Pick<
    FestaSetupSummaryInput,
    'bid' | 'festaMode' | 'noTrump' | 'trump' | 'locale'
  >
): string {
  const locale = input.locale ?? 'pt';
  const suitLabels = locale === 'pt' ? SUIT_LABEL_PT : SUIT_LABEL_EN;

  if (input.festaMode === 'negative_festa' || input.bid?.bidType === 'null') {
    if (input.bid?.bidType === 'null') {
      return formatBid(input.bid, locale);
    }
    return locale === 'pt' ? 'Nulos' : 'Nulls';
  }

  const amountPart =
    input.bid?.bidType === 'positive'
      ? formatBid(input.bid, locale)
      : locale === 'pt'
        ? 'Positivas'
        : 'Positive';

  if (input.noTrump || !input.trump) {
    return locale === 'pt'
      ? `${amountPart} · Sem trunfo`
      : `${amountPart} · No trump`;
  }

  const symbol = SUIT_SYMBOL[input.trump];
  const suit = suitLabels[input.trump];
  return `${amountPart} · ${symbol} ${suit}`;
}

export interface KingHudFestaPlayLinesInput {
  gameIndex: number;
  phase: KingPhase;
  festaOwnerName: string;
  activeContract: KingActiveContract | null;
  bestBid: KingBid | null;
  festaMode: KingFestaMode | null;
  noTrumpChosen: boolean;
  chosenTrump: Suit | null;
  /** Fallback if chosenTrump is unset but game trump already applied. */
  trumpSuit?: Suit | null;
  firstPlayerIndex: number | null;
  firstPlayerName: string;
  locale?: 'pt' | 'en';
}

export interface KingHudFestaPlayLines {
  primary: string;
  /** Contract + trump line — only during festa_play. */
  detail: string | null;
  /** First-player line — only during festa_play when index is known. */
  firstPlayer: string | null;
}

function activeContractToBid(
  contract: KingActiveContract | null
): KingBid | null {
  if (!contract) return null;
  return {
    bidderIndex: contract.bidderIndex,
    bidType: contract.bidType,
    amount: contract.amount
  };
}

/**
 * Persistent CONTRATO lines for festa_play (presentation only).
 * Outside festa_play, only the primary festa/negative title is returned.
 */
export function buildKingHudFestaPlayLines(
  input: KingHudFestaPlayLinesInput
): KingHudFestaPlayLines {
  const locale = input.locale ?? 'pt';
  const primary = kingHudContractPrimary(
    input.gameIndex,
    null,
    input.festaOwnerName || null,
    locale
  );

  if (input.phase !== 'festa_play') {
    return { primary, detail: null, firstPlayer: null };
  }

  const bid = activeContractToBid(input.activeContract) ?? input.bestBid;
  const trump = input.noTrumpChosen
    ? null
    : input.chosenTrump ?? input.trumpSuit ?? null;

  const detail = formatFestaPlayHudDetail({
    bid,
    festaMode: input.festaMode,
    noTrump: input.noTrumpChosen || !trump,
    trump,
    locale
  });

  const firstPlayer =
    input.firstPlayerIndex == null
      ? null
      : locale === 'pt'
        ? `1.º jogador: ${input.firstPlayerName}`
        : `1st player: ${input.firstPlayerName}`;

  return { primary, detail, firstPlayer };
}

export function buildFestaSetupSummaryLines(
  input: FestaSetupSummaryInput
): FestaSetupSummaryLines {
  const locale = input.locale ?? 'pt';
  const winner =
    input.winnerIndex == null
      ? locale === 'pt'
        ? '—'
        : '—'
      : displaySeatName(
          input.winnerName,
          input.winnerIndex,
          input.localPlayerIndex,
          locale
        );
  const first = displaySeatName(
    input.firstPlayerName,
    input.firstPlayerIndex,
    input.localPlayerIndex,
    locale
  );

  return {
    winnerLine: locale === 'pt' ? `Vencedor: ${winner}` : `Winner: ${winner}`,
    contractLine:
      locale === 'pt'
        ? `Contrato final: ${formatFestaFinalContract(input)}`
        : `Final contract: ${formatFestaFinalContract(input)}`,
    firstPlayerLine:
      locale === 'pt' ? `Primeiro jogador: ${first}` : `First player: ${first}`
  };
}
