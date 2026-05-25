export interface KingRulesSection {
  title: string;
  titleEn: string;
  body: string[];
  bodyEn: string[];
}

export const KING_PT_RULES_SECTIONS: KingRulesSection[] = [
  {
    title: 'Estrutura',
    titleEn: 'Structure',
    body: [
      '4 jogadores individuais; baralho 52; 13 cartas cada.',
      '10 jogos: 6 negativos + 4 festas. Zero-sum: −1300 + +1300 = 0.',
      'Viragem K♥ define o 1.º beneficiário; 1.º negativo começa no oposto.'
    ],
    bodyEn: [
      '4 individual players; 52-card deck; 13 cards each.',
      '10 games: 6 negative + 4 festas. Zero-sum: −1300 + +1300 = 0.',
      'K♥ draw sets 1st beneficiary; 1st negative starts opposite.'
    ]
  },
  {
    title: 'Negativos (sem trunfo)',
    titleEn: 'Negative games (no trump)',
    body: [
      '1. Não fazer vazas (−20/vaza, total −260)',
      '2. Não fazer copas (−20/copa) — proibido puxar copas com outro naipe',
      '3. Não fazer damas (−50/dama)',
      '4. Não fazer homens (−30, K+V)',
      '5. Não fazer K♥ (−160) — obrigatório jogar K♥ na 1.ª oportunidade legal',
      '6. Não fazer duas últimas (−90 cada)'
    ],
    bodyEn: [
      '1. No tricks (−20/trick)',
      '2. No hearts (−20/heart) — cannot lead hearts with other suits',
      '3. No queens (−50/queen)',
      '4. No men (−30, K+J)',
      '5. No K♥ (−160) — must play K♥ first legal chance',
      '6. No last two (−90 each)'
    ]
  },
  {
    title: 'Festas e leilão',
    titleEn: 'Festas and auction',
    body: [
      'Leilão sempre primeiro (3 licitadores). Equivalência: 3 positivas = 1 nulo.',
      'Preferência sequencial; se todos passarem → beneficiário decide.',
      'Negociação: aceitar, recusar, pedir subida, ou «8 ou nulos».',
      '«8 ou nulos»: adversário deve oferecer 8 positivas; se oferecer, beneficiário aceita.',
      '4×3×3 só se melhor oferta &lt; 4 positivas equivalentes.',
      'Positivo: +25/vaza. Nulos: 325 − 75×vazas (sempre sem trunfo).'
    ],
    bodyEn: [
      'Auction always first (3 bidders). Equivalence: 3 positive = 1 null.',
      'Sequential preference; if all pass → beneficiary decides.',
      'Negotiation: accept, reject, request raise, or "8 or nulls".',
      '"8 or nulls": opponent must offer 8 positive; if offered, must accept.',
      '4×3×3 only if best bid &lt; 4 positive equivalent.',
      'Positive: +25/trick. Nulls: 325 − 75×tricks (always no trump).'
    ]
  },
  {
    title: 'Invariantes',
    titleEn: 'Invariants',
    body: [
      'Cada negativo tem total fixo; cada festa +325; soma global 0.',
      'Contrato positivo: beneficiário recebe sempre o contratado; leiloado paga shortfall.',
      'Leilão nulo: transferência contabilística (ex. 2 nulos → +475 / +175 vs base 325).'
    ],
    bodyEn: [
      'Each negative has fixed total; each festa +325; global sum 0.',
      'Positive contract: beneficiary always gets contracted; bidder pays shortfall.',
      'Null auction: accounting transfer (e.g. 2 nulls → +475 / +175 vs base 325).'
    ]
  }
];
