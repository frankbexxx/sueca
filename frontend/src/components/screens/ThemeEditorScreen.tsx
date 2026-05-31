import React, { useState, useEffect, useRef } from 'react';
import { HexColorPicker } from 'react-colorful';
import { CustomThemeData, CustomThemeColors } from '../../types/theme';
import { saveCustomTheme, getCustomTheme } from '../../services/customThemeStorage';
import { setActiveTheme } from '../../services/billingService';
import { ShellHeader } from '../navigation/ShellHeader';
import '../../styles/shell-screens.css';
import './ThemeEditorScreen.css';

// --- WCAG helpers -------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [0, 0, 0];
}

function linearize(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = luminance(hex1);
  const l2 = luminance(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function blendHex(a: string, b: string, t = 0.5): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  return `#${[r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t]
    .map((v) => Math.round(v).toString(16).padStart(2, '0'))
    .join('')}`;
}

function contrastLabel(ratio: number): { text: string; cls: string } {
  if (ratio >= 4.5) return { text: `${ratio.toFixed(1)}:1 — AA`, cls: 'contrast--good' };
  if (ratio >= 3.0) return { text: `${ratio.toFixed(1)}:1 — Grande`, cls: 'contrast--ok' };
  return { text: `${ratio.toFixed(1)}:1 — Baixo`, cls: 'contrast--bad' };
}

// --- defaults ------------------------------------------------------------

const DEFAULT_COLORS: CustomThemeColors = {
  bgTop: '#1a2a4a',
  bgBottom: '#0d1a30',
  accent: '#6a9fd8',
  textTitle: '#e8f0f8',
  felt: '#1a4a2a',
};

const COLOR_LABELS: Record<keyof CustomThemeColors, string> = {
  bgTop: 'Fundo (topo)',
  bgBottom: 'Fundo (base)',
  accent: 'Destaque',
  textTitle: 'Títulos',
  felt: 'Tapete',
};

// --- component -----------------------------------------------------------

interface ThemeEditorScreenProps {
  themeId?: string;
  showBack?: boolean;
  onBack?: () => void;
  onSaved?: (id: string) => void;
}

export const ThemeEditorScreen: React.FC<ThemeEditorScreenProps> = ({
  themeId,
  showBack = true,
  onBack,
  onSaved,
}) => {
  const isEdit = !!themeId;
  const [colors, setColors] = useState<CustomThemeColors>(DEFAULT_COLORS);
  const [name, setName] = useState('');
  const [lore, setLore] = useState('');
  const [activePicker, setActivePicker] = useState<keyof CustomThemeColors | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (themeId) {
      const existing = getCustomTheme(themeId);
      if (existing) {
        setColors(existing.colors);
        setName(existing.name);
        setLore(existing.lore);
      }
    }
  }, [themeId]);

  const bgMid = blendHex(colors.bgTop, colors.bgBottom);
  const accentContrast = contrastRatio(colors.accent, bgMid);
  const titleContrast = contrastRatio(colors.textTitle, bgMid);

  const nameValid = name.trim().length >= 3 && name.trim().length <= 30;
  const loreValid = lore.trim().length >= 80 && lore.trim().length <= 300;
  const contrastOk = accentContrast >= 3.0;
  const canSave = nameValid && loreValid && contrastOk;

  const handleSave = () => {
    const id = themeId ?? `custom_${Date.now()}`;
    const theme: CustomThemeData = {
      id,
      name: name.trim(),
      lore: lore.trim(),
      colors,
      createdAt: Date.now(),
    };
    saveCustomTheme(theme);
    setActiveTheme(id);
    onSaved?.(id);
  };

  const handleExport = () => {
    const id = themeId ?? `custom_preview`;
    const data: CustomThemeData = {
      id,
      name: name.trim() || 'sem-nome',
      lore: lore.trim(),
      colors,
      createdAt: Date.now(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tema-${(name.trim() || 'custom').replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string) as Partial<CustomThemeData>;
        if (data.colors) setColors(data.colors);
        if (data.name) setName(data.name);
        if (data.lore) setLore(data.lore);
      } catch {
        // invalid JSON — ignore
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const setColor = (key: keyof CustomThemeColors, value: string) =>
    setColors((prev) => ({ ...prev, [key]: value }));

  const accentLabel = contrastLabel(accentContrast);
  const titleLabel = contrastLabel(titleContrast);

  return (
    <div className="shell-screen screen-theme-editor">
      <ShellHeader
        title={isEdit ? 'Editar tema' : 'Novo tema'}
        showBack={showBack}
        onBack={onBack}
      />

      <div className="theme-editor-body">
        {/* Live preview */}
        <div
          className="theme-editor-preview"
          style={{
            background: `linear-gradient(160deg, ${colors.bgTop} 0%, ${colors.bgBottom} 100%)`,
          }}
        >
          <span className="theme-editor-preview-title" style={{ color: colors.textTitle }}>
            {name.trim() || 'Nome do tema'}
          </span>
          <div className="theme-editor-preview-chips">
            <span
              className="theme-editor-preview-chip"
              style={{ background: colors.accent, color: colors.bgBottom }}
            >
              Destaque
            </span>
            <span
              className="theme-editor-preview-chip theme-editor-preview-chip--felt"
              style={{ background: colors.felt }}
            />
          </div>
        </div>

        {/* Color pickers */}
        <section className="theme-editor-section">
          <h3 className="theme-editor-section-title">Cores</h3>
          <div className="theme-editor-swatches">
            {(Object.keys(DEFAULT_COLORS) as (keyof CustomThemeColors)[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`theme-editor-swatch-row${activePicker === key ? ' theme-editor-swatch-row--active' : ''}`}
                onClick={() => setActivePicker(activePicker === key ? null : key)}
              >
                <span
                  className="theme-editor-swatch"
                  style={{ background: colors[key] }}
                />
                <span className="theme-editor-swatch-label">{COLOR_LABELS[key]}</span>
                <span className="theme-editor-swatch-hex">{colors[key]}</span>
              </button>
            ))}
          </div>
          {activePicker && (
            <div className="theme-editor-picker-wrap">
              <HexColorPicker
                color={colors[activePicker]}
                onChange={(v) => setColor(activePicker, v)}
              />
            </div>
          )}
        </section>

        {/* Contrast */}
        <section className="theme-editor-section">
          <h3 className="theme-editor-section-title">Contraste (WCAG)</h3>
          <div className={`theme-editor-contrast ${accentLabel.cls}`}>
            Destaque / fundo: {accentLabel.text}
          </div>
          <div className={`theme-editor-contrast ${titleLabel.cls}`}>
            Títulos / fundo: {titleLabel.text}
          </div>
        </section>

        {/* Name */}
        <section className="theme-editor-section">
          <label className="theme-editor-label" htmlFor="theme-name">
            Nome
            <span className="theme-editor-chars">{name.length}/30</span>
          </label>
          <input
            id="theme-name"
            className={`theme-editor-input${name.length > 0 && !nameValid ? ' theme-editor-input--error' : ''}`}
            type="text"
            maxLength={30}
            placeholder="3 a 30 caracteres"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </section>

        {/* Lore */}
        <section className="theme-editor-section">
          <label className="theme-editor-label" htmlFor="theme-lore">
            História
            <span className="theme-editor-chars">{lore.length}/300</span>
          </label>
          <textarea
            id="theme-lore"
            className={`theme-editor-textarea${lore.length > 0 && !loreValid ? ' theme-editor-input--error' : ''}`}
            maxLength={300}
            placeholder="80 a 300 caracteres — descreve a origem ou atmosfera deste tema"
            value={lore}
            onChange={(e) => setLore(e.target.value)}
            rows={4}
          />
          {lore.length > 0 && lore.length < 80 && (
            <p className="theme-editor-hint">Faltam {80 - lore.length} caracteres</p>
          )}
        </section>

        {/* Actions */}
        <section className="theme-editor-actions">
          <button
            type="button"
            className="sueca-btn sueca-btn--primary"
            disabled={!canSave}
            onClick={handleSave}
          >
            {isEdit ? 'Guardar alterações' : 'Criar tema'}
          </button>
          <div className="theme-editor-io">
            <button type="button" className="sueca-btn" onClick={handleExport}>
              Exportar JSON
            </button>
            <button type="button" className="sueca-btn" onClick={() => fileRef.current?.click()}>
              Importar JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImport}
            />
          </div>
        </section>
      </div>
    </div>
  );
};
