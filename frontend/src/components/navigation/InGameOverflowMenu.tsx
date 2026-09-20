import React, { useEffect, useRef } from 'react';
import './InGameOverflowMenu.css';

export type InGameOverflowAction = 'rules' | 'settings' | 'newGame' | 'exit';

export interface InGameOverflowMenuProps {
  open: boolean;
  menuId: string;
  menuLabel: string;
  anchorRef: React.RefObject<HTMLElement | null>;
  labels: {
    rules: string;
    settings: string;
    newGame: string;
    exit: string;
  };
  onAction: (action: InGameOverflowAction) => void;
  onClose: () => void;
}

/**
 * Compact anchored overflow menu for the in-game top bar (GLOBAL-UI-02).
 * No new dependencies — positioned relative to the More button.
 */
export const InGameOverflowMenu: React.FC<InGameOverflowMenuProps> = ({
  open,
  menuId,
  menuLabel,
  anchorRef,
  labels,
  onAction,
  onClose
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    const first = menuRef.current?.querySelector<HTMLButtonElement>(
      '[data-testid="in-game-overflow-rules"]'
    );
    first?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (menuRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      event.preventDefault();
      event.stopPropagation();
      onCloseRef.current();
    };

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.removeEventListener('pointerdown', onPointerDown, true);
    };
  }, [open, anchorRef]);

  if (!open) return null;

  const run = (action: InGameOverflowAction) => {
    onClose();
    onAction(action);
  };

  return (
    <div
      ref={menuRef}
      id={menuId}
      className="in-game-overflow-menu"
      role="menu"
      aria-label={menuLabel}
      data-testid="in-game-overflow-menu"
    >
      <button
        type="button"
        role="menuitem"
        className="in-game-overflow-item"
        data-testid="in-game-overflow-rules"
        onClick={() => run('rules')}
      >
        <span className="in-game-overflow-icon" aria-hidden>
          📖
        </span>
        <span>{labels.rules}</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className="in-game-overflow-item"
        data-testid="in-game-overflow-settings"
        onClick={() => run('settings')}
      >
        <span className="in-game-overflow-icon" aria-hidden>
          ⚙
        </span>
        <span>{labels.settings}</span>
      </button>
      <div className="in-game-overflow-sep" role="separator" />
      <button
        type="button"
        role="menuitem"
        className="in-game-overflow-item"
        data-testid="in-game-new-game"
        onClick={() => run('newGame')}
      >
        <span>{labels.newGame}</span>
      </button>
      <button
        type="button"
        role="menuitem"
        className="in-game-overflow-item in-game-overflow-item--danger"
        data-testid="in-game-exit"
        onClick={() => run('exit')}
      >
        <span>{labels.exit}</span>
      </button>
    </div>
  );
};
