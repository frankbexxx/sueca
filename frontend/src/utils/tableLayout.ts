export type TableCompass = 'north' | 'east' | 'south' | 'west';

const POSITION_MAP: Record<number, TableCompass> = {
  0: 'south',
  1: 'east',
  2: 'north',
  3: 'west'
};

export function getTablePositionForPlayer(
  playerIndex: number,
  localPlayerIndex: number
): TableCompass {
  const offset = (playerIndex - localPlayerIndex + 4) % 4;
  return getTablePosition(offset);
}

export function getTablePosition(playerIndex: number): TableCompass {
  return POSITION_MAP[playerIndex] || 'south';
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const userAgent = navigator.userAgent || navigator.vendor || (window as Window & { opera?: string }).opera || '';
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase()
  );
  return isMobileUA || window.innerWidth <= 768;
}

export function truncatePlayerName(name: string, maxLength = 8): string {
  if (name.length <= maxLength) return name;
  return `${name.substring(0, maxLength - 3)}...`;
}
