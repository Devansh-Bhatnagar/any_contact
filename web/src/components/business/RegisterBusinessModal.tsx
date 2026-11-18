import React, { useState } from 'react';
import { useBusinesses } from '../../context/BusinessContext';
import { CATEGORIES, PRESET_OFFER_TEMPLATES } from '../../data/categories';
import { getOfferColor } from '../../constants/offerColors';
import { OfferFlagBadge } from '../common/OfferFlagBadge';
import {
  X,
  Building2,
  Phone,
  Mail,
  User,
  MapPin,
  Clock,
  Globe,
  Tag,
  Plus,
  Check,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface RegisterBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (name: string) => void;
}

export const RegisterBusinessModal: React.FC<RegisterBusinessModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { registerBusiness, categories: liveCategories } = useBusinesses();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Restaurants');
  const [phone, setPhone] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [openingHours, setOpeningHours] = useState('09:00 AM - 08:30 PM');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [offers, setOffers] = useState<string[]>([]);
  const [customOfferText, setCustomOfferText] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleTogglePresetOffer = (preset: string) => {
    if (offers.includes(preset)) {
      setOffers(offers.filter((o) => o !== preset));
    } else {
      setOffers([...offers, preset]);
    }
  };

  const handleAddCustomOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customOfferText.trim()) return;
    if (!offers.includes(customOfferText.trim())) {
      setOffers([...offers, customOfferText.trim()]);
    }
    setCustomOfferText('');
  };

  const handleRemoveOffer = (offer: string) => {
    setOffers(offers.filter((o) => o !== offer));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Company / Business name is required';
    if (!phone.trim()) newErrors.phone = 'Phone number is required';
    if (!city.trim()) newErrors.city = 'City is required';
    if (!address.trim()) newErrors.address = 'Full address is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const defaultImages: Record<string, string> = {
      Restaurants: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
      Cafes: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
      Hotels: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
      Hospitals: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&q=80',
      Grocery: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
      Electronics: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=800&q=80',
      Salons: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&q=80',
      Gyms: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
      'Real Estate': 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
      Automobile: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=800&q=80',
    };

    const finalImage =
      image.trim() ||
      defaultImages[category] ||
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80';

    setIsSubmitting(true);
    try {
      await registerBusiness({
        name: name.trim(),
        category,
        phone: phone.trim(),
        ownerName: ownerName.trim(),
        email: email.trim(),
        city: city.trim(),
        address: address.trim(),
        openingHours: openingHours.trim(),
        website: website.trim(),
        description: description.trim() || `Premier ${category} business in ${city.trim()}.`,
        image: finalImage,
        offers,
        isBestie: false,
      });

      if (onSuccess) {
        onSuccess(name.trim());
      }
      onClose();
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectableCategories = (liveCategories && liveCategories.length > 0 ? liveCategories : CATEGORIES).filter((c) => c.name !== 'All');

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
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
          maxWidth: '720px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--surface-variant)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 12px rgba(30, 96, 242, 0.35)',
              }}
            >
              <Building2 size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                Register Your Business
              </h2>
              <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                List your business on Leads Phone Book & promote exclusive deals
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Company Name */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              Company / Business Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Building2 size={17} style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)' }} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Sharma Electronics & Mobile Hub"
                style={{
                  width: '100%',
                  height: '44px',
                  paddingLeft: '38px',
                  paddingRight: '12px',
                  borderRadius: 'var(--radius-md)',
                  border: errors.name ? '1.5px solid #EF4444' : '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: '14px',
                  fontWeight: 500,
                  outline: 'none',
                }}
              />
            </div>
            {errors.name && <p style={{ fontSize: '11.5px', color: '#EF4444', marginTop: '4px' }}>{errors.name}</p>}
          </div>

          {/* Category Dropdown */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              Business Category <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                fontSize: '14px',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {selectableCategories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Two Columns: Phone & Email */}
          <div className="form-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Phone Number <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Phone size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  style={{
                    width: '100%',
                    height: '44px',
                    paddingLeft: '38px',
                    paddingRight: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: errors.phone ? '1.5px solid #EF4444' : '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
              {errors.phone && <p style={{ fontSize: '11.5px', color: '#EF4444', marginTop: '4px' }}>{errors.phone}</p>}
            </div>

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Business Email (Optional)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@business.com"
                  style={{
                    width: '100%',
                    height: '44px',
                    paddingLeft: '38px',
                    paddingRight: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Two Columns: Owner Name & City */}
          <div className="form-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {/* Owner Name */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Owner / Contact Person
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
                  style={{
                    width: '100%',
                    height: '44px',
                    paddingLeft: '38px',
                    paddingRight: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* City */}
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                City <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <MapPin size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai / Jaipur / Delhi"
                  style={{
                    width: '100%',
                    height: '44px',
                    paddingLeft: '38px',
                    paddingRight: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: errors.city ? '1.5px solid #EF4444' : '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
              {errors.city && <p style={{ fontSize: '11.5px', color: '#EF4444', marginTop: '4px' }}>{errors.city}</p>}
            </div>
          </div>

          {/* Full Address */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              Full Address <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop No, Street, Landmark, Market"
              style={{
                width: '100%',
                height: '44px',
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: errors.address ? '1.5px solid #EF4444' : '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            {errors.address && <p style={{ fontSize: '11.5px', color: '#EF4444', marginTop: '4px' }}>{errors.address}</p>}
          </div>

          {/* Opening Hours & Website */}
          <div className="form-two-col" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Opening Hours
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Clock size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  value={openingHours}
                  onChange={(e) => setOpeningHours(e.target.value)}
                  placeholder="09:00 AM - 08:30 PM"
                  style={{
                    width: '100%',
                    height: '44px',
                    paddingLeft: '38px',
                    paddingRight: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
                Website (Optional)
              </label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Globe size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)' }} />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://yourbusiness.com"
                  style={{
                    width: '100%',
                    height: '44px',
                    paddingLeft: '38px',
                    paddingRight: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '14px',
                    outline: 'none',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              About Your Business & Services
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your specialties, products, warranties, or services offered..."
              rows={3}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                fontSize: '14px',
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          {/* SPECIAL OFFERS & DEALS SECTION (With Offer Flag Header!) */}
          <div
            style={{
              backgroundColor: 'var(--surface-variant)',
              border: '1.5px solid rgba(16, 185, 129, 0.35)',
              borderRadius: 'var(--radius-lg)',
              padding: '18px',
            }}
          >
            {/* Header with Wavy Green Flag */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <OfferFlagBadge size="lg" />
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)' }}>
                  Special Offers & Deals (Optional)
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Add discounts, "Buy 1 Get 1 Free", or festive combo offers to attract customers!
                </p>
              </div>
            </div>

            {/* Quick Suggestions (NO flag on preset chips, tick mark when selected!) */}
            <div style={{ marginTop: '14px', marginBottom: '14px' }}>
              <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Quick suggestions (click to select):
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PRESET_OFFER_TEMPLATES.map((preset, pIdx) => {
                  const isSelected = offers.includes(preset);
                  const palette = getOfferColor(preset, pIdx);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handleTogglePresetOffer(preset)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '12.5px',
                        fontWeight: isSelected ? 700 : 500,
                        backgroundColor: isSelected ? palette.badgeBg : 'var(--surface)',
                        color: isSelected ? palette.text : 'var(--text-secondary)',
                        border: isSelected ? `1.5px solid ${palette.primary}` : '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected && <Check size={13} style={{ color: palette.primary, strokeWidth: 3 }} />}
                      <span>{preset}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Offer Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                <Tag size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  value={customOfferText}
                  onChange={(e) => setCustomOfferText(e.target.value)}
                  placeholder="Type custom offer (e.g. 1 Par 1 Free on Weekends)..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomOffer(e);
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '40px',
                    paddingLeft: '38px',
                    paddingRight: '12px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleAddCustomOffer}
                disabled={!customOfferText.trim()}
                style={{
                  padding: '0 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: customOfferText.trim() ? 'var(--primary)' : 'var(--border)',
                  color: customOfferText.trim() ? '#FFFFFF' : 'var(--text-tertiary)',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: customOfferText.trim() ? 'pointer' : 'default',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Plus size={15} /> Add
              </button>
            </div>

            {/* Active Selected Offers List */}
            {offers.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  Active Offers on this Business ({offers.length}):
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {offers.map((offer, idx) => {
                    const palette = getOfferColor(offer, idx);
                    return (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '5px 10px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: palette.badgeBg,
                          border: `1px solid ${palette.border}`,
                          color: palette.text,
                          fontSize: '12px',
                          fontWeight: 700,
                        }}
                      >
                        <span>{offer}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOffer(offer)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: palette.text,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                        >
                          <X size={13} />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div style={{ paddingTop: '8px' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: 'var(--radius-md)',
                background: isSubmitting ? 'var(--text-tertiary)' : 'var(--primary-gradient)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 800,
                fontSize: '15px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                boxShadow: 'var(--shadow-glow)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'transform 0.15s ease',
              }}
              className={!isSubmitting ? 'hover:opacity-95 active:scale-[0.99]' : ''}
            >
              <CheckCircle2 size={18} />
              {isSubmitting ? 'Registering with Server...' : 'Register Business & Publish Deals'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
