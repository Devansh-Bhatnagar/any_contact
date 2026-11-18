import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useBusinesses } from '../../context/BusinessContext';
import { useContacts } from '../../context/ContactsContext';
import { NavTab } from './Sidebar';
import { SearchBar } from '../common/SearchBar';
import {
  Sun,
  Moon,
  Plus,
  Building2,
  Smartphone,
  Tag,
  Users,
  PhoneCall,
  Menu,
  RefreshCw,
} from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeTab: NavTab;
  onSelectTab: (t: NavTab) => void;
  onOpenRegisterBusiness: () => void;
  onOpenAddContact: () => void;
  isSimulatorMode: boolean;
  onToggleSimulator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  activeTab,
  onSelectTab,
  onOpenRegisterBusiness,
  onOpenAddContact,
  isSimulatorMode,
  onToggleSimulator,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { isLiveBackend, refreshBusinesses, isLoading: isBizLoading } = useBusinesses();
  const { refreshContacts, isLoading: isContactsLoading } = useContacts();

  return (
    <header
      className="navbar-header"
      style={{
        height: '70px',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Mobile Brand Logo (shown only on mobile, hidden on lg+) */}
      <div
        className="show-mobile-only"
        style={{ alignItems: 'center', gap: '8px', flexShrink: 0, marginRight: '10px' }}
      >
        <img
          src="/app-icon.png"
          alt="Leads Phone Book"
          style={{ width: '32px', height: '32px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
        />
        <span
          className="navbar-brand-text"
          style={{
            fontSize: '15px',
            fontWeight: 800,
            color: 'var(--text)',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.02em',
          }}
        >
          Leads Phone Book
        </span>
      </div>

      {/* Global Search Bar (hidden on mobile, shown sm+) */}
      <div className="hidden-mobile-block" style={{ flex: 1, maxWidth: '560px', marginRight: '16px' }}>
        <SearchBar
          value={searchQuery}
          onChange={onSearchChange}
          placeholder={
            activeTab === 'businesses' || activeTab === 'offers'
              ? 'Search businesses, categories, cities, or offers...'
              : 'Search contacts by name, mobile, email...'
          }
        />
      </div>

      {/* Right Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Live Server Sync Pill */}
        <button
          type="button"
          onClick={() => {
            refreshBusinesses();
            refreshContacts();
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            fontSize: '11.5px',
            fontWeight: 700,
            border: '1px solid var(--border)',
            backgroundColor: isLiveBackend ? 'rgba(16, 185, 129, 0.12)' : 'var(--surface-variant)',
            color: isLiveBackend ? '#059669' : 'var(--text-tertiary)',
            cursor: 'pointer',
          }}
          title="Click to re-sync with Leads Phone Book backend API"
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: isLiveBackend ? '#10B981' : '#F59E0B',
              boxShadow: isLiveBackend ? '0 0 6px #10B981' : 'none',
            }}
          />
          <span className="text-hide-mobile">
            {isBizLoading || isContactsLoading ? 'Syncing...' : isLiveBackend ? 'API Live' : 'Backend Ready'}
          </span>
          <RefreshCw
            size={12}
            style={{
              animation: isBizLoading || isContactsLoading ? 'spin 1s linear infinite' : 'none',
            }}
          />
        </button>

        {/* Toggle Mobile Simulator */}
        <button
          type="button"
          onClick={onToggleSimulator}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: isSimulatorMode ? 'var(--primary)' : 'var(--surface-variant)',
            color: isSimulatorMode ? '#FFFFFF' : 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-full)',
            padding: '7px 14px',
            fontSize: '12px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          className="hidden-below-md"
          title="Toggle interactive mobile phone preview frame"
        >
          <Smartphone size={15} />
          <span>{isSimulatorMode ? 'Exit Mobile Frame' : 'Mobile App Frame'}</span>
        </button>

        {/* Add Contact Button */}
        <button
          type="button"
          onClick={onOpenAddContact}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--surface-variant)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
          className="hidden-mobile"
        >
          <Plus size={15} /> Contact
        </button>

        {/* Register Business Button */}
        <button
          type="button"
          onClick={onOpenRegisterBusiness}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--primary-gradient)',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 800,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-glow)',
          }}
          className="hidden-mobile"
        >
          <Building2 size={15} /> Register Business
        </button>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          style={{
            background: 'var(--surface-variant)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={18} color="#F59E0B" /> : <Moon size={18} color="#1E60F2" />}
        </button>
      </div>
    </header>
  );
};
