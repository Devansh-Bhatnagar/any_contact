import React from 'react';
import { Contact } from '../../types/contact';
import { OfferFlagBadge } from '../common/OfferFlagBadge';
import {
  X,
  Phone,
  MessageCircle,
  Mail,
  Star,
  Share2,
  Trash2,
  ShieldAlert,
  Smartphone,
  Copy,
  Check,
} from 'lucide-react';

interface ContactDetailModalProps {
  contact: Contact | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleBlock: (id: string) => void;
}

export const ContactDetailModal: React.FC<ContactDetailModalProps> = ({
  contact,
  onClose,
  onToggleFavorite,
  onDelete,
  onToggleBlock,
}) => {
  const [copiedNumber, setCopiedNumber] = React.useState<string | null>(null);

  if (!contact) return null;

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handleCall = (num: string) => {
    window.location.href = `tel:${num}`;
  };

  const handleWhatsApp = (num: string) => {
    const clean = num.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hey ${contact.name}! Connect with me on Leads Phone Book: https://anycontact.app/download`
    );
    window.open(`https://wa.me/${clean}?text=${message}`, '_blank');
  };

  const handleShare = () => {
    const text = `Contact: ${contact.name}\nPhone: ${contact.primaryPhone}\nEmail: ${contact.email || 'N/A'}\nShared via Leads Phone Book`;
    if (navigator.share) {
      navigator.share({ title: contact.name, text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      alert('Contact copied to clipboard!');
    }
  };

  const hasOffers = Boolean(contact.offers && contact.offers.length > 0);

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
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '520px',
          maxHeight: '92vh',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header Profile Area with Gradient */}
        <div
          style={{
            position: 'relative',
            background: 'var(--primary-gradient)',
            padding: '36px 24px 28px',
            textAlign: 'center',
            color: '#FFFFFF',
          }}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <X size={18} />
          </button>

          {/* Favorite toggle top-left */}
          <button
            type="button"
            onClick={() => onToggleFavorite(contact.id)}
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: contact.isFavorite ? '#FDE047' : '#FFFFFF',
              cursor: 'pointer',
            }}
            title={contact.isFavorite ? 'Remove Favorite' : 'Add to Favorites'}
          >
            <Star size={18} fill={contact.isFavorite ? '#FDE047' : 'transparent'} />
          </button>

          {/* Large Avatar */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '14px' }}>
            <img
              src={contact.avatar}
              alt={contact.name}
              style={{
                width: '84px',
                height: '84px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3.5px solid rgba(255, 255, 255, 0.9)',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80';
              }}
            />
            {contact.hasApp && (
              <span
                style={{
                  position: 'absolute',
                  bottom: '2px',
                  right: '2px',
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#16A34A',
                  border: '2.5px solid #FFFFFF',
                }}
                title="Active on Leads Phone Book"
              />
            )}
          </div>

          <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {contact.name}
            {hasOffers && <OfferFlagBadge size="sm" />}
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {contact.category && (
              <span
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 10px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {contact.category}
              </span>
            )}
            {contact.hasApp && (
              <span
                style={{
                  backgroundColor: 'rgba(22, 163, 74, 0.9)',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 10px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                App Connected
              </span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', maxHeight: '50vh' }}>
          {/* Active Offers if any */}
          {hasOffers && (
            <div
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <OfferFlagBadge size="sm" />
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>
                  Business Deals Associated
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '13px', color: '#047857', fontWeight: 600 }}>
                {contact.offers!.map((off, oIdx) => (
                  <li key={oIdx}>{off}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Phone Numbers List */}
          <div>
            <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
              Phone Numbers
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {contact.phoneNumbers.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--surface-variant)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Smartphone size={16} style={{ color: 'var(--primary)' }} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>{p.number}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{p.label}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleCopy(p.number)}
                      style={{
                        padding: '6px',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-secondary)',
                        cursor: 'pointer',
                        borderRadius: '6px',
                      }}
                      title="Copy number"
                    >
                      {copiedNumber === p.number ? <Check size={16} color="#16A34A" /> : <Copy size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCall(p.number)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#16A34A',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <Phone size={13} /> Call
                    </button>
                    <button
                      type="button"
                      onClick={() => handleWhatsApp(p.number)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#25D366',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <MessageCircle size={13} /> Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email */}
          {contact.email && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-variant)',
                border: '1px solid var(--border)',
              }}
            >
              <Mail size={16} style={{ color: 'var(--text-tertiary)' }} />
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>Email Address</div>
                <a
                  href={`mailto:${contact.email}`}
                  style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--primary)', textDecoration: 'none' }}
                >
                  {contact.email}
                </a>
              </div>
            </div>
          )}

          {/* Notes */}
          {contact.notes && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--surface-variant)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                Notes & Reminders
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5, margin: 0 }}>
                {contact.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="contact-detail-footer modal-footer-pad"
          style={{
            padding: '14px 20px',
            backgroundColor: 'var(--surface)',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={handleShare}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface-variant)',
              color: 'var(--text)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Share2 size={15} /> Share
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                onToggleBlock(contact.id);
                onClose();
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#EF4444',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <ShieldAlert size={15} /> {contact.isBlocked ? 'Unblock' : 'Block'}
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${contact.name}?`)) {
                  onDelete(contact.id);
                  onClose();
                }
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Trash2 size={15} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
