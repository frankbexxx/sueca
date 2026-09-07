import React, { useEffect, useId, useRef } from 'react';
import '../VariantModals.css';

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** When true, confirm uses danger styling and cancel receives initial focus. */
  destructive?: boolean;
}

/**
 * In-app confirm modal (Capacitor/WebView-safe alternative to window.confirm).
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  destructive = false
}) => {
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return;
    const focusTarget = destructive ? cancelRef.current : confirmRef.current;
    focusTarget?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancelRef.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, destructive]);

  if (!open) return null;

  return (
    <div
      className="variant-modal-overlay"
      role="presentation"
      onClick={onCancel}
      data-testid="confirm-dialog-overlay"
    >
      <div
        className="variant-modal dobo-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={messageId}
        onClick={(event) => event.stopPropagation()}
        data-testid="confirm-dialog"
      >
        {title ? <h2 id={titleId}>{title}</h2> : null}
        <p id={messageId} className="variant-modal-hint">
          {message}
        </p>
        <div className="king-festa-actions">
          <button
            ref={cancelRef}
            type="button"
            className="sueca-btn sueca-btn--secondary"
            onClick={onCancel}
            data-testid="confirm-dialog-cancel"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={
              destructive ? 'sueca-btn sueca-btn--danger' : 'sueca-btn sueca-btn--primary'
            }
            onClick={onConfirm}
            data-testid="confirm-dialog-confirm"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
