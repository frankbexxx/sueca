import React from 'react';
import ReactDOM from 'react-dom';
import { act } from 'react-dom/test-utils';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    ReactDOM.unmountComponentAtNode(container);
    container.remove();
  });

  it('does not render when closed', () => {
    act(() => {
      ReactDOM.render(
        <ConfirmDialog
          open={false}
          message="msg"
          confirmLabel="OK"
          cancelLabel="Cancel"
          onConfirm={() => undefined}
          onCancel={() => undefined}
        />,
        container
      );
    });
    expect(container.querySelector('[data-testid="confirm-dialog"]')).toBeNull();
  });

  it('calls onConfirm once and not onCancel', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    act(() => {
      ReactDOM.render(
        <ConfirmDialog
          open
          message="msg"
          confirmLabel="OK"
          cancelLabel="Cancel"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />,
        container
      );
    });
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="confirm-dialog-confirm"]')?.click();
    });
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel once via cancel button', () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    act(() => {
      ReactDOM.render(
        <ConfirmDialog
          open
          message="msg"
          confirmLabel="OK"
          cancelLabel="Cancel"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />,
        container
      );
    });
    act(() => {
      container.querySelector<HTMLButtonElement>('[data-testid="confirm-dialog-cancel"]')?.click();
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('cancels on Escape', () => {
    const onCancel = jest.fn();
    act(() => {
      ReactDOM.render(
        <ConfirmDialog
          open
          message="msg"
          confirmLabel="OK"
          cancelLabel="Cancel"
          onConfirm={() => undefined}
          onCancel={onCancel}
        />,
        container
      );
    });
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('cancels on overlay click', () => {
    const onCancel = jest.fn();
    act(() => {
      ReactDOM.render(
        <ConfirmDialog
          open
          message="msg"
          confirmLabel="OK"
          cancelLabel="Cancel"
          onConfirm={() => undefined}
          onCancel={onCancel}
        />,
        container
      );
    });
    act(() => {
      container.querySelector<HTMLElement>('[data-testid="confirm-dialog-overlay"]')?.click();
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('uses danger class when destructive', () => {
    act(() => {
      ReactDOM.render(
        <ConfirmDialog
          open
          message="msg"
          confirmLabel="Delete"
          cancelLabel="Cancel"
          destructive
          onConfirm={() => undefined}
          onCancel={() => undefined}
        />,
        container
      );
    });
    const confirm = container.querySelector('[data-testid="confirm-dialog-confirm"]');
    expect(confirm?.className).toContain('sueca-btn--danger');
  });
});
