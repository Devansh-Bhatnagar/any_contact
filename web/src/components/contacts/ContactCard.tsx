import React from 'react';
import { Contact } from '../../types/contact';
import { OfferFlagBadge } from '../common/OfferFlagBadge';
import { MessageCircle, Star, Mail, Smartphone } from 'lucide-react';

interface ContactCardProps {
  contact: Contact;
  onSelect: (c: Contact) => void;
  onToggleFavorite: (id: string) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onSelect,
  onToggleFavorite,
}) => {
  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = contact.primaryPhone.replace(/[^0-9]/g, '');
    const message = encodeURIComponent(
      `Hey ${contact.name}! Connect with me on Leads Phone Book: https://anycontact.app/download`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleStar = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleFavorite(contact.id);
  };

  const hasOffers = Boolean(contact.offers && contact.offers.length > 0);

  return (
    <div
      onClick={() => onSelect(contact)}
      className="contact-card group"
    >
      {/* Avatar Container with App Status Indicator */}
      <div className="contact-card-avatar-wrap">
        <img
          src={contact.avatar}
          alt={contact.name}
          className="contact-card-avatar-img"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80';
          }}
        />

        {contact.hasApp && (
          <span
            className="contact-card-online-dot"
            title="Leads Phone Book App Active"
          />
        )}
      </div>

      {/* Info Body - Clean Hierarchical DOM */}
      <div className="contact-card-info">
        {/* Line 1: Contact Name + Offer Flag (Full width, never cramped!) */}
        <div className="contact-card-name-row">
          <h3 className="contact-card-name" title={contact.name}>
            {contact.name}
          </h3>
          {hasOffers && <OfferFlagBadge size="sm" />}
        </div>

        {/* Line 2: Category Badge (Structured pill badge, never collides with name!) */}
        {contact.category && (
          <div className="contact-card-category-row">
            <span className="contact-card-category-pill">
              {contact.category}
            </span>
          </div>
        )}

        {/* Line 3: Primary Phone */}
        <div className="contact-card-phone-row">
          <Smartphone size={12} className="contact-card-icon" />
          <span className="contact-card-phone-text">{contact.primaryPhone}</span>
        </div>

        {/* Line 4: Email or Active Deal */}
        {hasOffers ? (
          <div className="contact-card-offer-row">
            <span className="contact-card-offer-text">🏷️ {contact.offers![0]}</span>
          </div>
        ) : contact.email ? (
          <div className="contact-card-email-row">
            <Mail size={11} className="contact-card-icon" />
            <span className="contact-card-email-text">{contact.email}</span>
          </div>
        ) : null}
      </div>

      {/* Quick Action Buttons (Star, WhatsApp) */}
      <div className="contact-card-actions">
        <button
          type="button"
          onClick={handleStar}
          className={`contact-card-action-btn star-btn ${contact.isFavorite ? 'favorited' : ''}`}
          title={contact.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
        >
          <Star size={15} fill={contact.isFavorite ? '#F59E0B' : 'transparent'} />
        </button>

        <button
          type="button"
          onClick={handleWhatsApp}
          className="contact-card-action-btn whatsapp-btn"
          title={`Chat with ${contact.name} on WhatsApp`}
        >
          <MessageCircle size={14} />
        </button>
      </div>
    </div>
  );
};
