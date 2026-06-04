import { Card } from '../../types/game';

export function card(rank: Card['rank'], suit: Card['suit'], id: string): Card {
  return { rank, suit, id };
}

export const C = {
  c2: card('2', 'clubs', '2c'),
  c3: card('3', 'clubs', '3c'),
  c4: card('4', 'clubs', '4c'),
  c5: card('5', 'clubs', '5c'),
  c6: card('6', 'clubs', '6c'),
  c7: card('7', 'clubs', '7c'),
  cJ: card('J', 'clubs', 'Jc'),
  cK: card('K', 'clubs', 'Kc'),
  cA: card('A', 'clubs', 'Ac'),
  d2: card('2', 'diamonds', '2d'),
  d4: card('4', 'diamonds', '4d'),
  d9: card('9', 'diamonds', '9d'),
  dQ: card('Q', 'diamonds', 'Qd'),
  dK: card('K', 'diamonds', 'Kd'),
  dA: card('A', 'diamonds', 'Ad'),
  h2: card('2', 'hearts', '2h'),
  h3: card('3', 'hearts', '3h'),
  h4: card('4', 'hearts', '4h'),
  h5: card('5', 'hearts', '5h'),
  h7: card('7', 'hearts', '7h'),
  hA: card('A', 'hearts', 'Ah'),
  hK: card('K', 'hearts', 'Kh'),
  s2: card('2', 'spades', '2s'),
  s4: card('4', 'spades', '4s'),
  sJ: card('J', 'spades', 'Js'),
  sQ: card('Q', 'spades', 'Qs'),
  sK: card('K', 'spades', 'Ks'),
  sA: card('A', 'spades', 'As'),
  sevenD: card('7', 'diamonds', '7d'),
};
