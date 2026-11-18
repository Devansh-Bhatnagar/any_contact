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

const tabMeta: Record<NavTab, { title: string; subtitle: string }> = {
  contacts: { title: 'Contacts Directory', subtitle: 'Verified phonebook & smart speed dial' },
  businesses: { title: 'Business Leads', subtitle: 'Explore local shops, verified services & deals' },
  offers: { title: 'Exclusive Deals', subtitle: 'Promotions, buy-1-get-1 & festive combo savings' },
  dialer: { title: 'Smart Keypad Dialer', subtitle: 'Authentic DTMF tone calling & speed contacts' },
  emergency: { title: '24x7 Emergency Hub', subtitle: 'Unified 112 & official national helplines' },
};

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  activeTab,
  onOpenRegisterBusiness,
  onOpenAddContact,
  isSimulatorMode,
  onToggleSimulator,
}) => {
  const { isDark, toggleTheme } = useTheme();
  const { isLiveBackend, refreshBusinesses, isLoading: isBizLoading } = useBusinesses();
  const { refreshContacts, isLoading: isContactsLoading } = useContacts();

  const isSyncing = isBizLoading || isContactsLoading;

  return (
    <header className="navbar-header">
      {/* 1. LEFT BRAND / TITLE AREA */}
      <div className="navbar-left-area">
        {/* Desktop View Title & Breadcrumb (hidden on <1024px) */}
        <div className="navbar-desktop-title-block">
          <h2 className="navbar-page-title">{tabMeta[activeTab].title}</h2>
          <span className="navbar-page-subtitle">{tabMeta[activeTab].subtitle}</span>
        </div>

        {/* Mobile & Tablet Brand Header (shown only on <1024px) */}
        <div className="navbar-mobile-brand-block">
          <img
            src="/app-icon.png"
            alt="Leads Phone Book"
            className="navbar-brand-logo-img"
          />
          <div className="navbar-brand-text-wrap">
            <span className="navbar-brand-title">Leads Phone Book</span>
            <span className="navbar-brand-sub">Smart Directory</span>
          </div>
        </div>
      </div>

      {/* 2. CENTER GLOBAL SEARCH BAR (Shown on tablet & desktop >=640px) */}
      <div className="navbar-search-block">
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

      {/* 3. RIGHT ACTIONS AREA */}
      <div className="navbar-actions-area">
        {/* Live Server Sync Pill */}
        <button
          type="button"
          onClick={() => {
            refreshBusinesses();
            refreshContacts();
          }}
          className={`navbar-sync-btn ${isLiveBackend ? 'live' : 'ready'}`}
          title="Click to re-sync with Leads Phone Book backend API"
        >
          <span className="navbar-sync-dot" />
          <span className="navbar-sync-text">
            {isSyncing ? 'Syncing...' : isLiveBackend ? 'API Live' : 'Backend Ready'}
          </span>
          <RefreshCw
            size={12}
            className={`navbar-sync-icon ${isSyncing ? 'spinning' : ''}`}
          />
        </button>

        {/* Toggle Mobile Simulator (visible on md+) */}
        <button
          type="button"
          onClick={onToggleSimulator}
          className={`navbar-simulator-btn ${isSimulatorMode ? 'active' : ''}`}
          title="Toggle interactive mobile phone preview frame"
        >
          <Smartphone size={14} />
          <span>{isSimulatorMode ? 'Exit Frame' : 'Mobile Frame'}</span>
        </button>

        {/* Quick Add Contact Button (desktop only) */}
        <button
          type="button"
          onClick={onOpenAddContact}
          className="navbar-add-contact-btn"
          title="Add New Contact"
        >
          <Plus size={14} />
          <span>Contact</span>
        </button>

        {/* Register Business Button (desktop only) */}
        <button
          type="button"
          onClick={onOpenRegisterBusiness}
          className="navbar-register-biz-btn"
          title="Register Your Business"
        >
          <Building2 size={14} />
          <span>Register Business</span>
        </button>

        {/* Theme Toggle Button (Light / Dark) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="navbar-theme-btn"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={17} color="#F59E0B" /> : <Moon size={17} color="#1E60F2" />}
        </button>
      </div>
    </header>
  );
};
