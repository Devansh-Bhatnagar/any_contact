import React, { useState } from 'react';
import { useBusinesses } from '../../context/BusinessContext';
import { Business } from '../../types/business';
import { OfferFlagBadge } from '../common/OfferFlagBadge';
import { getOfferColor } from '../../constants/offerColors';
import { Sparkles, MessageCircle, Phone, Tag, Building2, MapPin } from 'lucide-react';

interface OffersHubViewProps {
  onSelectBusiness: (b: Business) => void;
}

export const OffersHubView: React.FC<OffersHubViewProps> = ({ onSelectBusiness }) => {
  const { businesses } = useBusinesses();
  const [filterType, setFilterType] = useState<string>('all');

  const businessesWithOffers = businesses.filter((b) => b.offers && b.offers.length > 0);

  const allOffersFlat: { business: Business; offer: string; idx: number }[] = [];
  businessesWithOffers.forEach((b) => {
    b.offers!.forEach((offer, idx) => {
      allOffersFlat.push({ business: b, offer, idx });
    });
  });

  const filteredOffers = allOffersFlat.filter((item) => {
    if (filterType === 'all') return true;
    const lower = item.offer.toLowerCase();
    if (filterType === 'bogo') return lower.includes('buy 1') || lower.includes('1 par 1') || lower.includes('bogo');
    if (filterType === 'discount') return lower.includes('%') || lower.includes('off') || lower.includes('flat');
    if (filterType === 'festival') return lower.includes('christmas') || lower.includes('festival') || lower.includes('special');
    if (filterType === 'free') return lower.includes('free') || lower.includes('delivery');
    return true;
  });

  const handleClaimOffer = (business: Business, offer: string) => {
    const cleanPhone = business.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello ${business.name}, I saw your exclusive offer "${offer}" on Leads Phone Book and would like to claim it!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Hero Promo Banner */}
      <div
        className="offers-hero"
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 50%, #065F46 100%)',
          borderRadius: 'var(--radius-xl)',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px -4px rgba(5, 150, 105, 0.4)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1, maxWidth: '580px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: 'var(--radius-full)', marginBottom: '12px' }}>
            <OfferFlagBadge size="sm" />
            <span style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Live Deals & Discounts Hub
            </span>
          </div>

          <h1 className="offers-hero-title" style={{ fontWeight: 800, marginBottom: '8px', lineHeight: 1.25 }}>
            Exclusive Business Offers & Festival Savings
          </h1>
          <p className="offers-hero-desc" style={{ opacity: 0.9, lineHeight: 1.5 }}>
            Discover active promotions, "Buy 1 Get 1 Free", flat discounts and festive combo deals running right now in your city.
          </p>

          <div className="offers-hero-stats" style={{ display: 'flex', gap: '20px', marginTop: '18px' }}>
            <div>
              <div className="offers-hero-stat-num" style={{ fontWeight: 800 }}>{allOffersFlat.length}</div>
              <div style={{ fontSize: '11.5px', opacity: 0.85, fontWeight: 600 }}>Active Offers</div>
            </div>
            <div style={{ width: '1px', backgroundColor: 'rgba(255,255,255,0.2)' }} />
            <div>
              <div className="offers-hero-stat-num" style={{ fontWeight: 800 }}>{businessesWithOffers.length}</div>
              <div style={{ fontSize: '11.5px', opacity: 0.85, fontWeight: 600 }}>Participating Businesses</div>
            </div>
          </div>
        </div>

        {/* Decorative Floating Flag */}
        <div
          style={{
            position: 'absolute',
            right: '24px',
            bottom: '-10px',
            opacity: 0.85,
            pointerEvents: 'none',
          }}
          className="hidden-below-md"
        >
          <img
            src="/offer-flag.png"
            alt="Offer Flag"
            style={{ height: '140px', width: 'auto', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.3))' }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="offers-filter-tabs" style={{ display: 'flex', gap: '8px' }}>
        {[
          { id: 'all', label: `All Deals (${allOffersFlat.length})` },
          { id: 'bogo', label: 'Buy 1 Get 1 Free' },
          { id: 'discount', label: 'Flat Discounts & % Off' },
          { id: 'festival', label: 'Festival & Special Offers' },
          { id: 'free', label: 'Free Delivery & Consultations' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilterType(tab.id)}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              border: filterType === tab.id ? '1.5px solid #059669' : '1px solid var(--border)',
              backgroundColor: filterType === tab.id ? '#059669' : 'var(--surface)',
              color: filterType === tab.id ? '#FFFFFF' : 'var(--text)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Offers Cards Grid */}
      <div className="responsive-offers-grid">
        {filteredOffers.map((item, idx) => {
          const palette = getOfferColor(item.offer, item.idx);
          return (
            <div
              key={`${item.business.id}-${idx}`}
              style={{
                backgroundColor: 'var(--surface)',
                border: `1.5px solid ${palette.border}`,
                borderRadius: 'var(--radius-xl)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.2s ease',
              }}
              className="hover:shadow-md hover:-translate-y-1"
            >
              {/* Offer Highlight Pill */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: palette.badgeBg,
                  border: `1px solid ${palette.border}`,
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                <OfferFlagBadge size="sm" />
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: palette.primary,
                    lineHeight: 1.3,
                  }}
                >
                  {item.offer}
                </span>
              </div>

              {/* Business Mini Profile */}
              <div
                onClick={() => onSelectBusiness(item.business)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                }}
              >
                <img
                  src={item.business.image}
                  alt={item.business.name}
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '10px',
                    objectFit: 'cover',
                    border: '1px solid var(--border)',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.business.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--text-tertiary)' }}>
                    <span>{item.business.category}</span>
                    <span>•</span>
                    <MapPin size={11} />
                    <span>{item.business.city}</span>
                  </div>
                </div>
              </div>

              {/* Action Claim Buttons */}
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--divider)' }}>
                <button
                  type="button"
                  onClick={() => handleClaimOffer(item.business, item.offer)}
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#25D366',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                  }}
                >
                  <MessageCircle size={14} /> Claim on WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => (window.location.href = `tel:${item.business.phone}`)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface-variant)',
                    color: 'var(--text)',
                    border: '1px solid var(--border)',
                    fontWeight: 600,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Call Business"
                >
                  <Phone size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
