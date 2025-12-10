## Plano para próxima sessão

0) Lembrete inicial
- Perguntar: "Francisco, tinhas qualquer coisa para melhorar na GUI?"

1) IA externa / produção
- Definir `REACT_APP_AI_SERVICE_URL` no front (env) apontando para o endpoint Python (depois de deploy).
- Opcional: toggle “Usar IA externa” nas Configurações para fallback local fácil.
- Ajustar CORS no serviço Python para a origem final.

2) Heurística IA (próximos incrementos)
- Proteções adicionais: evitar gastar K/Q se Ás do naipe não saiu (quando não ganha).
- Melhor escolha de descarte (descartar cartas mais fracas/baixas primeiro).
- Micro-simulações ou heurística de vaza (valor da vaza > custo da carta).

3) Testes e integração
- Manter pytest na IA; adicionar mais casos (sobre corte/overtrump com trunfo alto, descarte seguro).
- No front, opcional: permitir ver motivo da jogada (para debug) ou logar no console.

4) Mobile polish (se houver tempo)
- Afinar espaçamentos finais se necessário; pequenas animações de seleção/play.

5) Deploys
- Serviço Python: escolher provider (Render/Fly/Railway/Cloud Run), setar CORS e endpoint público.
- Front: se mudar o env, gerar novo preview (`npx vercel`) e validar em dispositivo.

