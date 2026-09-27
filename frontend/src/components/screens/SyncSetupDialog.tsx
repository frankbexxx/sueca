/**
 * SYNC-01D — Conta first-link / account-switch dialog.
 */
import React, { useEffect, useId, useRef } from 'react';
import '../VariantModals.css';

export type SyncSetupMode = 'info_a' | 'prefs_c' | 'account_switch' | 'seed_mismatch' | 'busy' | 'error';

export interface SyncSetupDialogCopy {
  title: string;
  body: string;
  infoConfirm: string;
  prefsTitle: string;
  prefsBody: string;
  prefsDevice: string;
  prefsCloud: string;
  switchTitle: string;
  switchBody: string;
  switchUseCloud: string;
  switchStay: string;
  seedMismatchTitle: string;
  seedMismatchBody: string;
  cancel: string;
  busy: string;
  error: string;
  retry: string;
}

export interface SyncSetupDialogProps {
  open: boolean;
  mode: SyncSetupMode;
  copy: SyncSetupDialogCopy;
  busy?: boolean;
  onCancel: () => void;
  onConfirmInfo: () => void;
  onChoosePrefs: (choice: 'device' | 'cloud') => void;
  onSwitchUseCloud: () => void;
  onSwitchStay: () => void;
  onRetry?: () => void;
}

export const SyncSetupDialog: React.FC<SyncSetupDialogProps> = ({
  open,
  mode,
  copy,
  busy = false,
  onCancel,
  onConfirmInfo,
  onChoosePrefs,
  onSwitchUseCloud,
  onSwitchStay,
  onRetry
}) => {
  const titleId = useId();
  const messageId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    if (!open) return;
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

  let title = copy.title;
  let body = copy.body;
  if (mode === 'prefs_c') {
    title = copy.prefsTitle;
    body = copy.prefsBody;
  } else if (mode === 'account_switch') {
    title = copy.switchTitle;
    body = copy.switchBody;
  } else if (mode === 'seed_mismatch') {
    title = copy.seedMismatchTitle;
    body = copy.seedMismatchBody;
  } else if (mode === 'busy') {
    title = copy.title;
    body = copy.busy;
  } else if (mode === 'error') {
    title = copy.title;
    body = copy.error;
  }

  return (
    <div
      className="variant-modal-overlay"
      role="presentation"
      onClick={() => {
        if (!busy) onCancel();
      }}
      data-testid="sync-setup-dialog-overlay"
    >
      <div
        className="variant-modal sync-setup-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onClick={(e) => e.stopPropagation()}
        data-testid="sync-setup-dialog"
      >
        <h2 id={titleId}>{title}</h2>
        <p id={messageId}>{body}</p>

        {mode === 'info_a' && (
          <div className="variant-modal-actions">
            <button
              type="button"
              className="variant-modal-btn primary"
              disabled={busy}
              onClick={onConfirmInfo}
              data-testid="sync-setup-info-confirm"
            >
              {copy.infoConfirm}
            </button>
            <button
              type="button"
              className="variant-modal-btn"
              ref={cancelRef}
              disabled={busy}
              onClick={onCancel}
            >
              {copy.cancel}
            </button>
          </div>
        )}

        {mode === 'prefs_c' && (
          <div className="variant-modal-actions">
            <button
              type="button"
              className="variant-modal-btn primary"
              disabled={busy}
              onClick={() => onChoosePrefs('device')}
              data-testid="sync-setup-prefs-device"
            >
              {copy.prefsDevice}
            </button>
            <button
              type="button"
              className="variant-modal-btn primary"
              disabled={busy}
              onClick={() => onChoosePrefs('cloud')}
              data-testid="sync-setup-prefs-cloud"
            >
              {copy.prefsCloud}
            </button>
            <button
              type="button"
              className="variant-modal-btn"
              ref={cancelRef}
              disabled={busy}
              onClick={onCancel}
            >
              {copy.cancel}
            </button>
          </div>
        )}

        {mode === 'account_switch' && (
          <div className="variant-modal-actions">
            <button
              type="button"
              className="variant-modal-btn primary"
              disabled={busy}
              onClick={onSwitchUseCloud}
              data-testid="sync-setup-switch-use-cloud"
            >
              {copy.switchUseCloud}
            </button>
            <button
              type="button"
              className="variant-modal-btn"
              disabled={busy}
              onClick={onSwitchStay}
              data-testid="sync-setup-switch-stay"
            >
              {copy.switchStay}
            </button>
            <button
              type="button"
              className="variant-modal-btn"
              ref={cancelRef}
              disabled={busy}
              onClick={onCancel}
            >
              {copy.cancel}
            </button>
          </div>
        )}

        {(mode === 'seed_mismatch' || mode === 'error') && (
          <div className="variant-modal-actions">
            {onRetry && mode === 'error' && (
              <button
                type="button"
                className="variant-modal-btn primary"
                disabled={busy}
                onClick={onRetry}
                data-testid="sync-setup-retry"
              >
                {copy.retry}
              </button>
            )}
            <button
              type="button"
              className="variant-modal-btn"
              ref={cancelRef}
              disabled={busy}
              onClick={onCancel}
            >
              {copy.cancel}
            </button>
          </div>
        )}

        {mode === 'busy' && (
          <div className="variant-modal-actions">
            <button type="button" className="variant-modal-btn" disabled>
              {copy.busy}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
