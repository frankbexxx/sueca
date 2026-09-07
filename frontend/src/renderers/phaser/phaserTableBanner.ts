/**
 * Compact Phaser table banner — avoids duplicating React ScoreStrip / sheets.
 */

import type { TableRenderModel } from '../../table/tableRenderModel';

export function trumpSymbolForSuit(suit: string | null): string {
  if (suit === 'clubs') return '♣';
  if (suit === 'diamonds') return '♦';
  if (suit === 'hearts') return '♥';
  if (suit === 'spades') return '♠';
  return '—';
}

/** Short King negative / festa banner for the Phaser table chrome. */
export function formatKingTableBanner(
  king: NonNullable<TableRenderModel['variantUi']['king']>,
  trumpSuit: string | null,
  locale: 'pt' | 'en' = 'pt'
): { label: string; accent: boolean } {
  const pt = locale === 'pt';
  if (king.waitingForChoice || king.festaPhase) {
    if (king.eightOrNullsPending) {
      return { label: pt ? '8 ou nulos' : '8 or nulls', accent: true };
    }
    if (king.festaPhase === 'auction') {
      return { label: pt ? 'Festa · leilão' : 'Festa · auction', accent: true };
    }
    if (king.festaPhase === 'negotiation' || king.festaPhase === 'negotiation_counter') {
      return { label: pt ? 'Festa · negociação' : 'Festa · negotiation', accent: true };
    }
    if (king.festaPhase === 'fallback' || king.festaPhase === 'setup') {
      return { label: pt ? 'Festa · escolha' : 'Festa · choice', accent: true };
    }
    if (king.phase === 'koh_reveal') {
      return { label: 'KOH', accent: true };
    }
  }

  if (king.contract) {
    const short: Record<string, { pt: string; en: string }> = {
      no_tricks: { pt: 'Vazas', en: 'Tricks' },
      no_hearts: { pt: 'Copas', en: 'Hearts' },
      no_queens: { pt: 'Damas', en: 'Queens' },
      no_men: { pt: 'Homens', en: 'Men' },
      no_king_hearts: { pt: 'King ♥', en: 'K♥' },
      no_last_two: { pt: 'Últimas', en: 'Last 2' }
    };
    const entry = short[king.contract];
    if (entry) {
      return { label: pt ? entry.pt : entry.en, accent: false };
    }
  }

  if (king.noTrump || (!trumpSuit && king.festaMode)) {
    return { label: pt ? 'Sem trunfo' : 'No trump', accent: false };
  }
  if (trumpSuit) {
    return {
      label: pt
        ? `Trunfo ${trumpSymbolForSuit(trumpSuit)}`
        : `Trump ${trumpSymbolForSuit(trumpSuit)}`,
      accent: true
    };
  }
  return { label: pt ? `Jogo ${king.gameIndex + 1}` : `Game ${king.gameIndex + 1}`, accent: false };
}

export interface TableBannerInput {
  variant: TableRenderModel['variant'];
  trumpSuit: string | null;
  heartsPassPhase: boolean;
  kingFestaPhase: boolean;
  kingUi: TableRenderModel['variantUi']['king'] | undefined;
  auctionLocale: 'pt' | 'en';
}

export interface TableBannerPresentation {
  /** Text line (often empty — React owns status). */
  label: string;
  /** Suit glyph; false when React already shows suit status. */
  showSymbol: boolean;
  accent: boolean;
}

/**
 * Prefer React ScoreStrip / bottom sheets for broken/trump/contract detail.
 * Phaser keeps only spatial cues that help read the felt.
 */
export function computeTableBannerPresentation(
  input: TableBannerInput
): TableBannerPresentation {
  const {
    variant,
    trumpSuit,
    heartsPassPhase,
    kingFestaPhase,
    kingUi,
    auctionLocale
  } = input;

  // Sheets own the narrative — keep the felt clear for hand/trick.
  if (heartsPassPhase || kingFestaPhase) {
    return { label: '', showSymbol: false, accent: false };
  }

  if (variant === 'spades' || variant === 'hearts') {
    // SuitBrokenBadge lives in the React strip.
    return { label: '', showSymbol: false, accent: false };
  }

  if (variant === 'sueca') {
    // React shows trump card + dealer; keep a small glyph on the felt only.
    return {
      label: '',
      showSymbol: Boolean(trumpSuit),
      accent: false
    };
  }

  if (variant === 'king' && kingUi) {
    const banner = formatKingTableBanner(kingUi, trumpSuit, auctionLocale);
    return {
      label: banner.label,
      showSymbol: Boolean(trumpSuit) && !kingUi.noTrump,
      accent: banner.accent
    };
  }

  return {
    label: trumpSuit ? `Trunfo ${trumpSymbolForSuit(trumpSuit)}` : '',
    showSymbol: Boolean(trumpSuit),
    accent: false
  };
}
