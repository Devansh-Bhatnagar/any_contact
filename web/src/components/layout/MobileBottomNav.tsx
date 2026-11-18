import React from 'react';
import { NavTab } from './Sidebar';
import { Users, Building2, PhoneCall, Tag, Shield, PlusCircle } from 'lucide-react';
import { OfferFlagBadge } from '../common/OfferFlagBadge';

interface MobileBottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenRegisterBusiness: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenRegisterBusiness,
}) => {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '64px',
        backgroundColor: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        alignItems: 'center',
        justifyContent: 'space-around',
        zIndex: 50,
        boxShadow: '0 -4px 16px rgba(0,0,0,0.06)',
      }}
      className="mobile-bottom-nav"
    >
      {/* 1. Contacts */}
      <button
        type="button"
        onClick={() => onSelectTab('contacts')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          background: 'transparent',
          border: 'none',
          color: activeTab === 'contacts' ? 'var(--primary)' : 'var(--text-tertiary)',
          fontSize: '11px',
          fontWeight: activeTab === 'contacts' ? 700 : 500,
          cursor: 'pointer',
        }}
      >
        <Users size={20} strokeWidth={activeTab === 'contacts' ? 2.5 : 2} />
        <span>Contacts</span>
      </button>

      {/* 2. Businesses */}
      <button
        type="button"
        onClick={() => onSelectTab('businesses')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          background: 'transparent',
          border: 'none',
          color: activeTab === 'businesses' ? 'var(--primary)' : 'var(--text-tertiary)',
          fontSize: '11px',
          fontWeight: activeTab === 'businesses' ? 700 : 500,
          cursor: 'pointer',
        }}
      >
        <Building2 size={20} strokeWidth={activeTab === 'businesses' ? 2.5 : 2} />
        <span>Businesses</span>
      </button>

      {/* 3. Center Raised Dialer Button */}
      <button
        type="button"
        onClick={() => onSelectTab('dialer')}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'var(--primary-gradient)',
          color: '#FFFFFF',
          border: '3px solid var(--surface)',
          marginTop: '-24px',
          boxShadow: '0 6px 16px rgba(30, 96, 242, 0.45)',
          cursor: 'pointer',
          transform: activeTab === 'dialer' ? 'scale(1.08)' : 'scale(1)',
          transition: 'transform 0.15s ease',
        }}
        title="Open Dialer"
      >
        <PhoneCall size={22} />
      </button>

      {/* 4. Offers Hub */}
      <button
        type="button"
        onClick={() => onSelectTab('offers')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          background: 'transparent',
          border: 'none',
          color: activeTab === 'offers' ? '#059669' : 'var(--text-tertiary)',
          fontSize: '11px',
          fontWeight: activeTab === 'offers' ? 700 : 500,
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Tag size={20} strokeWidth={activeTab === 'offers' ? 2.5 : 2} />
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-8px',
            }}
          >
            <OfferFlagBadge size="sm" />
          </span>
        </div>
        <span>Offers</span>
      </button>

      {/* 5. Emergency */}
      <button
        type="button"
        onClick={() => onSelectTab('emergency')}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          background: 'transparent',
          border: 'none',
          color: activeTab === 'emergency' ? '#EF4444' : 'var(--text-tertiary)',
          fontSize: '11px',
          fontWeight: activeTab === 'emergency' ? 700 : 500,
          cursor: 'pointer',
        }}
      >
        <Shield size={20} strokeWidth={activeTab === 'emergency' ? 2.5 : 2} />
        <span>Emergency</span>
      </button>
    </nav>
  );
};
