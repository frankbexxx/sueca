# Mobile audit — Build 1 (Maio 2026)

Viewport alvo: **360×800**, **414×896**.

## Smoke produção

| Item | Resultado |
|------|-----------|
| HTTPS 200 | OK — `frontend-mu-five-18.vercel.app` |
| Testes locais (10) | OK |
| Build local | OK |

## Problemas encontrados (antes do Build 2)

1. Mão do Sul: `min-width: 250px` + espaçamento 18px — risco de overflow em 360px.
2. Botões Continue: altura &lt; 48px em mobile.
3. Mesa (`--table-size`) ocupa demasiada altura vertical — comprime mão/botões.
4. Top strip (3 colunas) — texto pequeno mas legível; trunfo OK.

## Correções aplicadas (Build 2)

Ver commit: media queries `max-width: 430px`, `--card-spacing` reduzido, `min-height: 48px` em botões, layout compacto vertical.

## Verificação manual (tu)

- [ ] 360×800: 10 cartas clicáveis
- [ ] 414×896: idem
- [ ] 1 jogo completo sem bloqueio
