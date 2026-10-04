/**
 * Step 3C — place React decision/ritual surfaces in canonical SceneGeometry zones.
 * Rendering ownership stays in React; geometry authority is SceneGeometry only.
 */

import React from 'react';
import { useSceneGeometrySnapshot } from '../hooks/SceneGeometryContext';
import {
  decisionRectShellStyle,
  decisionSheetRectShellStyle,
  statusPlaqueRectShellStyle
} from '../runtime/canonicalScenePlacement';
import './CanonicalDecisionSurface.css';

export type CanonicalDecisionZone =
  | 'decisionRect'
  | 'decisionSheetRect'
  | 'statusPlaqueRect';

export interface CanonicalDecisionSurfaceProps {
  zone: CanonicalDecisionZone;
  /** Bottom-align sheet content (Hearts/Spades/Festa) vs center plaque (Sueca). */
  align?: 'end' | 'center';
  className?: string;
  testId?: string;
  children: React.ReactNode;
}

/**
 * When authoritative supported geometry is present, exterior = canonical zone.
 * Without it, children render unwrapped (legacy / measuring path).
 */
export const CanonicalDecisionSurface: React.FC<CanonicalDecisionSurfaceProps> = ({
  zone,
  align = 'end',
  className,
  testId,
  children
}) => {
  const snapshot = useSceneGeometrySnapshot();
  const geometry = snapshot?.supported === true ? snapshot.geometry : null;

  const shellStyle = geometry
    ? zone === 'decisionSheetRect'
      ? decisionSheetRectShellStyle(geometry)
      : zone === 'statusPlaqueRect'
        ? statusPlaqueRectShellStyle(geometry)
        : decisionRectShellStyle(geometry)
    : {
        // Measuring / unsupported: shell-local overlay without vh/dvh authority.
        position: 'absolute' as const,
        inset: 0,
        zIndex: 2100,
        overflow: 'hidden' as const,
        pointerEvents: 'none' as const,
        boxSizing: 'border-box' as const
      };

  return (
    <div
      className={[
        'canonical-decision-surface',
        `canonical-decision-surface--${zone}`,
        `canonical-decision-surface--align-${align}`,
        !geometry ? 'canonical-decision-surface--pending' : null,
        className
      ]
        .filter(Boolean)
        .join(' ')}
      style={shellStyle}
      data-testid={testId ?? 'canonical-decision-surface'}
      data-canonical-zone={geometry ? zone : 'pending'}
    >
      <div className="canonical-decision-surface__content">{children}</div>
    </div>
  );
};
