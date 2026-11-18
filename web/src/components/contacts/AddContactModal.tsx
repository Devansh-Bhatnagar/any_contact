import React, { useState } from 'react';
import { useContacts } from '../../context/ContactsContext';
import { X, UserPlus, Phone, Mail, Tag, FileText, CheckCircle2 } from 'lucide-react';

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (name: string) => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { addContact } = useContacts();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneLabel, setPhoneLabel] = useState<'Mobile' | 'Work' | 'Home'>('Mobile');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('Friends');
  const [notes, setNotes] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Contact name is required');
      return;
    }
    if (!phone.trim()) {
      setError('Primary phone number is required');
      return;
    }

    const defaultAvatars = [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&q=80',
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    ];
    const pickedAvatar =
      avatarUrl.trim() || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    setIsSubmitting(true);
    try {
      await addContact({
        name: name.trim(),
        primaryPhone: phone.trim(),
        phoneNumbers: [{ label: phoneLabel, number: phone.trim() }],
        email: email.trim(),
        category,
        avatar: pickedAvatar,
        hasApp: true,
        notes: notes.trim(),
        isFavorite: false,
        isBlocked: false,
      });

      if (onSuccess) onSuccess(name.trim());
      onClose();
    } catch (err) {
      console.error('Add contact failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(6px)',
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
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--surface-variant)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <UserPlus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text)' }}>
                Add New Contact
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Save contact details to Leads Phone Book
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

        {/* Form Body */}
        <form
          onSubmit={handleSubmit}
          className="modal-body-pad"
          style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}
        >
          {error && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#EF4444',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              Full Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. Rahul Sharma"
              style={{
                width: '100%',
                height: '42px',
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                fontSize: '14px',
                outline: 'none',
              }}
            />
          </div>

          {/* Phone & Label */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              Phone Number <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
                <Phone size={15} style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)' }} />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="+91 98765 43210"
                  style={{
                    width: '100%',
                    height: '42px',
                    paddingLeft: '36px',
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

              <select
                value={phoneLabel}
                onChange={(e) => setPhoneLabel(e.target.value as any)}
                style={{
                  width: '100px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: '13px',
                  fontWeight: 600,
                  outline: 'none',
                  cursor: 'pointer',
                  padding: '0 8px',
                }}
              >
                <option value="Mobile">Mobile</option>
                <option value="Work">Work</option>
                <option value="Home">Home</option>
              </select>
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              Email Address
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Mail size={15} style={{ position: 'absolute', left: '12px', color: 'var(--text-tertiary)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                style={{
                  width: '100%',
                  height: '42px',
                  paddingLeft: '36px',
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

          {/* Category Tag */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              Category Tag
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['Friends', 'Work', 'Family', 'Colleagues', 'Business', 'Services'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: category === cat ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                    backgroundColor: category === cat ? 'var(--primary-light)' : 'var(--surface)',
                    color: category === cat ? 'var(--primary)' : 'var(--text-secondary)',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Designation, company, mutual friend or reminder..."
              rows={2}
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--text)',
                fontSize: '13.5px',
                outline: 'none',
                resize: 'none',
              }}
            />
          </div>

          {/* Submit */}
          <div style={{ paddingTop: '8px' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                background: isSubmitting ? 'var(--text-tertiary)' : 'var(--primary-gradient)',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '14.5px',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: 'var(--shadow-glow)',
              }}
            >
              <CheckCircle2 size={18} />
              {isSubmitting ? 'Saving to Server...' : 'Save Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
