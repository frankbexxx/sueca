export interface HeartsRulesHint {
  title: string;
  lines: string[];
}

export function getHeartsRulesHint(locale: 'pt' | 'en'): HeartsRulesHint {
  if (locale === 'pt') {
    return {
      title: 'Copas',
      lines: [
        'Copas: 1 pt/carta',
        'Dama Espadas: 13 pts',
        'Tirar a lua: 0 · outros +26'
      ]
    };
  }
  return {
    title: 'Hearts',
    lines: [
      'Hearts: 1 pt each',
      'Q♠: 13 pts',
      'Shoot the moon: 0 · others +26'
    ]
  };
}

export function passDirectionLabel(direction: string, locale: 'pt' | 'en'): string {
  const mapPt: Record<string, string> = {
    left: 'esquerda',
    right: 'direita',
    across: 'frente',
    hold: 'ficar'
  };
  const mapEn: Record<string, string> = {
    left: 'left',
    right: 'right',
    across: 'across',
    hold: 'hold'
  };
  const map = locale === 'pt' ? mapPt : mapEn;
  return map[direction] ?? direction;
}
