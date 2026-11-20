import React from 'react';
import {
  Users,
  Building2,
  Tag,
  Shield,
  PlusCircle,
  Sun,
  Moon,
  Sparkles,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useBusinesses } from '../../context/BusinessContext';
import { useContacts } from '../../context/ContactsContext';
import { OfferFlagBadge } from '../common/OfferFlagBadge';

export type NavTab = 'contacts' | 'businesses' | 'offers' | 'emergency';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenRegisterBusiness: () => void;
  onOpenAddContact: () => void;
  isSimulatorMode: boolean;
  onToggleSimulator: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenRegisterBusiness,
  onOpenAddContact,
  isSimulatorMode,
  onToggleSimulator,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { businesses, offersCount } = useBusinesses();
  const { contacts } = useContacts();

  const navItems = [
    {
      id: 'contacts' as NavTab,
      label: 'Contacts PhoneBook',
      icon: Users,
      badge: contacts.length,
    },
    {
      id: 'businesses' as NavTab,
      label: 'Business Leads',
      icon: Building2,
      badge: businesses.length,
    },
    {
      id: 'offers' as NavTab,
      label: 'Exclusive Offers',
      icon: Tag,
      badge: offersCount,
      hasFlag: true,
    },
    {
      id: 'emergency' as NavTab,
      label: 'Emergency 24x7',
      icon: Shield,
      badgeColor: '#EF4444',
    },
  ];

  return (
    <aside
      style={{
        width: '280px',
        height: '100vh',
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        flexDirection: 'column',
        padding: '24px 18px',
        boxShadow: 'var(--shadow-sm)',
        flexShrink: 0,
        overflowY: 'auto',
      }}
      className="desktop-sidebar"
    >
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px', paddingLeft: '6px' }}>
        <img
          src="/app-icon.png"
          alt="Leads Phone Book"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            boxShadow: '0 4px 14px rgba(30, 96, 242, 0.35)',
            objectFit: 'cover',
          }}
        />
        <div style={{ minWidth: 0 }}>
          <h1
            style={{
              fontSize: '17px',
              fontWeight: 800,
              color: 'var(--text)',
              lineHeight: 1.2,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}
          >
            Leads Phone Book
          </h1>
          <p style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
            Smart Directory & Deals
          </p>
        </div>
      </div>

      {/* Main Navigation List */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '24px' }}>
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 14px',
                borderRadius: 'var(--radius-md)',
                border: 'none',
                backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                fontWeight: isActive ? 800 : 600,
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
              className="hover:bg-primary-light hover:text-primary"
            >
              <Icon size={19} style={{ strokeWidth: isActive ? 2.5 : 2 }} />
              <span style={{ flex: 1 }}>{item.label}</span>

              {item.hasFlag && <OfferFlagBadge size="sm" />}

              {item.badge !== undefined && (
                <span
                  style={{
                    fontSize: '11.5px',
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: '10px',
                    backgroundColor: isActive ? 'var(--primary)' : 'var(--surface-variant)',
                    color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Action CTA Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
        <button
          type="button"
          onClick={onOpenRegisterBusiness}
          style={{
            width: '100%',
            padding: '11px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary-gradient)',
            color: '#FFFFFF',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-glow)',
          }}
          className="hover:opacity-95"
        >
          <Building2 size={16} /> Register Business
        </button>

        <button
          type="button"
          onClick={onOpenAddContact}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--surface-variant)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
          className="hover:border-primary"
        >
          <PlusCircle size={15} /> Add New Contact
        </button>
      </div>

      {/* Live System Stats Card */}
      <div
        style={{
          marginTop: 'auto',
          backgroundColor: 'var(--surface-variant)',
          borderRadius: 'var(--radius-lg)',
          padding: '14px',
          border: '1px solid var(--border)',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <CheckCircle2 size={14} style={{ color: '#16A34A' }} />
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
            System Live Status
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
          <span>Verified Businesses</span>
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>100%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-tertiary)' }}>
          <span>Active Offer Campaigns</span>
          <span style={{ fontWeight: 700, color: '#059669' }}>{offersCount} Live</span>
        </div>
      </div>

      {/* Bottom Bar: Mode Switcher & Theme Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
        {/* Toggle Mobile Simulator Preview */}
        <button
          type="button"
          onClick={onToggleSimulator}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: isSimulatorMode ? 'var(--primary)' : 'transparent',
            color: isSimulatorMode ? '#FFFFFF' : 'var(--text-secondary)',
            border: isSimulatorMode ? 'none' : '1px solid var(--border)',
            borderRadius: 'var(--radius-full)',
            padding: '6px 12px',
            fontSize: '11.5px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          title="Toggle Mobile App Simulator Frame"
        >
          <Smartphone size={14} />
          {isSimulatorMode ? 'App Frame ON' : 'Mobile Preview'}
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            background: 'var(--surface-variant)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={17} color="#F59E0B" /> : <Moon size={17} color="#1E60F2" />}
        </button>
      </div>
    </aside>
  );
};
