from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from api.schemas import PlayRequest, PlayResponse
from engine.movegen import legal_moves
from engine.heuristics import choose_card_simple
import os
import logging

app = FastAPI(title="Sueca AI Service", version="0.1.0")

# CORS - Permitir apenas origens permitidas (produção) ou todas (dev)
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"  # Dev defaults
).split(",")

# Logging configurável via env LOG_LEVEL (default INFO)
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("sueca_ai")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
  return {"status": "ok"}


@app.post("/play", response_model=PlayResponse)
def play(req: PlayRequest):
  logger.info(
    "play request | hand=%s trick=%s trump=%s played=%s history=%s",
    req.hand, req.trick, req.trump, req.played, bool(req.history)
  )
  legal = legal_moves(req.hand, req.trick, req.trump)
  if not legal:
    raise HTTPException(status_code=400, detail="No legal moves available")
  play, reason = choose_card_simple(req.hand, legal, req.trick, req.trump, req.history or [], req.played or [])
  logger.info("play response | play=%s reason=%s", play, reason)
  return PlayResponse(play=play, reason=reason)


@app.options("/play")
def play_options():
  # Handled by CORS middleware; explicit handler to avoid 405 in some environments
  return {}

