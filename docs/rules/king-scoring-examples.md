# King — exemplos de pontuação

## Festa negativa (nulos)

Cada jogador recebe `325 − 75 × vazas_ganhas`.

Exemplo: A=5 vazas, B=4, C=2, D=2

| Jogador | Vazas | Cálculo | Pontos |
|---------|-------|---------|--------|
| A | 5 | 325 − 375 | −50 |
| B | 4 | 325 − 300 | 25 |
| C | 2 | 325 − 150 | 175 |
| D | 2 | 325 − 150 | 175 |
| **Total** | 13 | | **325** |

## Leilão positivo (transferência fixa)

Todas as vazas reais valem +25. O valor da oferta é transferido **integralmente** do comprador para o beneficiário:

`transferência = oferta × 25`

### Exemplo canónico

Oferta: **5** vazas (`5 × 25 = 125`).

Vazas reais: beneficiário 2, comprador 3, X 4, Y 4 → brutos `[50, 75, 100, 100]`.

Final:

| Jogador | Bruto | Ajuste | Final |
|---------|-------|--------|-------|
| Beneficiário | 50 | +125 | **175** |
| Comprador | 75 | −125 | **−50** |
| X | 100 | — | **100** |
| Y | 100 | — | **100** |
| **Total** | 325 | 0 | **325** |

O beneficiário pode ficar **acima** do valor nominal da oferta se também ganhou vazas; o comprador paga sempre a oferta completa (pode ficar negativo). Não há top-up parcial nem shortfall por vazas do beneficiário.

### Exemplo legado (beneficiário a 0)

Oferta 6; vazas `[0, 4, 4, 5]` → `[150, −50, 100, 125]` (mesmo par dono/licitante do antigo exemplo resumido).

## 4×3×3

Dono +100 (4×25); cada adversário +75 (3×25); total 325.
