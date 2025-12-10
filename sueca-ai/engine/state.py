from typing import List, Tuple

Card = Tuple[str, str]  # (rank, suit)

def parse_card(card_str: str) -> Card:
  return card_str[:-1], card_str[-1]

def format_card(card: Card) -> str:
  rank, suit = card
  return f"{rank}{suit}"

