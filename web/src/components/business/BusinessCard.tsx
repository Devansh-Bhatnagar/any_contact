import React from 'react';
import { Business } from '../../types/business';
import { OfferFlagBadge } from '../common/OfferFlagBadge';
import { getOfferColor } from '../../constants/offerColors';
import {
  Phone,
  MessageCircle,
  MapPin,
  Star,
  CheckCircle2,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';

interface BusinessCardProps {
  business: Business;
  onSelect: (b: Business) => void;
}

export const BusinessCard: React.FC<BusinessCardProps> = ({ business, onSelect }) => {
  const hasOffers = Boolean(business.offers && business.offers.length > 0);

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${business.phone}`;
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = business.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello ${business.name}, I am contacting you via Leads Phone Book.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div
      onClick={() => onSelect(business)}
      style={{
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: hasOffers
          ? '1.5px solid rgba(16, 185, 129, 0.4)'
          : '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: hasOffers
          ? '0 6px 20px -3px rgba(16, 185, 129, 0.12), var(--shadow-sm)'
          : 'var(--shadow-sm)',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
      }}
      className="group hover:-translate-y-1 hover:shadow-lg"
    >
      {/* Top Image Banner */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '170px',
          overflow: 'hidden',
          backgroundColor: '#0F172A',
        }}
      >
        <img
          src={business.image}
          alt={business.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
          className="group-hover:scale-105"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80';
          }}
        />

        {/* Gradient Overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)',
          }}
        />

        {/* Top Badges */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Category Chip */}
          <span
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(8px)',
              color: '#FFFFFF',
              fontSize: '11.5px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            {business.category}
          </span>

          {/* Offer Flag Floating Corner Badge */}
          {hasOffers && (
            <div
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(6px)',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              }}
            >
              <OfferFlagBadge size="sm" />
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#047857' }}>
                DEALS ACTIVE
              </span>
            </div>
          )}
        </div>

        {/* Bottom Image Stats (Rating & City) */}
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '12px',
            right: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#FFFFFF',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={13} style={{ color: '#60A5FA' }} />
            <span style={{ fontSize: '12px', fontWeight: 600 }}>{business.city}</span>
          </div>

          {business.rating && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '3px',
                backgroundColor: 'rgba(245, 158, 11, 0.95)',
                padding: '2px 7px',
                borderRadius: '6px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#FFFFFF',
              }}
            >
              <Star size={11} fill="#FFFFFF" />
              <span>{business.rating.toFixed(1)}</span>
              {business.reviewCount && (
                <span style={{ opacity: 0.85, fontSize: '10px' }}>
                  ({business.reviewCount})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Card Content Body */}
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Business Name with Verified and Offer Flag */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
          <h3
            style={{
              fontSize: '16.5px',
              fontWeight: 700,
              color: 'var(--text)',
              lineHeight: 1.35,
              flex: 1,
            }}
          >
            {business.name}
          </h3>

          {/* Wavy Green Flag next to name if offers exist */}
          {hasOffers && <OfferFlagBadge size="md" />}

          {business.verified && (
            <span title="Verified Business" style={{ display: 'inline-flex', flexShrink: 0, marginTop: '2px' }}>
              <CheckCircle2
                size={18}
                style={{ color: '#2563EB' }}
              />
            </span>
          )}
        </div>

        {/* Address */}
        <p
          style={{
            fontSize: '12.5px',
            color: 'var(--text-secondary)',
            marginBottom: '10px',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {business.address}
        </p>

        {/* Exclusive Promotional Offers Banner */}
        {hasOffers && (
          <div
            style={{
              marginBottom: '14px',
              backgroundColor: 'var(--surface-variant)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 10px',
              border: '1px solid var(--border)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginBottom: '6px',
              }}
            >
              <Sparkles size={13} style={{ color: '#10B981' }} />
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: '#059669',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Special Offers ({business.offers!.length}):
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {business.offers!.slice(0, 2).map((offer, idx) => {
                const colorTheme = getOfferColor(offer, idx);
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: colorTheme.primary,
                      backgroundColor: colorTheme.badgeBg,
                      border: `1px solid ${colorTheme.border}`,
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    <OfferFlagBadge size="sm" />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {offer}
                    </span>
                  </div>
                );
              })}
              {business.offers!.length > 2 && (
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, paddingLeft: '4px' }}>
                  +{business.offers!.length - 2} more deals available
                </span>
              )}
            </div>
          </div>
        )}

        {/* Opening Hours Info */}
        {business.openingHours && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              marginBottom: '14px',
            }}
          >
            <Clock size={13} />
            <span>{business.openingHours}</span>
          </div>
        )}

        {/* Action Buttons Row */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingTop: '10px',
            borderTop: '1px solid var(--divider)',
          }}
        >
          {/* Call Button */}
          <button
            type="button"
            onClick={handleCall}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#16A34A',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: 'pointer',
              transition: 'opacity 0.2s ease',
            }}
            className="hover:opacity-90"
          >
            <Phone size={14} />
            <span>Call</span>
          </button>

          {/* WhatsApp Button */}
          <button
            type="button"
            onClick={handleWhatsApp}
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
              transition: 'opacity 0.2s ease',
            }}
            className="hover:opacity-90"
          >
            <MessageCircle size={14} />
            <span>WhatsApp</span>
          </button>

          {/* Details Button */}
          <button
            type="button"
            onClick={() => onSelect(business)}
            style={{
              padding: '9px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-variant)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              fontWeight: 600,
              fontSize: '12.5px',
              cursor: 'pointer',
            }}
            className="hover:bg-primary hover:text-white"
            title="View Details"
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
