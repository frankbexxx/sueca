/**
 * Narrow UI click SFX targeting — used by App document delegation.
 * Keep scope limited to primary buttons / language toggles.
 */

export const UI_CLICK_SELECTOR = '.sueca-btn, .lang-btn';

/**
 * Returns the matching control for a click target, or null when SFX must not play.
 * One match per click (closest); disabled / .disabled controls are skipped.
 */
export function resolveUiClickTarget(eventTarget: EventTarget | null): Element | null {
  if (!eventTarget || !(eventTarget as Element).closest) return null;
  const target = (eventTarget as Element).closest(UI_CLICK_SELECTOR);
  if (!target) return null;
  if (target instanceof HTMLButtonElement && target.disabled) return null;
  if (target.classList.contains('disabled')) return null;
  return target;
}
