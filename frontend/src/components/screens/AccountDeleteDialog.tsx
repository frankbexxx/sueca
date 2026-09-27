import React, { useEffect, useId, useRef, useState } from 'react';
import '../VariantModals.css';

export type AccountDeleteChoice = 'keep_local' | 'wipe_local';

export interface AccountDeleteDialogCopy {
  title: string;
  body: string;
  keepLocal: string;
  wipeLocal: string;
  cancel: string;
  wipeConfirmTitle: string;
  wipeConfirmBody: string;
  wipeConfirmAction: string;
}

export interface AccountDeleteDialogProps {
  open: boolean;
  copy: AccountDeleteDialogCopy;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: (choice: AccountDeleteChoice) => void;
}

/**
 * AUTH-01E — two-step account delete confirmation.
 * Keep-local is the default path; local wipe needs an extra confirm.
 */
export const AccountDeleteDialog: React.FC<AccountDeleteDialogProps> = ({
  open,
  copy,
  busy = false,
  onCancel,
  onConfirm
}) => {
  const [step, setStep] = useState<'choose' | 'wipe_confirm'>('choose');
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) {
      setStep('choose');
      return;
    }
    cancelRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) {
        event.preventDefault();
        onCancelRef.current();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, busy]);

  if (!open) return null;

  const title = step === 'choose' ? copy.title : copy.wipeConfirmTitle;
  const message = step === 'choose' ? copy.body : copy.wipeConfirmBody;

  return (
    <div
      className="variant-modal-overlay"
      role="presentation"
      onClick={() => {
        if (!busy) onCancel();
      }}
      data-testid="account-delete-dialog-overlay"
    >
      <div
        className="variant-modal account-delete-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onClick={(event) => event.stopPropagation()}
        data-testid="account-delete-dialog"
        data-step={step}
      >
        <h2 id={titleId}>{title}</h2>
        <p id={messageId} className="variant-modal-hint">
          {message}
        </p>
        <div className="king-festa-actions account-delete-actions">
          <button
            ref={cancelRef}
            type="button"
            className="sueca-btn sueca-btn--secondary"
            disabled={busy}
            onClick={onCancel}
            data-testid="account-delete-cancel"
          >
            {copy.cancel}
          </button>
          {step === 'choose' ? (
            <>
              <button
                type="button"
                className="sueca-btn sueca-btn--primary"
                disabled={busy}
                onClick={() => onConfirm('keep_local')}
                data-testid="account-delete-keep-local"
              >
                {copy.keepLocal}
              </button>
              <button
                type="button"
                className="sueca-btn sueca-btn--danger"
                disabled={busy}
                onClick={() => setStep('wipe_confirm')}
                data-testid="account-delete-wipe-local"
              >
                {copy.wipeLocal}
              </button>
            </>
          ) : (
            <button
              type="button"
              className="sueca-btn sueca-btn--danger"
              disabled={busy}
              onClick={() => onConfirm('wipe_local')}
              data-testid="account-delete-wipe-confirm"
            >
              {copy.wipeConfirmAction}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
