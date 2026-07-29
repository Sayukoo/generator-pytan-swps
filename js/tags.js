(function (global) {
  'use strict';
const DEFAULT_TAG_COLOR = '#7f8c8d';
  const TAG_COLOR_MAP = {
    'Psychologia społeczna': '#e74c3c',
    'Emocje i motywacje': '#e67e22',
    'Psychologia rozwojowa': '#16a085',
    Psychopatologia: '#c0392b',
    'Psychologia osobowości': '#9b59b6',
    'Psychologia poznawcza': '#2980b9',
    'Psychologia różnic indywidualnych': '#3498db',
    Etyka: '#d35400',
    Diagnoza: '#2c3e50',
    'Metodologia, psychometria, statystyka': '#f1c40f',
    'Psychologia kliniczna': '#e84393',
    'Psychologia zdrowia': '#00b894',
    'Praca i organizacja': '#6c5ce7',
    'Psychologia edukacji': '#fdcb6e',
    'Zestaw egzaminacyjny': '#5eead4',
    'Metodologia i Nauka': '#f1c40f',
    'Psychologia Ogólna': '#3498db',
    'Psychopatologia i Zdrowie': '#c0392b',
    'Etyka i Zawód': '#d35400',
    'Osobowość': '#9b59b6',
    'Psychologia Stosowana': '#6c5ce7',
    'Psychologia Rozwoju': '#16a085',
    'Diagnoza i psychometria': '#2c3e50',
    'Psychoterapia i pomoc': '#e84393'
  };

  const TAG_ORDER = [
    'Psychologia społeczna',
    'Emocje i motywacje',
    'Psychologia rozwojowa',
    'Psychopatologia',
    'Psychologia osobowości',
    'Psychologia poznawcza',
    'Psychologia różnic indywidualnych',
    'Etyka',
    'Diagnoza',
    'Metodologia, psychometria, statystyka',
    'Psychologia kliniczna',
    'Psychologia zdrowia',
    'Praca i organizacja',
    'Psychologia edukacji',
    'Zestaw egzaminacyjny',
    'Metodologia i Nauka',
    'Psychologia Ogólna',
    'Psychopatologia i Zdrowie',
    'Etyka i Zawód',
    'Osobowość',
    'Psychologia Stosowana',
    'Psychologia Rozwoju',
    'Diagnoza i psychometria',
    'Psychoterapia i pomoc'
  ];

  function normalizeHex(hex) {
    if (typeof hex !== 'string') {
      return null;
    }
    const trimmed = hex.trim().replace(/^#/, '');
    if (trimmed.length === 3) {
      return trimmed.split('').map((ch) => ch + ch).join('');
    }
    if (trimmed.length === 6) {
      return trimmed;
    }
    return null;
  }

  function hexToRgb(hex) {
    const value = normalizeHex(hex);
    if (!value) {
      return null;
    }
    const r = Number.parseInt(value.slice(0, 2), 16);
    const g = Number.parseInt(value.slice(2, 4), 16);
    const b = Number.parseInt(value.slice(4, 6), 16);
    if ([r, g, b].some((channel) => Number.isNaN(channel))) {
      return null;
    }
    return { r, g, b };
  }

  function getTagVariants(tag) {
    const rgb = hexToRgb(TAG_COLOR_MAP[tag] ?? DEFAULT_TAG_COLOR) ?? { r: 127, g: 140, b: 141 };
    return {
      strong: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      soft: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`,
      onDark: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
      text: '#f9f9f9',
    };
  }

  function getUniqueTags(data) {
    const tagSet = new Set();
    data.forEach((item) => {
      (item?.tags || []).forEach((tag) => {
        if (typeof tag === 'string' && tag.trim()) {
          tagSet.add(tag.trim());
        }
      });
    });
    const orderIndex = new Map(TAG_ORDER.map((tag, index) => [tag, index]));
    return Array.from(tagSet).sort((a, b) => {
      const orderA = orderIndex.has(a) ? orderIndex.get(a) : Number.MAX_SAFE_INTEGER;
      const orderB = orderIndex.has(b) ? orderIndex.get(b) : Number.MAX_SAFE_INTEGER;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.localeCompare(b, 'pl', { sensitivity: 'accent' });
    });
  }


  global.tagsManager = {
    getTagVariants,
    getUniqueTags,
    TAG_COLOR_MAP
  };
})(window);
