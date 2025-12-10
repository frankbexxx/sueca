from engine.heuristics import choose_card_simple


def run_case(hand, legal, trick, trump, history=None, played=None):
    return choose_card_simple(hand, legal, trick, trump, history or [], played or [])


def test_lead_avoids_7_if_possible():
    hand = ["7S", "5S", "KS"]
    legal = hand[:]  # leading
    trick = []
    trump = "H"
    play, reason = run_case(hand, legal, trick, trump)
    assert play != "7S", f"Should not lead 7 if other cards exist. Got {play}, reason={reason}"


def test_follow_suit_avoids_7_if_ace_not_seen_and_not_winning():
    hand = ["7S", "5S"]
    legal = hand[:]  # must follow S
    trick = ["2S"]  # lead S, currently winning 2S
    trump = "H"
    history = []  # no ace seen
    play, reason = run_case(hand, legal, trick, trump, history)
    assert play == "5S", f"Should avoid 7 when Ace not seen and cannot win. Got {play}, reason={reason}"


def test_follow_suit_can_use_7_if_only_card():
    hand = ["7S"]
    legal = hand[:]
    trick = ["QS"]
    trump = "H"
    history = []  # no ace seen
    play, reason = run_case(hand, legal, trick, trump, history)
    assert play == "7S", f"Only card is 7, must play it. Got {play}, reason={reason}"


def test_cut_trump_avoids_7_if_lower_trump_exists():
    hand = ["7H", "2H"]
    legal = hand[:]  # no suit, will cut with trump
    trick = ["2S", "3S"]
    trump = "H"
    history = []
    played = []
    play, reason = run_case(hand, legal, trick, trump, history, played)
    assert play == "2H", f"Should cut with lower trump, not 7. Got {play}, reason={reason}"


def test_overtrump_avoids_7_if_other_beats():
    hand = ["7H", "QH"]
    legal = hand[:]
    trick = ["2S", "3H"]  # trump in trick (3H winning)
    trump = "H"
    history = []
    play, reason = run_case(hand, legal, trick, trump, history)
    assert play == "QH", f"Should overtrump with lowest that wins (QH) not 7H. Got {play}, reason={reason}"

