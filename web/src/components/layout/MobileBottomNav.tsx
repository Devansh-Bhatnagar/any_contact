import React from 'react';
import { NavTab } from './Sidebar';
import { Users, Building2, Tag, Shield } from 'lucide-react';
import { OfferFlagBadge } from '../common/OfferFlagBadge';

interface MobileBottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenRegisterBusiness: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60px',
        backgroundColor: 'var(--surface)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
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
          flex: 1,
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
          padding: '8px 0',
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
          flex: 1,
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
          padding: '8px 0',
        }}
      >
        <Building2 size={20} strokeWidth={activeTab === 'businesses' ? 2.5 : 2} />
        <span>Businesses</span>
      </button>

      {/* 3. Offers Hub */}
      <button
        type="button"
        onClick={() => onSelectTab('offers')}
        style={{
          flex: 1,
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
          padding: '8px 0',
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

      {/* 4. Emergency */}
      <button
        type="button"
        onClick={() => onSelectTab('emergency')}
        style={{
          flex: 1,
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
          padding: '8px 0',
        }}
      >
        <Shield size={20} strokeWidth={activeTab === 'emergency' ? 2.5 : 2} />
        <span>Emergency</span>
      </button>
    </nav>
  );
};
