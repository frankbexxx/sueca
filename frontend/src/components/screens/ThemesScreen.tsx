import React, { useState } from 'react';
import {
  ThemeId,
  getActiveTheme,
  setActiveTheme
} from '../../services/billingService';
import { useLanguage } from '../../i18n/useLanguage';
import { ShellHeader } from '../navigation/ShellHeader';
import '../../styles/shell-screens.css';
import './ThemesScreen.css';

interface ThemesScreenProps {
  showBack?: boolean;
  onBack?: () => void;
  onThemeChange?: (theme: ThemeId) => void;
}

interface ThemeEntry {
  id: ThemeId;
  labelPt: string;
  labelEn: string;
  lorePt: string;
}

export const ThemesScreen: React.FC<ThemesScreenProps> = ({
  showBack = false,
  onBack,
  onThemeChange
}) => {
  const { t, language } = useLanguage();
  const [active, setActive] = useState<ThemeId>(() => getActiveTheme());
  const [expandedId, setExpandedId] = useState<ThemeId | null>(null);

  const applyTheme = (theme: ThemeId) => {
    setActiveTheme(theme);
    setActive(theme);
    onThemeChange?.(theme);
  };

  const toggleLore = (id: ThemeId, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const themes: ThemeEntry[] = [
    {
      id: 'classic',
      labelPt: 'Clássico',
      labelEn: 'Classic',
      lorePt: 'O tema clássico regressa à mesa simples, limpa e familiar.\nSem impérios perdidos nem cidades sagradas, apenas cartas, estratégia e tradição.\nÉ o verde do pano, o vermelho e preto dos naipes, o brilho discreto da velha mesa.\nUm refúgio para quem quer jogar sem distrações.\nA Sueca como sempre foi: direta, social e intemporal.',
    },
    {
      id: 'forest',
      labelPt: 'Floresta',
      labelEn: 'Forest',
      lorePt: '',
    },
    {
      id: 'midnight',
      labelPt: 'Meia-noite',
      labelEn: 'Midnight',
      lorePt: '',
    },
    {
      id: 'thebes',
      labelPt: 'Tebas',
      labelEn: 'Thebes',
      lorePt: 'Tebas nasce da areia dourada, entre templos colossais e avenidas de esfinges.\nKarnak e Luxor ainda respiram o poder dos faraós e dos deuses solares.\nO Nilo corre em silêncio, levando nomes antigos até à eternidade.\nÉ um tema claro, quente, monumental e sagrado.\nCada carta parece saída de uma parede gravada em pedra.',
    },
    {
      id: 'tikal',
      labelPt: 'Tikal',
      labelEn: 'Tikal',
      lorePt: 'Tikal desperta entre a selva, com templos a romperem o verde como montanhas sagradas.\nOs reis maias subiam às alturas para falar com deuses, estrelas e antepassados.\nJade, sombra, pedra e ouro escondem-se sob o som distante da floresta.\nÉ um tema escuro, ritual, húmido e majestoso.\nAqui, cada carta parece descoberta numa ruína perdida.',
    },
    {
      id: 'thule',
      labelPt: 'Thule',
      labelEn: 'Thule',
      lorePt: 'Thule vive no limite do mundo, onde o gelo, a névoa e o mar branco se confundem.\nPara os antigos, era a última terra antes do desconhecido.\nNem totalmente real, nem totalmente imaginada, tornou-se fronteira da mente humana.\nÉ um tema de branco antártico, azul glaciar, prata e silêncio.\nUm lugar frio, limpo e mítico, onde tudo parece suspenso.',
    },
    {
      id: 'knossos',
      labelPt: 'Knossos',
      labelEn: 'Knossos',
      lorePt: 'Entre colunas vermelhas e frescos de touros sagrados, Knossos ergue-se como memória da primeira grande civilização do Egeu.\nNo coração do palácio, o labirinto guarda ecos do Minotauro e dos reis de Creta.\nAqui, cada pedra parece pintada pelo sol mediterrânico.\nÉ um tema de mistério, mar, bronze e mito.\nUma cidade entre história e lenda, onde o jogo começa dentro do labirinto.',
    },
    {
      id: 'xanadu',
      labelPt: 'Xanadu',
      labelEn: 'Xanadu',
      lorePt: 'Nas estepes abertas, Xanadu brilha como palácio de vento, seda e império.\nKublai Khan sonhou ali uma capital entre o mundo mongol e a China eterna.\nCavalos, tendas douradas e jardins imperiais misturam conquista e poesia.\nÉ um tema de céu largo, ouro envelhecido e poder nómada.\nUma cidade-palácio onde o horizonte nunca acaba.',
    },
    {
      id: 'yamatai',
      labelPt: 'Yamatai',
      labelEn: 'Yamatai',
      lorePt: 'Yamatai surge envolta em névoa, entre espelhos de bronze, rituais antigos e bosques sagrados.\nA rainha Himiko governa como ponte entre os homens e os espíritos.\nAntes dos samurais e dos grandes castelos, havia silêncio, fogo e adivinhação.\nÉ um tema de vermelho escuro, marfim, bronze e sombra azulada.\nUm Japão mítico, ancestral e quase esquecido.',
    },
    {
      id: 'shambhala',
      labelPt: 'Shambhala',
      labelEn: 'Shambhala',
      lorePt: 'Shambhala repousa para lá das montanhas, onde a neve toca o céu e o tempo abranda.\nDizem que é um reino oculto, guardado por sabedoria, silêncio e luz interior.\nAs suas portas não se encontram em mapas, mas em símbolos, mandalas e visões.\nÉ um tema branco, turquesa e dourado pálido.\nUma cidade espiritual onde cada jogada parece ritual.',
    },
    {
      id: 'rapanui',
      labelPt: 'Rapanui',
      labelEn: 'Rapanui',
      lorePt: 'No meio do oceano, Rapa Nui ergue rostos de pedra contra o vento e o infinito.\nOs moai observam o mar como guardiões de uma memória antiga.\nVulcões, falésias e plataformas sagradas contam histórias de isolamento e poder.\nÉ um tema de basalto, azul profundo, cinza e osso branco.\nUma ilha-mito onde a pedra parece ter alma.',
    },
    {
      id: 'babylon',
      labelPt: 'Babilónia',
      labelEn: 'Babylon',
      lorePt: 'Babilónia ergue-se em azul cobalto e ouro, entre muralhas, leões e jardins impossíveis.\nA Porta de Ishtar abre caminho para reis, deuses e procissões imperiais.\nEntre o Eufrates e as estrelas, a cidade sonhou tocar o céu.\nÉ um tema luxuoso, profundo, cerimonial e poderoso.\nCada carta carrega o peso de um império ornamentado.',
    },
    {
      id: 'ur',
      labelPt: 'Ur',
      labelEn: 'Ur',
      lorePt: 'Ur nasce do barro da primeira civilização, sob o olhar dos zigurates e da lua.\nFoi cidade de reis, escribas, leis antigas e rituais em tijolo cozido.\nUr-Nammu deixou nela a marca de ordem, construção e memória.\nÉ um tema de terra, lápis-lazúli, bronze e escrita cuneiforme.\nUma cidade austera e ancestral, onde o jogo parece começar no início da história.',
    },
    {
      id: 'nanmadol',
      labelPt: 'Nan Madol',
      labelEn: 'Nan Madol',
      lorePt: 'Nan Madol flutua entre canais, basalto negro e água parada.\nConstruída sobre ilhéus artificiais, parece uma cidade feita para reis e espíritos.\nAs pedras húmidas guardam lendas de poderes antigos e dinastias esquecidas.\nÉ um tema frio, aquático, cinzento e misterioso.\nUma Veneza megalítica do Pacífico, meio ruína, meio feitiço.',
    },
  ];

  return (
    <div className="shell-screen screen-themes">
      <ShellHeader
        title={t.themesScreen.title}
        subtitle={t.themesScreen.subtitle}
        showBack={showBack}
        onBack={onBack}
      />

      <ul className="shell-list">
        {themes.map((theme) => (
          <li key={theme.id} className="themes-list-item">
            <div className={`themes-card shell-panel ${active === theme.id ? 'themes-card--active' : ''}`}>
              <button
                type="button"
                className="themes-card-select"
                onClick={() => applyTheme(theme.id)}
              >
                <span className="themes-card-name">
                  {language === 'pt' ? theme.labelPt : theme.labelEn}
                </span>
                {active === theme.id && (
                  <span className="themes-card-badge">{t.themesScreen.active}</span>
                )}
              </button>
              {theme.lorePt && (
                <button
                  type="button"
                  className={`themes-card-info ${expandedId === theme.id ? 'themes-card-info--open' : ''}`}
                  onClick={(e) => toggleLore(theme.id, e)}
                  aria-label="Lore"
                >
                  ℹ
                </button>
              )}
            </div>
            {expandedId === theme.id && theme.lorePt && (
              <p className="themes-card-lore">
                {theme.lorePt.split('\n').map((line, i) => (
                  <span key={i}>{line}<br /></span>
                ))}
              </p>
            )}
          </li>
        ))}
      </ul>

      <p className="shell-empty">{t.themesScreen.iapNote}</p>
    </div>
  );
};
