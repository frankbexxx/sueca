from engine.movegen import legal_moves

def test_follow_suit():
  hand = ["2S", "5H", "7S"]
  trick = ["3S"]
  trump = "H"
  result = legal_moves(hand, trick, trump)
  assert set(result) == {"2S", "7S"}

def test_no_suit_any_card():
  hand = ["2H", "5H", "7H"]
  trick = ["3S"]
  trump = "D"
  result = legal_moves(hand, trick, trump)
  assert set(result) == set(hand)

