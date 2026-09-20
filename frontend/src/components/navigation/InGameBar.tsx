import React, { useEffect, useId, useRef, useState } from 'react';
import { useLanguage } from '../../i18n/useLanguage';
import { ConfirmDialog } from '../common/ConfirmDialog';
import {
  InGameOverflowAction,
  InGameOverflowMenu
} from './InGameOverflowMenu';
import './InGameBar.css';

/** Conservative press-label hold window (ms). OPEN for later visual tuning. */
export const IN_GAME_BAR_TOUCH_LABEL_MS = 320;

type PendingConfirm = 'newGame' | 'exit' | null;

interface InGameBarProps {
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onNewGame: () => void;
  onPinGame?: () => void;
  onExit: () => void;
  onOpenRules: () => void;
  onOpenSettings: () => void;
}

interface IconControlProps {
  testId: string;
  icon: string;
  label: string;
  onActivate: () => void;
  /** When true, pointerdown opens immediately without press-label gate (More). */
  immediate?: boolean;
  pressed?: boolean;
  ariaExpanded?: boolean;
  ariaControls?: string;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

/**
 * Icon control with desktop tooltip + mobile press→label→release activate.
 * Executes at most once per gesture (guards pointerup + click double-fire).
 */
const InGameIconControl: React.FC<IconControlProps> = ({
  testId,
  icon,
  label,
  onActivate,
  immediate = false,
  pressed: pressedProp,
  ariaExpanded,
  ariaControls,
  buttonRef
}) => {
  const [pressed, setPressed] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const armedRef = useRef(false);
  const suppressClickRef = useRef(false);
  const labelTimerRef = useRef<number | null>(null);

  const clearLabelTimer = () => {
    if (labelTimerRef.current != null) {
      window.clearTimeout(labelTimerRef.current);
      labelTimerRef.current = null;
    }
  };

  useEffect(() => () => clearLabelTimer(), []);

  const resetGesture = () => {
    armedRef.current = false;
    setPressed(false);
    setShowLabel(false);
    clearLabelTimer();
  };

  const onPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    if (immediate) return;
    armedRef.current = true;
    setPressed(true);
    setShowLabel(true);
    clearLabelTimer();
    // Conservative hold constant — documents tunable press-label window (not final product timing).
    labelTimerRef.current = window.setTimeout(() => {
      /* label remains while pressed */
    }, IN_GAME_BAR_TOUCH_LABEL_MS);
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
  };

  const onPointerUp = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (immediate) return;
    if (!armedRef.current) return;
    resetGesture();
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* ignore */
    }
    suppressClickRef.current = true;
    onActivate();
  };

  const onPointerCancel = () => {
    if (immediate) return;
    resetGesture();
  };

  const onClick = () => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onActivate();
  };

  const isPressed = pressedProp ?? pressed;

  return (
    <button
      ref={buttonRef as React.RefObject<HTMLButtonElement>}
      type="button"
      className={`in-game-bar-icon-btn${isPressed ? ' is-pressed' : ''}${
        showLabel ? ' is-label-visible' : ''
      }`}
      data-testid={testId}
      data-tooltip={label}
      aria-label={label}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      title={label}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
      onClick={onClick}
    >
      <span className="in-game-bar-icon" aria-hidden>
        {icon}
      </span>
      <span className="in-game-bar-press-label" aria-hidden>
        {label}
      </span>
    </button>
  );
};

export const InGameBar: React.FC<InGameBarProps> = ({
  isPaused,
  onPause,
  onResume,
  onNewGame,
  onPinGame,
  onExit,
  onOpenRules,
  onOpenSettings
}) => {
  const { t } = useLanguage();
  const [pending, setPending] = useState<PendingConfirm>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  const menuDomId = useId();

  const closeDialog = () => setPending(null);

  const handleConfirm = () => {
    const kind = pending;
    setPending(null);
    if (kind === 'newGame') onNewGame();
    if (kind === 'exit') onExit();
  };

  const closeMenu = () => {
    setMenuOpen(false);
    window.requestAnimationFrame(() => moreRef.current?.focus());
  };

  const handleOverflowAction = (action: InGameOverflowAction) => {
    if (action === 'rules') onOpenRules();
    if (action === 'settings') onOpenSettings();
    if (action === 'newGame') setPending('newGame');
    if (action === 'exit') setPending('exit');
  };

  const pauseLabel = isPaused ? t.gameMenu.resume : t.gameMenu.pause;

  return (
    <div
      className="in-game-bar in-game-bar--rail"
      data-testid="in-game-bar"
      data-layout="vertical-rail"
      role="toolbar"
      aria-orientation="vertical"
      aria-label={t.gameMenu.gameControls}
    >
      <div className="in-game-bar-actions">
        <InGameIconControl
          testId="in-game-pause"
          icon={isPaused ? '▶' : '⏸'}
          label={pauseLabel}
          onActivate={() => (isPaused ? onResume() : onPause())}
        />
        {onPinGame ? (
          <InGameIconControl
            testId="in-game-pin"
            icon="📌"
            label={t.inGame.pinGame}
            onActivate={onPinGame}
          />
        ) : null}
        <div className="in-game-bar-more-wrap">
          <InGameIconControl
            testId="in-game-more"
            icon="⋯"
            label={t.inGame.more}
            immediate
            pressed={menuOpen}
            ariaExpanded={menuOpen}
            ariaControls={menuOpen ? menuDomId : undefined}
            buttonRef={moreRef}
            onActivate={() => setMenuOpen((open) => !open)}
          />
        </div>
      </div>

      <InGameOverflowMenu
        open={menuOpen}
        menuId={menuDomId}
        menuLabel={t.inGame.more}
        anchorRef={moreRef}
        labels={{
          rules: t.nav.rules,
          settings: t.moreScreen.settings,
          newGame: t.inGame.newGame,
          exit: t.inGame.exitGame
        }}
        onAction={handleOverflowAction}
        onClose={closeMenu}
      />

      <ConfirmDialog
        open={pending === 'newGame'}
        title={t.inGame.newGame}
        message={t.inGame.newGameConfirm}
        confirmLabel={t.inGame.newGame}
        cancelLabel={t.gameMenu.cancel}
        destructive
        onConfirm={handleConfirm}
        onCancel={closeDialog}
      />
      <ConfirmDialog
        open={pending === 'exit'}
        title={t.inGame.exit}
        message={t.inGame.leaveConfirm}
        confirmLabel={t.inGame.exit}
        cancelLabel={t.gameMenu.cancel}
        destructive
        onConfirm={handleConfirm}
        onCancel={closeDialog}
      />
    </div>
  );
};
