import { Suit } from '../../../types/game';
import { KingBid, KingFestaMode } from './kingContracts';
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
