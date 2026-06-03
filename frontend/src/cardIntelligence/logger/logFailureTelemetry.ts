let failureCount = 0;

export function recordLogFailure(error: unknown): void {
  failureCount += 1;
  if (process.env.NODE_ENV !== 'production') {
    console.warn(`[CardIntelligence] log failed (${failureCount} total)`, error);
  }
}

export function getLogFailureCount(): number {
  return failureCount;
}

export function resetLogFailureCountForTests(): void {
  failureCount = 0;
}
