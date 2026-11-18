export interface OfferColorTheme {
  name: string;
  primary: string;
  badgeBg: string;
  badgeBgDark: string;
  border: string;
  borderDark: string;
  text: string;
  textDark: string;
}

export const OFFER_PALETTES: OfferColorTheme[] = [
  // 1. Ruby Red (Buy 1 Get 1, Mega Deal)
  {
    name: 'red',
    primary: '#E11D48',
    badgeBg: '#FFE4E6',
    badgeBgDark: 'rgba(225, 29, 72, 0.22)',
    border: '#FECDD3',
    borderDark: 'rgba(225, 29, 72, 0.45)',
    text: '#BE123C',
    textDark: '#FDA4AF',
  },
  // 2. Vivid Orange (Flat Discounts, Hot Deals)
  {
    name: 'orange',
    primary: '#EA580C',
    badgeBg: '#FFEDD5',
    badgeBgDark: 'rgba(234, 88, 12, 0.22)',
    border: '#FED7AA',
    borderDark: 'rgba(234, 88, 12, 0.45)',
    text: '#C2410C',
    textDark: '#FDBA74',
  },
  // 3. Emerald Green (Free Delivery, Health, Savings)
  {
    name: 'emerald',
    primary: '#059669',
    badgeBg: '#D1FAE5',
    badgeBgDark: 'rgba(5, 150, 105, 0.22)',
    border: '#A7F3D0',
    borderDark: 'rgba(5, 150, 105, 0.45)',
    text: '#047857',
    textDark: '#6EE7B7',
  },
  // 4. Royal Violet (Combo Deals, VIP, Luxury)
  {
    name: 'purple',
    primary: '#7C3AED',
    badgeBg: '#EDE9FE',
    badgeBgDark: 'rgba(124, 58, 237, 0.22)',
    border: '#DDD6FE',
    borderDark: 'rgba(124, 58, 237, 0.45)',
    text: '#6D28D9',
    textDark: '#C4B5FD',
  },
  // 5. Electric Blue (Digital, Tech, Corporate)
  {
    name: 'blue',
    primary: '#2563EB',
    badgeBg: '#DBEAFE',
    badgeBgDark: 'rgba(37, 99, 235, 0.22)',
    border: '#BFDBFE',
    borderDark: 'rgba(37, 99, 235, 0.45)',
    text: '#1D4ED8',
    textDark: '#93C5FD',
  },
  // 6. Amber Gold (Special Festival, Limited Edition)
  {
    name: 'amber',
    primary: '#D97706',
    badgeBg: '#FEF3C7',
    badgeBgDark: 'rgba(217, 119, 6, 0.22)',
    border: '#FDE68A',
    borderDark: 'rgba(217, 119, 6, 0.45)',
    text: '#B45309',
    textDark: '#FCD34D',
  },
];

export function getOfferColor(offerText: string, index?: number): OfferColorTheme {
  const lower = (offerText || '').toLowerCase();

  if (lower.includes('buy 1') || lower.includes('bogo') || lower.includes('free 1') || lower.includes('ek par ek') || lower.includes('1 par 1')) {
    return OFFER_PALETTES[0]; // Red
  }
  if (lower.includes('flat') || lower.includes('off') || lower.includes('%') || lower.includes('discount')) {
    return OFFER_PALETTES[1]; // Orange
  }
  if (lower.includes('home delivery') || lower.includes('delivery') || lower.includes('cashback')) {
    return OFFER_PALETTES[2]; // Emerald
  }
  if (lower.includes('combo') || lower.includes('deal') || lower.includes('package')) {
    return OFFER_PALETTES[3]; // Purple
  }
  if (lower.includes('christmas') || lower.includes('festival') || lower.includes('diwali') || lower.includes('special')) {
    return OFFER_PALETTES[5]; // Amber
  }

  if (typeof index === 'number') {
    return OFFER_PALETTES[index % OFFER_PALETTES.length];
  }

  let hash = 0;
  for (let i = 0; i < offerText.length; i++) {
    hash = (hash << 5) - hash + offerText.charCodeAt(i);
    hash |= 0;
  }
  const idx = Math.abs(hash) % OFFER_PALETTES.length;
  return OFFER_PALETTES[idx];
}
