from typing import List
from engine.state import parse_card, format_card

# Simple legality: must follow suit if possible; otherwise any card.

def legal_moves(hand: List[str], trick: List[str], trump: str) -> List[str]:
  if not hand:
    return []
  if not trick:
    return hand

  # Suit led
  _, led_suit = parse_card(trick[0])
  same_suit_cards = [c for c in hand if parse_card(c)[1] == led_suit]

  if same_suit_cards:
    return same_suit_cards
  return hand

