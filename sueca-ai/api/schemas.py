from pydantic import BaseModel, Field
from typing import List, Optional, Literal


Suit = Literal['C', 'D', 'H', 'S']  # clubs, diamonds, hearts, spades


class PlayRequest(BaseModel):
  hand: List[str] = Field(..., description="Cartas na mão, ex: ['AS','KD','5C']")
  trick: List[str] = Field(default_factory=list, description="Cartas já jogadas no trick atual (ordem de jogo)")
  trump: Suit
  played: Optional[List[str]] = Field(default=None, description="Cartas já jogadas na ronda (lista simples), opcional")
  history: Optional[List[List[str]]] = Field(default=None, description="Tricks anteriores (cada trick é lista de cartas na ordem em que foram jogadas)")
  config: Optional[dict] = Field(default=None, description="Parâmetros de modo (ex: fast/accurate)")


class PlayResponse(BaseModel):
  play: str
  reason: str = "heuristic"

