export interface OfferColorTheme {
  name: string;
  primary: string;      // bold color for flag icon, solid badge
  badgeBg: string;     // subtle background in light mode
  badgeBgDark: string; // subtle background in dark mode
  border: string;      // border in light mode
  borderDark: string;  // border in dark mode
  text: string;        // text in light mode
  textDark: string;    // text in dark mode
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
  // 5. Electric Blue (Tech, Cashback, Welcome Offer)
  {
    name: 'blue',
    primary: '#0284C7',
    badgeBg: '#E0F2FE',
    badgeBgDark: 'rgba(2, 132, 199, 0.22)',
    border: '#BAE6FD',
    borderDark: 'rgba(2, 132, 199, 0.45)',
    text: '#0369A1',
    textDark: '#7DD3FC',
  },
  // 6. Deep Pink (Salon, Fashion, Special)
  {
    name: 'pink',
    primary: '#DB2777',
    badgeBg: '#FCE7F3',
    badgeBgDark: 'rgba(219, 39, 119, 0.22)',
    border: '#FBCFE8',
    borderDark: 'rgba(219, 39, 119, 0.45)',
    text: '#BE185D',
    textDark: '#F472B6',
  },
  // 7. Warm Amber / Gold (Festivals, Festive Discounts)
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
  // 8. Teal (Clearance, First Order)
  {
    name: 'teal',
    primary: '#0D9488',
    badgeBg: '#CCFBF1',
    badgeBgDark: 'rgba(13, 148, 136, 0.22)',
    border: '#99F6E4',
    borderDark: 'rgba(13, 148, 136, 0.45)',
    text: '#0F766E',
    textDark: '#5EEAD4',
  },
];

/**
 * Returns a distinct color palette for a given offer string or index.
 */
export function getOfferColor(offerTextOrSeed?: string, index?: number): OfferColorTheme {
  if (typeof index === 'number' && index >= 0) {
    return OFFER_PALETTES[index % OFFER_PALETTES.length];
  }
  if (!offerTextOrSeed) {
    return OFFER_PALETTES[0];
  }
  let hash = 0;
  for (let i = 0; i < offerTextOrSeed.length; i++) {
    hash = (hash << 5) - hash + offerTextOrSeed.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  return OFFER_PALETTES[positiveHash % OFFER_PALETTES.length];
}

