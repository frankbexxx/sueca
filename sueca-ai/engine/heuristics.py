from typing import List, Tuple
from engine.state import parse_card

# Basic ordering by rank strength for Sueca (weakest to strongest)
RANK_ORDER = ['2', '3', '4', '5', '6', 'Q', 'J', 'K', '7', 'A']
RANK_VALUE = {r: i for i, r in enumerate(RANK_ORDER)}


def _winning_card(trick: List[str], trump: str) -> Tuple[str, str]:
  """
  Devolve a carta que está a ganhar o trick atual, assumindo que trick está em ordem de jogo.
  """
  if not trick:
    return None
  lead_rank, lead_suit = parse_card(trick[0])
  winning = (lead_rank, lead_suit)
  winning_is_trump = lead_suit == trump
  for card_str in trick[1:]:
    rank, suit = parse_card(card_str)
    is_trump = suit == trump
    if is_trump and not winning_is_trump:
      winning = (rank, suit)
      winning_is_trump = True
    elif is_trump and winning_is_trump:
      if RANK_VALUE[rank] > RANK_VALUE[winning[0]]:
        winning = (rank, suit)
    elif (not is_trump) and (not winning_is_trump) and suit == lead_suit:
      if RANK_VALUE[rank] > RANK_VALUE[winning[0]]:
        winning = (rank, suit)
  return winning


def _aces_seen(history: List[List[str]], trick: List[str], played: List[str]) -> set:
  """
  Retorna o conjunto de naipes cujos Ases já saíram, com base em history + trick atual.
  """
  seen = set()
  for seq in history or []:
    for card in seq:
      rank, suit = parse_card(card)
      if rank == 'A':
        seen.add(suit)
  for card in played or []:
    rank, suit = parse_card(card)
    if rank == 'A':
      seen.add(suit)
  for card in trick:
    rank, suit = parse_card(card)
    if rank == 'A':
      seen.add(suit)
  return seen


def choose_card_simple(hand: List[str], legal: List[str], trick: List[str], trump: str, history: List[List[str]], played: List[str]) -> Tuple[str, str]:
  """
  Heurística simples:
  - Se liderar: joga a mais alta das legais (forçando ganho).
  - Se a seguir: tenta ganhar com a mais baixa que chegue; senão, descarta a mais baixa.
  - Evitar gastar o 7 se o Ás do naipe não saiu e não há ganho garantido.
  """
  aces_seen = _aces_seen(history, trick, played)

  # Se não há trick, somos o primeiro a jogar
  if not trick:
    non7 = [c for c in legal if parse_card(c)[0] != '7']
    if non7:
      chosen = max(non7, key=lambda c: RANK_VALUE[parse_card(c)[0]])
      return chosen, "lead_highest_no7"
    chosen = max(legal, key=lambda c: RANK_VALUE[parse_card(c)[0]])
    return chosen, "lead_highest"

  # Há trick em curso
  led_rank, led_suit = parse_card(trick[0])
  winning = _winning_card(trick, trump)
  # Entre legais, separar por suit
  same_suit = [c for c in legal if parse_card(c)[1] == led_suit]
  trumps = [c for c in legal if parse_card(c)[1] == trump]
  others = [c for c in legal if c not in same_suit and c not in trumps]

  # Se podemos seguir naipe, jogar a mais alta do naipe (para tentar ganhar)
  if same_suit:
    # tentar ganhar com a mais baixa que bata o winning (se for do mesmo naipe e não-trunfo)
    candidates = sorted(same_suit, key=lambda c: RANK_VALUE[parse_card(c)[0]])
    beatable = [c for c in candidates if (winning[1] == led_suit) and RANK_VALUE[parse_card(c)[0]] > RANK_VALUE[winning[0]] and winning[1] != trump]
    if beatable:
      return beatable[0], "follow_suit_win_low"
    # Evitar gastar 7 se o Ás do naipe não saiu; descartar mais baixa que não seja 7
    if led_suit not in aces_seen:
      low_non7 = [c for c in candidates if parse_card(c)[0] != '7']
      if low_non7:
        return low_non7[0], "follow_suit_low_avoid7"
    return candidates[0], "follow_suit_low"

  # Se não temos naipe, mas temos trunfo, jogar trunfo mais baixo
  if trumps:
    candidates = sorted(trumps, key=lambda c: RANK_VALUE[parse_card(c)[0]])
    # Se o trick atual ainda não tem trunfo, basta o mais baixo
    if winning[1] != trump:
      # evitar gastar 7/alto se houver trunfo mais baixo
      low_non7 = [c for c in candidates if parse_card(c)[0] != '7']
      if low_non7:
        return low_non7[0], "cut_with_low_trump_no7"
      return candidates[0], "cut_with_low_trump"
    # Se já há trunfo a ganhar, tenta bater com o mais baixo que chegue; senão descarta o mais baixo
    beatable = [c for c in candidates if RANK_VALUE[parse_card(c)[0]] > RANK_VALUE[winning[0]]]
    if beatable:
      # evitar gastar 7/alto se der para ganhar com outro
      beatable_sorted = sorted(beatable, key=lambda c: RANK_VALUE[parse_card(c)[0]])
      low_non7 = [c for c in beatable_sorted if parse_card(c)[0] != '7']
      if low_non7:
        return low_non7[0], "overtrump_low_no7"
      return beatable_sorted[0], "overtrump_low"
    # não bate -> descarta trunfo mais baixo, evitando 7 se possível
    low_non7 = [c for c in candidates if parse_card(c)[0] != '7']
    if low_non7:
      return low_non7[0], "dump_trump_low_no7"
    return candidates[0], "dump_trump_low"

  # Caso contrário, descartar a mais baixa
  chosen = min(others or legal, key=lambda c: RANK_VALUE[parse_card(c)[0]])
  return chosen, "discard_lowest"

