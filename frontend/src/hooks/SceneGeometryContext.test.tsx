import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SceneGeometryProvider, useSceneGeometrySnapshot } from './SceneGeometryContext';
import { computeAuthoritativeSceneGeometry } from '../runtime/computeAuthoritativeSceneGeometry';

function Consumer() {
  const snap = useSceneGeometrySnapshot();
  return (
    <span data-testid="supported">
      {snap == null ? 'null' : snap.supported ? 'yes' : 'no'}
    </span>
  );
}

function IdentityConsumer({ expected }: { expected: NonNullable<ReturnType<typeof useSceneGeometrySnapshot>> }) {
  const snap = useSceneGeometrySnapshot();
  return <span data-testid="identity">{snap === expected ? 'same' : 'different'}</span>;
}

describe('SceneGeometryContext', () => {
  it('distributes the same authoritative snapshot to consumers without recalculation', () => {
    const computed = computeAuthoritativeSceneGeometry({
      width: 390,
      height: 844,
      safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    expect(computed.ok).toBe(true);
    if (!computed.ok) return;

    render(
      <SceneGeometryProvider value={computed.result}>
        <Consumer />
        <Consumer />
      </SceneGeometryProvider>
    );

    const nodes = screen.getAllByTestId('supported');
    expect(nodes).toHaveLength(2);
    expect(nodes[0].textContent).toBe('yes');
    expect(nodes[1].textContent).toBe('yes');
  });

  it('exposes the same SceneGeometryResult object reference from the provider value', () => {
    const computed = computeAuthoritativeSceneGeometry({
      width: 390,
      height: 844,
      safeInsets: { top: 0, right: 0, bottom: 0, left: 0 }
    });
    expect(computed.ok).toBe(true);
    if (!computed.ok) return;

    render(
      <SceneGeometryProvider value={computed.result}>
        <IdentityConsumer expected={computed.result} />
      </SceneGeometryProvider>
    );

    expect(screen.getByTestId('identity').textContent).toBe('same');
  });
});
