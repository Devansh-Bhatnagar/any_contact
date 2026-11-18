import React from 'react';
import { Contact } from '../../types/contact';
import { OfferFlagBadge } from '../common/OfferFlagBadge';
import { Phone, MessageCircle, Star, Mail, Smartphone } from 'lucide-react';

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
  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${contact.primaryPhone}`;
  };

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
      className="contact-card group hover:border-primary hover:shadow-md hover:-translate-y-0.5"
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

        {/* Green App Live Connection Dot */}
        {contact.hasApp && (
          <span
            className="contact-card-online-dot"
            title="Leads Phone Book App Active"
          />
        )}
      </div>

      {/* Info Body */}
      <div className="contact-card-info">
        <div className="contact-card-header-row">
          <h3 className="contact-card-name">
            {contact.name}
          </h3>

          {/* Offer Flag if Business Contact has Offers */}
          {hasOffers && <OfferFlagBadge size="sm" />}

          {contact.category && (
            <span className="contact-card-category-badge">
              {contact.category}
            </span>
          )}
        </div>

        {/* Primary Phone */}
        <div className="contact-card-phone-row">
          <Smartphone size={12} className="contact-card-phone-icon" />
          <span className="contact-card-phone-text">{contact.primaryPhone}</span>
        </div>

        {/* Email or Offer Teaser */}
        {hasOffers ? (
          <div className="contact-card-offer-teaser">
            🏷️ {contact.offers![0]}
          </div>
        ) : contact.email ? (
          <div className="contact-card-email-row">
            <Mail size={11} className="contact-card-email-icon" />
            <span className="contact-card-email-text">{contact.email}</span>
          </div>
        ) : null}
      </div>

      {/* Quick Action Buttons */}
      <div className="contact-card-actions">
        {/* Favorite Star */}
        <button
          type="button"
          onClick={handleStar}
          className={`contact-card-action-btn star-btn ${contact.isFavorite ? 'favorited' : ''}`}
          title={contact.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
        >
          <Star size={15} fill={contact.isFavorite ? '#F59E0B' : 'transparent'} />
        </button>

        {/* Call Button */}
        <button
          type="button"
          onClick={handleCall}
          className="contact-card-action-btn call-btn"
          title="Direct Call"
        >
          <Phone size={14} />
        </button>

        {/* WhatsApp Button */}
        <button
          type="button"
          onClick={handleWhatsApp}
          className="contact-card-action-btn whatsapp-btn"
          title="Chat on WhatsApp"
        >
          <MessageCircle size={14} />
        </button>
      </div>
    </div>
  );
};
