import React from 'react';
import { Business } from '../../types/business';
import { OfferFlagBadge } from '../common/OfferFlagBadge';
import { getOfferColor } from '../../constants/offerColors';
import {
  X,
  Phone,
  MessageCircle,
  MapPin,
  Star,
  CheckCircle2,
  Globe,
  Mail,
  Clock,
  Share2,
  Navigation,
  Sparkles,
  Instagram,
  Facebook,
  Linkedin,
  Youtube,
  Trash2,
} from 'lucide-react';

interface BusinessDetailModalProps {
  business: Business | null;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export const BusinessDetailModal: React.FC<BusinessDetailModalProps> = ({
  business,
  onClose,
  onDelete,
}) => {
  if (!business) return null;

  const hasOffers = Boolean(business.offers && business.offers.length > 0);

  const handleWhatsApp = () => {
    const cleanPhone = business.phone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hello ${business.name}, I am contacting you via Leads Phone Book.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleDirections = () => {
    const query = encodeURIComponent(`${business.name}, ${business.address}, ${business.city}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
  };

  const handleShare = () => {
    const text = `${business.name}\n📞 ${business.phone}\n📍 ${business.address}, ${business.city}\nShared via Leads Phone Book`;
    if (navigator.share) {
      navigator.share({ title: business.name, text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Business details copied to clipboard!');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        className="modal-content modal-wide"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Cover Header Image */}
        <div className="business-detail-cover" style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: '#000' }}>
          <img
            src={business.image}
            alt={business.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80';
            }}
          />

          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 100%)',
            }}
          />

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(6px)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
              zIndex: 10,
            }}
          >
            <X size={18} />
          </button>

          {/* Floating Category & Rating */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '20px',
              right: '20px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              color: '#FFFFFF',
            }}
          >
            <div>
              <span
                style={{
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  fontSize: '12px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-full)',
                  display: 'inline-block',
                  marginBottom: '6px',
                }}
              >
                {business.category}
              </span>
              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {business.name}
                {hasOffers && <OfferFlagBadge size="md" />}
                {business.verified && <CheckCircle2 size={20} style={{ color: '#60A5FA' }} />}
              </h2>
            </div>

            {business.rating && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: 'rgba(245, 158, 11, 0.95)',
                  padding: '4px 10px',
                  borderRadius: '8px',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                <Star size={14} fill="#FFFFFF" />
                <span>{business.rating.toFixed(1)}</span>
                {business.reviewCount && <span style={{ opacity: 0.8 }}>({business.reviewCount})</span>}
              </div>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Active Offers Section */}
          {hasOffers && (
            <div
              style={{
                backgroundColor: 'var(--surface-variant)',
                border: '1.5px solid rgba(16, 185, 129, 0.35)',
                borderRadius: 'var(--radius-lg)',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <OfferFlagBadge size="md" />
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>
                  Active Deals & Promotions ({business.offers!.length})
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {business.offers!.map((offer, idx) => {
                  const palette = getOfferColor(offer, idx);
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        backgroundColor: palette.badgeBg,
                        border: `1.5px solid ${palette.border}`,
                        borderRadius: 'var(--radius-md)',
                        color: palette.text,
                        fontWeight: 700,
                        fontSize: '13.5px',
                      }}
                    >
                      <OfferFlagBadge size="sm" />
                      <span>{offer}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description */}
          {business.description && (
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                About This Business
              </h4>
              <p style={{ fontSize: '14px', color: 'var(--text)', lineHeight: 1.6 }}>
                {business.description}
              </p>
            </div>
          )}

          {/* Info Details Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px',
              backgroundColor: 'var(--surface-variant)',
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            {/* Phone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--surface)', color: 'var(--primary)' }}>
                <Phone size={16} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Phone</div>
                <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text)' }}>{business.phone}</div>
              </div>
            </div>

            {/* Address */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--surface)', color: '#EF4444' }}>
                <MapPin size={16} />
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Location</div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
                  {business.address}, {business.city}
                </div>
              </div>
            </div>

            {/* Hours */}
            {business.openingHours && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--surface)', color: '#F59E0B' }}>
                  <Clock size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Opening Hours</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>{business.openingHours}</div>
                </div>
              </div>
            )}

            {/* Email */}
            {business.email && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--surface)', color: '#06B6D4' }}>
                  <Mail size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Email</div>
                  <a
                    href={`mailto:${business.email}`}
                    style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}
                  >
                    {business.email}
                  </a>
                </div>
              </div>
            )}

            {/* Website */}
            {business.website && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ padding: '8px', borderRadius: '50%', backgroundColor: 'var(--surface)', color: '#8B5CF6' }}>
                  <Globe size={16} />
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Website</div>
                  <a
                    href={business.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}
                  >
                    Visit Website →
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Social Links */}
          {business.socials && Object.values(business.socials).some(Boolean) && (
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Social Profiles
              </h4>
              <div style={{ display: 'flex', gap: '10px' }}>
                {business.socials.instagram && (
                  <a
                    href={business.socials.instagram}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(236, 72, 153, 0.1)',
                      color: '#EC4899',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                    }}
                  >
                    <Instagram size={15} /> Instagram
                  </a>
                )}
                {business.socials.facebook && (
                  <a
                    href={business.socials.facebook}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(37, 99, 235, 0.1)',
                      color: '#2563EB',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                    }}
                  >
                    <Facebook size={15} /> Facebook
                  </a>
                )}
                {business.socials.linkedin && (
                  <a
                    href={business.socials.linkedin}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(14, 116, 144, 0.1)',
                      color: '#0E7490',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                    }}
                  >
                    <Linkedin size={15} /> LinkedIn
                  </a>
                )}
                {business.socials.youtube && (
                  <a
                    href={business.socials.youtube}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      padding: '8px 14px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'rgba(220, 38, 38, 0.1)',
                      color: '#DC2626',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      textDecoration: 'none',
                    }}
                  >
                    <Youtube size={15} /> YouTube
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="business-detail-footer modal-footer-pad"
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <button
            type="button"
            onClick={handleWhatsApp}
            style={{
              flex: 1,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#25D366',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            <MessageCircle size={18} /> Chat on WhatsApp
          </button>

          <button
            type="button"
            onClick={handleDirections}
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-variant)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              fontWeight: 600,
              fontSize: '14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
            }}
            title="Directions"
          >
            <Navigation size={17} /> Directions
          </button>

          <button
            type="button"
            onClick={handleShare}
            style={{
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--surface-variant)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              cursor: 'pointer',
            }}
            title="Share"
          >
            <Share2 size={17} />
          </button>

          {business.isCustomCreated && onDelete && (
            <button
              type="button"
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${business.name}?`)) {
                  onDelete(business.id);
                  onClose();
                }
              }}
              style={{
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                border: 'none',
                cursor: 'pointer',
              }}
              title="Delete Business"
            >
              <Trash2 size={17} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
