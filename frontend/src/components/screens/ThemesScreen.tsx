import React, { useState, useCallback } from 'react';
import {
  ThemeId,
  getActiveTheme,
  setActiveTheme
} from '../../services/billingService';
import { loadCustomThemes, deleteCustomTheme } from '../../services/customThemeStorage';
import { CustomThemeData } from '../../types/theme';
import { ShellRoute } from '../../types/navigation';
import { useLanguage } from '../../i18n/useLanguage';
import { ShellHeader } from '../navigation/ShellHeader';
import '../../styles/shell-screens.css';
import './ThemesScreen.css';

interface ThemesScreenProps {
  showBack?: boolean;
  onBack?: () => void;
  onThemeChange?: (theme: ThemeId) => void;
  onPush?: (route: ShellRoute) => void;
}

interface ThemeEntry {
  id: string;
  labelPt: string;
  labelEn: string;
  lorePt: string;
}

type SubZone = { subPt: string; subEn: string; ids: string[] };
type Zone = { zonePt: string; zoneEn: string; subzones: SubZone[] };

export const ThemesScreen: React.FC<ThemesScreenProps> = ({
  showBack = false,
  onBack,
  onThemeChange,
  onPush,
}) => {
  const { t, language } = useLanguage();
  const [active, setActive] = useState<ThemeId>(() => getActiveTheme());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [customThemes, setCustomThemes] = useState<CustomThemeData[]>(() => loadCustomThemes());

  const applyTheme = (theme: ThemeId) => {
    setActiveTheme(theme);
    setActive(theme);
    onThemeChange?.(theme);
  };

  const toggleLore = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedId(expandedId === id ? null : id);
  };

  const handleDeleteCustom = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteCustomTheme(id);
    setCustomThemes(loadCustomThemes());
    if (active === id) applyTheme('classic');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // ---- Theme catalogue -----------------------------------------------

  const themes: ThemeEntry[] = [
    // Base
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
      lorePt: 'A floresta escura guarda segredos em cada raiz e sombra de carvalho.\nEntre copas entreabertas, a luz filtra-se em raios verdes e distantes.\nO musgo, o orvalho e o silêncio compõem um ritual mais antigo que qualquer cidade.\nÉ um tema orgânico, vivo, húmido e ancestral.\nUma mesa de jogo na clareira, onde a floresta espreita de todos os lados.',
    },
    {
      id: 'midnight',
      labelPt: 'Meia-noite',
      labelEn: 'Midnight',
      lorePt: 'À meia-noite, o céu perde o azul e ganha uma profundidade sem fundo.\nAs estrelas surgem uma a uma, como números num código que poucos sabem ler.\nO silêncio da noite não é ausência — é presença de algo maior e mais calmo.\nÉ um tema índigo, mineral, silencioso e concentrado.\nUma mesa onde cada carta brilha mais por contraste com o escuro à volta.',
    },
    // Polar & Boreal
    {
      id: 'thule',
      labelPt: 'Thule',
      labelEn: 'Thule',
      lorePt: 'Thule vive no limite do mundo, onde o gelo, a névoa e o mar branco se confundem.\nPara os antigos, era a última terra antes do desconhecido.\nNem totalmente real, nem totalmente imaginada, tornou-se fronteira da mente humana.\nÉ um tema de branco antártico, azul glaciar, prata e silêncio.\nUm lugar frio, limpo e mítico, onde tudo parece suspenso.',
    },
    {
      id: 'hyperborea',
      labelPt: 'Hiperbórea',
      labelEn: 'Hyperborea',
      lorePt: 'Hyperborea existe para lá do norte, onde a aurora rasga a noite e o gelo nunca esquece.\nOs antigos sonharam-na como terra de pureza, distância e luz rara.\nAqui o frio não é vazio: é quase sagrado.\nÉ um tema de branco, azul polar e brilho verde-luminoso.\nUma fronteira mítica onde o mundo parece mais antigo.',
    },
    {
      id: 'skara-brae',
      labelPt: 'Skara Brae',
      labelEn: 'Skara Brae',
      lorePt: 'Skara Brae resiste junto ao mar frio, entre pedras baixas e vento do Atlântico Norte.\nAs casas parecem nascer da própria terra, simples e silenciosas.\nHá aqui uma humanidade antiga, doméstica e austera.\nÉ um tema de cinza marítimo, turfa e névoa branca.\nUma aldeia de pedra onde o tempo anda devagar.',
    },
    {
      id: 'avalon',
      labelPt: 'Avalon',
      labelEn: 'Avalon',
      lorePt: 'Avalon flutua na névoa, entre águas quietas e lendas de reis adormecidos.\nÉ a ilha da cura, do segredo e do fim das grandes espadas.\nNada nela é completamente histórico, nem completamente sonho.\nÉ um tema de prata, musgo e luz lunar.\nCada carta parece trazida por uma barca sobre o lago.',
    },
    // Mediterrâneo & Mar Antigo
    {
      id: 'knossos',
      labelPt: 'Knossos',
      labelEn: 'Knossos',
      lorePt: 'Entre colunas vermelhas e frescos de touros sagrados, Knossos ergue-se como memória da primeira grande civilização do Egeu.\nNo coração do palácio, o labirinto guarda ecos do Minotauro e dos reis de Creta.\nAqui, cada pedra parece pintada pelo sol mediterrânico.\nÉ um tema de mistério, mar, bronze e mito.\nUma cidade entre história e lenda, onde o jogo começa dentro do labirinto.',
    },
    {
      id: 'thebes',
      labelPt: 'Tebas',
      labelEn: 'Thebes',
      lorePt: 'Tebas nasce da areia dourada, entre templos colossais e avenidas de esfinges.\nKarnak e Luxor ainda respiram o poder dos faraós e dos deuses solares.\nO Nilo corre em silêncio, levando nomes antigos até à eternidade.\nÉ um tema claro, quente, monumental e sagrado.\nCada carta parece saída de uma parede gravada em pedra.',
    },
    {
      id: 'cartago',
      labelPt: 'Cartago',
      labelEn: 'Carthage',
      lorePt: 'Cartago abre-se ao mar em púrpura, bronze e sal.\nFoi cidade de mercadores, navegadores e estrategas, rival feroz de Roma.\nEntre portos e velas, respirava riqueza, sacrifício e ambição.\nÉ um tema de poder marítimo e brilho fenício.\nCada carta parece saída de um império voltado ao horizonte.',
    },
    {
      id: 'atlantida',
      labelPt: 'Atlântida',
      labelEn: 'Atlantis',
      lorePt: 'Atlântida brilha sob o mar, entre colunas partidas e ouro afundado.\nFoi império, aviso e maravilha, lembrado mais como visão do que como ruína.\nA água envolve tudo com luz azul e silêncio antigo.\nÉ um tema de turquesa, pérola e profundidade.\nUma cidade perdida onde a grandeza ainda respira.',
    },
    // Próximo Oriente
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
      id: 'petra',
      labelPt: 'Petra',
      labelEn: 'Petra',
      lorePt: 'Petra abre-se em rocha rosa, escondida entre desfiladeiros do deserto.\nAs suas fachadas parecem surgir da pedra como se sempre lá tivessem vivido.\nFoi encruzilhada de caravanas, perfumes e riqueza esculpida.\nÉ um tema de arenito, cobre e sombra púrpura.\nUma cidade-talhada que transforma pedra em monumento.',
    },
    // Pérsia Imperial
    {
      id: 'persepolis',
      labelPt: 'Persépolis',
      labelEn: 'Persepolis',
      lorePt: 'Persépolis ergue-se em degraus de pedra clara e ouro imperial.\nAli, a Pérsia encenava o seu poder através de escadarias, leões e procissões.\nÉ um mundo de ordem, luxo e solenidade cerimonial.\nO azul e o turquesa dão-lhe uma nobreza própria.\nCada carta parece parte de uma audiência real.',
    },
    // Nilo & Corno de África
    {
      id: 'axum',
      labelPt: 'Axum',
      labelEn: 'Axum',
      lorePt: 'Axum ergue-se nas alturas da Etiópia, entre obeliscos, pedra sagrada e ecos de reinos antigos.\nFoi lugar de comércio, fé e poder, onde o ouro e o incenso cruzavam rotas do mundo antigo.\nA luz ali não é suave: é alta, seca e real.\nÉ um tema de altitude, solenidade e herança africana.\nCada carta parece gravada numa pedra voltada ao céu.',
    },
    {
      id: 'meroe',
      labelPt: 'Meroë',
      labelEn: 'Meroë',
      lorePt: 'Meroë guarda o fogo de um reino africano entre pirâmides estreitas e areia escura.\nFoi centro de poder núbio, metal, realeza e resistência cultural.\nO deserto aqui é mais duro, mais negro, mais solar.\nÉ um tema de ouro, preto mineral e azul do Nilo.\nUma capital onde África fala em voz régia.',
    },
    // África Austral
    {
      id: 'great-zimbabwe',
      labelPt: 'Grande Zimbábue',
      labelEn: 'Great Zimbabwe',
      lorePt: 'Grande Zimbábue repousa entre muralhas de pedra seca e planícies douradas do sul de África.\nAs suas torres e recintos falam de riqueza, gado, poder e memória ancestral.\nNada aqui é excessivo: tudo parece sólido, terrestre e duradouro.\nÉ um tema de pedra, savana e nobreza silenciosa.\nUma cidade feita para resistir ao tempo.',
    },
    // Ásia Interior
    {
      id: 'xanadu',
      labelPt: 'Xanadu',
      labelEn: 'Xanadu',
      lorePt: 'Nas estepes abertas, Xanadu brilha como palácio de vento, seda e império.\nKublai Khan sonhou ali uma capital entre o mundo mongol e a China eterna.\nCavalos, tendas douradas e jardins imperiais misturam conquista e poesia.\nÉ um tema de céu largo, ouro envelhecido e poder nómada.\nUma cidade-palácio onde o horizonte nunca acaba.',
    },
    {
      id: 'shambhala',
      labelPt: 'Shambhala',
      labelEn: 'Shambhala',
      lorePt: 'Shambhala repousa para lá das montanhas, onde a neve toca o céu e o tempo abranda.\nDizem que é um reino oculto, guardado por sabedoria, silêncio e luz interior.\nAs suas portas não se encontram em mapas, mas em símbolos, mandalas e visões.\nÉ um tema branco, turquesa e dourado pálido.\nUma cidade espiritual onde cada jogada parece ritual.',
    },
    // Sul da Ásia
    {
      id: 'mohenjo-daro',
      labelPt: 'Mohenjo-daro',
      labelEn: 'Mohenjo-daro',
      lorePt: 'Mohenjo-daro fala baixo, mas com precisão.\nRuas ordenadas, água canalizada e tijolo cozido revelam uma cidade pensada com disciplina rara.\nAqui não há excesso mítico: há inteligência urbana ancestral.\nÉ um tema de terra, índigo e geometria serena.\nUma civilização que impressiona pela forma como organizou o mundo.',
    },
    // Extremo Oriente
    {
      id: 'yamatai',
      labelPt: 'Yamatai',
      labelEn: 'Yamatai',
      lorePt: 'Yamatai surge envolta em névoa, entre espelhos de bronze, rituais antigos e bosques sagrados.\nA rainha Himiko governa como ponte entre os homens e os espíritos.\nAntes dos samurais e dos grandes castelos, havia silêncio, fogo e adivinhação.\nÉ um tema de vermelho escuro, marfim, bronze e sombra azulada.\nUm Japão mítico, ancestral e quase esquecido.',
    },
    // Sudeste Asiático
    {
      id: 'angkor',
      labelPt: 'Angkor',
      labelEn: 'Angkor',
      lorePt: 'Angkor emerge da selva como um sonho de pedra e água.\nAs torres em forma de lótus elevam-se sobre canais, raízes e baixos-relevos infinitos.\nÉ uma civilização húmida, espiritual e monumental.\nO verde aqui é profundo, mas dourado pela luz tropical.\nUm tema onde a natureza nunca deixa o templo em paz.',
    },
    // Mesoamérica
    {
      id: 'tikal',
      labelPt: 'Tikal',
      labelEn: 'Tikal',
      lorePt: 'Tikal desperta entre a selva, com templos a romperem o verde como montanhas sagradas.\nOs reis maias subiam às alturas para falar com deuses, estrelas e antepassados.\nJade, sombra, pedra e ouro escondem-se sob o som distante da floresta.\nÉ um tema escuro, ritual, húmido e majestoso.\nAqui, cada carta parece descoberta numa ruína perdida.',
    },
    {
      id: 'teotihuacan',
      labelPt: 'Teotihuacan',
      labelEn: 'Teotihuacan',
      lorePt: 'Teotihuacan ergue-se em linhas vastas de pedra, obsidiana e sol.\nA Calçada dos Mortos conduz a pirâmides que ainda hoje dominam o horizonte do México antigo.\nÉ um lugar de escala, ritual e poder cósmico.\nO negro da obsidiana encontra o dourado solar num equilíbrio severo.\nUma cidade dos deuses, feita para ser vista de baixo para cima.',
    },
    // Andes & Costa do Pacífico
    {
      id: 'tiwanaku',
      labelPt: 'Tiwanaku',
      labelEn: 'Tiwanaku',
      lorePt: 'Tiwanaku vive no altiplano, onde o ar é fino e a pedra enfrenta o vento.\nA Porta do Sol observa montanhas distantes e um céu quase metálico.\nHá ali uma grandeza fria, ritual e geométrica.\nÉ um tema de cinza glacial, ciano e cobre antigo.\nCada jogada parece talhada no coração dos Andes.',
    },
    {
      id: 'caral',
      labelPt: 'Caral',
      labelEn: 'Caral',
      lorePt: 'Caral desperta na névoa da costa peruana, antiga como o próprio início das Américas.\nAs suas pirâmides baixas e praças cerimoniais falam de ordem, silêncio e origem.\nNão é um mundo de luxo, mas de fundação.\nÉ um tema de adobe, névoa e memória primordial.\nUma cidade onde tudo começa antes da história escrita.',
    },
    // Américas Míticas
    {
      id: 'el-dorado',
      labelPt: 'El Dorado',
      labelEn: 'El Dorado',
      lorePt: 'El Dorado não é apenas cidade: é desejo, febre e visão.\nNasce do ouro refletido na água, da selva fechada e da promessa impossível.\nMais do que lugar, é miragem poderosa da imaginação americana.\nÉ um tema de esmeralda, ouro e sombra tropical.\nCada carta parece escondida numa floresta que nunca se entrega por completo.',
    },
    // Pacífico
    {
      id: 'rapanui',
      labelPt: 'Rapanui',
      labelEn: 'Rapanui',
      lorePt: 'No meio do oceano, Rapa Nui ergue rostos de pedra contra o vento e o infinito.\nOs moai observam o mar como guardiões de uma memória antiga.\nVulcões, falésias e plataformas sagradas contam histórias de isolamento e poder.\nÉ um tema de basalto, azul profundo, cinza e osso branco.\nUma ilha-mito onde a pedra parece ter alma.',
    },
    {
      id: 'nanmadol',
      labelPt: 'Nan Madol',
      labelEn: 'Nan Madol',
      lorePt: 'Nan Madol flutua entre canais, basalto negro e água parada.\nConstruída sobre ilhéus artificiais, parece uma cidade feita para reis e espíritos.\nAs pedras húmidas guardam lendas de poderes antigos e dinastias esquecidas.\nÉ um tema frio, aquático, cinzento e misterioso.\nUma Veneza megalítica do Pacífico, meio ruína, meio feitiço.',
    },
  ];

  // ---- Zone / sub-zone structure ------------------------------------

  const zones: Zone[] = [
    {
      zonePt: 'Base', zoneEn: 'Base',
      subzones: [
        { subPt: 'Standard', subEn: 'Standard', ids: ['classic', 'forest', 'midnight'] },
      ],
    },
    {
      zonePt: 'Polar & Boreal', zoneEn: 'Polar & Boreal',
      subzones: [
        { subPt: 'Ártico mítico', subEn: 'Mythic Arctic', ids: ['thule'] },
        { subPt: 'Hiperbórea', subEn: 'Hyperborea', ids: ['hyperborea'] },
        { subPt: 'Atlântico Norte', subEn: 'North Atlantic', ids: ['skara-brae'] },
        { subPt: 'Névoa celta', subEn: 'Celtic Mist', ids: ['avalon'] },
      ],
    },
    {
      zonePt: 'Mediterrâneo & Mar Antigo', zoneEn: 'Mediterranean & Ancient Sea',
      subzones: [
        { subPt: 'Egeu / Egito', subEn: 'Aegean / Egypt', ids: ['knossos', 'thebes'] },
        { subPt: 'Fenícia / Púnica', subEn: 'Phoenician / Punic', ids: ['cartago'] },
        { subPt: 'Mar perdido', subEn: 'Lost Sea', ids: ['atlantida'] },
      ],
    },
    {
      zonePt: 'Próximo Oriente', zoneEn: 'Near East',
      subzones: [
        { subPt: 'Mesopotâmia', subEn: 'Mesopotamia', ids: ['babylon', 'ur'] },
        { subPt: 'Nabateu', subEn: 'Nabataean', ids: ['petra'] },
      ],
    },
    {
      zonePt: 'Pérsia Imperial', zoneEn: 'Imperial Persia',
      subzones: [
        { subPt: 'Aqueménida', subEn: 'Achaemenid', ids: ['persepolis'] },
      ],
    },
    {
      zonePt: 'Nilo & Corno de África', zoneEn: 'Nile & Horn of Africa',
      subzones: [
        { subPt: 'Etiópia', subEn: 'Ethiopia', ids: ['axum'] },
        { subPt: 'Núbia / Cuxe', subEn: 'Nubia / Kush', ids: ['meroe'] },
      ],
    },
    {
      zonePt: 'África Austral', zoneEn: 'Southern Africa',
      subzones: [
        { subPt: 'Reinos de pedra', subEn: 'Stone Kingdoms', ids: ['great-zimbabwe'] },
      ],
    },
    {
      zonePt: 'Ásia Interior', zoneEn: 'Inner Asia',
      subzones: [
        { subPt: 'Estepe / Himalaya', subEn: 'Steppe / Himalaya', ids: ['xanadu', 'shambhala'] },
      ],
    },
    {
      zonePt: 'Sul da Ásia', zoneEn: 'South Asia',
      subzones: [
        { subPt: 'Vale do Indo', subEn: 'Indus Valley', ids: ['mohenjo-daro'] },
      ],
    },
    {
      zonePt: 'Extremo Oriente', zoneEn: 'Far East',
      subzones: [
        { subPt: 'Japão arcaico', subEn: 'Archaic Japan', ids: ['yamatai'] },
      ],
    },
    {
      zonePt: 'Sudeste Asiático', zoneEn: 'Southeast Asia',
      subzones: [
        { subPt: 'Khmer', subEn: 'Khmer', ids: ['angkor'] },
      ],
    },
    {
      zonePt: 'Mesoamérica', zoneEn: 'Mesoamerica',
      subzones: [
        { subPt: 'Maia', subEn: 'Maya', ids: ['tikal'] },
        { subPt: 'Altiplano central', subEn: 'Central Highlands', ids: ['teotihuacan'] },
      ],
    },
    {
      zonePt: 'Andes & Costa do Pacífico', zoneEn: 'Andes & Pacific Coast',
      subzones: [
        { subPt: 'Altiplano', subEn: 'Altiplano', ids: ['tiwanaku'] },
        { subPt: 'Norte Chico', subEn: 'Norte Chico', ids: ['caral'] },
      ],
    },
    {
      zonePt: 'Américas Míticas', zoneEn: 'Mythic Americas',
      subzones: [
        { subPt: 'Ouro perdido', subEn: 'Lost Gold', ids: ['el-dorado'] },
      ],
    },
    {
      zonePt: 'Pacífico', zoneEn: 'Pacific',
      subzones: [
        { subPt: 'Polinésia / Micronésia', subEn: 'Polynesia / Micronesia', ids: ['rapanui', 'nanmadol'] },
      ],
    },
  ];

  // ---- Render helpers ------------------------------------------------

  const themeMap = Object.fromEntries(themes.map((th) => [th.id, th]));

  const renderCard = (theme: ThemeEntry) => (
    <li key={theme.id} className="themes-list-item">
      <div className={`themes-card shell-panel ${active === theme.id ? 'themes-card--active' : ''}`}>
        <button
          type="button"
          className="themes-card-select"
          onClick={() => applyTheme(theme.id as ThemeId)}
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
  );

  const renderCustomCard = (theme: CustomThemeData) => (
    <li key={theme.id} className="themes-list-item">
      <div className={`themes-card shell-panel ${active === theme.id ? 'themes-card--active' : ''}`}>
        <button
          type="button"
          className="themes-card-select"
          onClick={() => applyTheme(theme.id as ThemeId)}
        >
          <span className="themes-card-name">{theme.name}</span>
          {active === theme.id && (
            <span className="themes-card-badge">{t.themesScreen.active}</span>
          )}
        </button>
        <button
          type="button"
          className={`themes-card-info ${expandedId === theme.id ? 'themes-card-info--open' : ''}`}
          onClick={(e) => toggleLore(theme.id, e)}
          aria-label="Lore"
        >
          ℹ
        </button>
        <button
          type="button"
          className="themes-card-edit"
          onClick={() => onPush?.({ tab: 'themes', screen: { type: 'editor', themeId: theme.id } })}
          aria-label="Editar"
        >
          ✏
        </button>
        <button
          type="button"
          className="themes-card-delete"
          onClick={(e) => handleDeleteCustom(theme.id, e)}
          aria-label="Apagar"
        >
          ×
        </button>
      </div>
      {expandedId === theme.id && theme.lore && (
        <p className="themes-card-lore">{theme.lore}</p>
      )}
    </li>
  );

  return (
    <div className="shell-screen screen-themes">
      <ShellHeader
        title={t.themesScreen.title}
        subtitle={t.themesScreen.subtitle}
        showBack={showBack}
        onBack={onBack}
      />

      <ul className="shell-list">
        {/* Custom themes */}
        {(customThemes.length > 0 || onPush) && (
          <React.Fragment>
            <li className="themes-group-header themes-group-header--custom">
              {language === 'pt' ? 'Personalizados' : 'Custom'}
              {onPush && (
                <button
                  type="button"
                  className="themes-create-btn"
                  onClick={() => onPush({ tab: 'themes', screen: { type: 'editor' } })}
                >
                  + Criar
                </button>
              )}
            </li>
            {customThemes.map((theme) => renderCustomCard(theme))}
            {customThemes.length === 0 && (
              <li className="themes-custom-empty">Ainda não criaste nenhum tema.</li>
            )}
          </React.Fragment>
        )}

        {/* Built-in zones → sub-zones → themes */}
        {zones.map((zone) => (
          <React.Fragment key={zone.zoneEn}>
            <li className="themes-zone-header">
              {language === 'pt' ? zone.zonePt : zone.zoneEn}
            </li>
            {zone.subzones.map((sub) => (
              <React.Fragment key={sub.subEn}>
                {/* Only show sub-zone header when zone has more than one sub-zone */}
                {zone.subzones.length > 1 && (
                  <li className="themes-subzone-header">
                    {language === 'pt' ? sub.subPt : sub.subEn}
                  </li>
                )}
                {sub.ids.map((id) => themeMap[id] && renderCard(themeMap[id]))}
              </React.Fragment>
            ))}
          </React.Fragment>
        ))}
      </ul>

      <p className="shell-empty">{t.themesScreen.iapNote}</p>
    </div>
  );
};
