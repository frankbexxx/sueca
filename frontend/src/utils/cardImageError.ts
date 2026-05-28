import React from 'react';

export function handleCardImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  context?: string
): void {
  if (process.env.NODE_ENV === 'development') {
    const target = event.target as HTMLImageElement;
    console.warn('Card image failed to load', context ?? 'card', target.src);
  }
  (event.target as HTMLImageElement).style.display = 'none';
}
