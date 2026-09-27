import React from 'react';
import { isBuiltInThemeId } from '../../constants/themeRegistry';
import './ThemePreviewChip.css';

export type ThemePreviewCustomColors = {
  bgTop: string;
  bgBottom: string;
  accent: string;
  felt: string;
  textTitle?: string;
};

type ThemePreviewChipProps = {
  themeId: string;
  customColors?: ThemePreviewCustomColors;
  className?: string;
};

/**
 * Compact theme preview using live CSS tokens via `.app-shell[data-theme]`
 * for built-ins (no duplicated colour tables). Custom themes pass colours inline.
 */
export const ThemePreviewChip: React.FC<ThemePreviewChipProps> = ({
  themeId,
  customColors,
  className = ''
}) => {
  const builtIn = isBuiltInThemeId(themeId);
  const style = !builtIn && customColors
    ? ({
        ['--sc-canvas-from' as string]: customColors.bgTop,
        ['--sc-canvas-to' as string]: customColors.bgBottom,
        ['--sc-accent' as string]: customColors.accent,
        ['--sc-felt' as string]: customColors.felt,
        ['--sc-surface' as string]: customColors.bgBottom,
        ['--sc-surface-border' as string]: 'rgba(255,255,255,0.18)',
        ['--sc-text-title' as string]: customColors.textTitle || '#f5f0e8'
      } as React.CSSProperties)
    : undefined;

  return (
    <div
      className={`app-shell theme-preview-chip ${className}`.trim()}
      data-theme={builtIn ? themeId : undefined}
      style={style}
      aria-hidden="true"
      data-testid={`theme-preview-${themeId}`}
    >
      <div className="theme-preview-chip__canvas">
        <div className="theme-preview-chip__felt" />
        <div className="theme-preview-chip__surface" />
        <div className="theme-preview-chip__accent" />
      </div>
    </div>
  );
};
