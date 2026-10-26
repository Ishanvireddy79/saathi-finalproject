// Saathi design tokens. Every screen reads colors from here.
// Text on its background keeps at least 4.5:1 contrast.
export const colors = {
  bg: '#F3F0FA',
  card: '#FFFFFF',
  border: '#D9D4E8',
  text: '#0F172A',
  muted: '#475569',
  accent: '#1D3F94',
  accentText: '#FFFFFF',
  accentSoft: '#E3EAFB',
  sage: '#0F766E',
  sageSoft: '#DDF3EF',
  sos: '#D92D20',
  sosText: '#FFFFFF',
  sosSoft: '#FEE4E2',
  amber: '#B45309',
  amberSoft: '#FEF3C7',
  track: '#E6E2F0',
  lavender: '#E4DBF7',
  peach: '#FFE3D5',
  skySoft: '#D9E6FB',
};

export const SCALE = { normal: 1, large: 1.25, xlarge: 1.5 } as const;

export const radius = { sm: 12, md: 18, lg: 26, pill: 999 } as const;

export const shadow = {
  shadowColor: '#0F172A',
  shadowOpacity: 0.08,
  shadowRadius: 14,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;