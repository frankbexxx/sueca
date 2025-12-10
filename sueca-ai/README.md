# Sueca AI Service (Python/FastAPI)

Serviço autónomo de IA para o jogo de Sueca. Expõe um endpoint `/play` que recebe o estado do jogo e devolve a carta sugerida para jogar. Integra com o front-end (TS/React/Vercel) via HTTP.

## Arquitetura (MVP)
- FastAPI + Uvicorn.
- `engine/`: regras básicas, geração de jogadas legais, heurística simples.
- `/play` (POST): recebe estado mínimo e devolve `{"play": "<card>"}`.

## Estrutura
```
sueca-ai/
  api/
    main.py       # App FastAPI e endpoint /play
    schemas.py    # Modelos Pydantic de request/response
  engine/
    state.py      # Representação de estado
    movegen.py    # Jogadas legais
    heuristics.py # Escolha de carta (heurística simples)
  tests/
    test_movegen.py
  requirements.txt
```

## Endpoint /play (MVP)
POST `/play`
```json
{
  "hand": ["AS", "KD", "5C"],
  "trick": ["2S", "3S"],          // cartas já jogadas no trick atual (string "RankSuit")
  "trump": "S",                   // 'C','D','H','S'
  "history": [],                  // opcional, futuro
  "config": { "mode": "fast" }    // reservado para modos futuros
}
```
Resposta:
```json
{ "play": "AS", "reason": "highest_in_trick" }
```

## Executar local
```
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

## Próximos passos
- Melhorar heurísticas (conservar trunfo, seguir naipe sempre, cortar com trunfo se ganhar, largar baixa se perder).
- Validar estado com regras completas (10 cartas por mão, tracking de cartas saídas).
- Cache e logging de decisões.

