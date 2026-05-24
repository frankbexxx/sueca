import { GameState } from '../types/game';
import { getKingPtState } from '../models/games/KingPtGame';
import {
  kingContractLabel,
  KING_NEGATIVE_GAMES
} from '../models/games/king/kingContracts';
import { formatBid } from '../models/games/king/kingAuction';

export interface KingRulesHint {
  title: string;
  body: string;
}

export function getKingRulesHint(gameState: GameState, locale: 'pt' | 'en'): KingRulesHint | null {
  const king = getKingPtState(gameState);
  const isPt = locale === 'pt';

  if (king.phase === 'koh_reveal') {
    return {
      title: isPt ? 'Viragem K♥' : 'K♥ draw',
      body: isPt
        ? 'A viragem define o 1.º beneficiário das festas. Avança até sair o Rei de Copas.'
        : 'The draw sets the 1st festa beneficiary. Advance until K♥ appears.'
    };
  }

  if (king.gameIndex < KING_NEGATIVE_GAMES && king.contract) {
    const label = kingContractLabel(king.contract, locale);
    const special: string[] = [];
    if (king.contract === 'no_hearts' || king.contract === 'no_king_hearts') {
      special.push(
        isPt
          ? 'Não podes puxar Copas enquanto tiveres outro naipe.'
          : 'You cannot lead hearts while holding another suit.'
      );
    }
    if (king.contract === 'no_king_hearts') {
      special.push(
        isPt
          ? 'Se tiveres o Rei de Copas, deves jogá-lo na primeira oportunidade legal.'
          : 'You must play K♥ on the first legal opportunity.'
      );
    }
    return {
      title: label,
      body: special.length
        ? special.join(' ')
        : isPt
          ? 'Sem trunfo. Segue o naipe puxado.'
          : 'No trump. Follow suit.'
    };
  }

  if (king.festaPhase === 'auction') {
    return {
      title: isPt ? 'Leilão' : 'Auction',
      body: isPt
        ? 'Os 3 jogadores seguintes ao beneficiário ofertam em sequência. 3 positivas = 1 nulo.'
        : 'The 3 players after the beneficiary bid in order. 3 positive = 1 null.'
    };
  }

  if (king.festaPhase === 'negotiation' || king.festaPhase === 'negotiation_counter') {
    const bidText = king.bestBid ? formatBid(king.bestBid, locale) : '';
    const reqText = king.requestedBid ? formatBid(king.requestedBid, locale) : '';
    return {
      title: isPt ? 'Negociação' : 'Negotiation',
      body: isPt
        ? king.festaPhase === 'negotiation_counter'
          ? `Contra-proposta: pedido ${reqText}.`
          : `Aceitar, recusar, pedir subida ou «8 ou nulos». Oferta: ${bidText}.`
        : king.festaPhase === 'negotiation_counter'
          ? `Counter-offer: requested ${reqText}.`
          : `Accept, reject, request raise, or "8 or nulls". Bid: ${bidText}.`
    };
  }

  if (king.waitingForFallback) {
    return {
      title: isPt ? 'Decisão do beneficiário' : 'Beneficiary choice',
      body: isPt
        ? 'Ofertas fracas ou inexistentes. Escolhe trunfo, sem trunfo, nulos ou 4×3×3 (se permitido).'
        : 'Weak or no bids. Choose trump, no trump, nulls, or 4×3×3 (if allowed).'
    };
  }

  if (king.gameIndex >= KING_NEGATIVE_GAMES && king.festaMode === 'negative_festa') {
    return {
      title: isPt ? 'Nulos' : 'Nulls',
      body: isPt
        ? 'Sem trunfo. Cada vaza vale −75 (base +325 por jogador).'
        : 'No trump. Each trick is −75 (base +325 per player).'
    };
  }

  if (king.gameIndex >= KING_NEGATIVE_GAMES && king.festaMode === 'positive') {
    return {
      title: isPt ? 'Positivo' : 'Positive',
      body: isPt
        ? 'Cada vaza vale +25. Trunfo opcional; não és obrigado a cortar.'
        : 'Each trick is +25. Optional trump; no forced trumping.'
    };
  }

  return null;
}
