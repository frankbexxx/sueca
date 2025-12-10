from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from api.schemas import PlayRequest, PlayResponse
from engine.movegen import legal_moves
from engine.heuristics import choose_card_simple

app = FastAPI(title="Sueca AI Service", version="0.1.0")

# CORS para dev (ajustar para produção com origem específica)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
  return {"status": "ok"}


@app.post("/play", response_model=PlayResponse)
def play(req: PlayRequest):
  legal = legal_moves(req.hand, req.trick, req.trump)
  if not legal:
    raise HTTPException(status_code=400, detail="No legal moves available")
  play, reason = choose_card_simple(req.hand, legal, req.trick, req.trump, req.history or [], req.played or [])
  return PlayResponse(play=play, reason=reason)


@app.options("/play")
def play_options():
  # Handled by CORS middleware; explicit handler to avoid 405 in some environments
  return {}

