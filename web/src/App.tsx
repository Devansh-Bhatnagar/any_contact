import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { ContactsProvider, useContacts } from './context/ContactsContext';
import { BusinessProvider, useBusinesses } from './context/BusinessContext';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { MobileSimulatorFrame } from './components/preview/MobileSimulatorFrame';
import { CategoryPills } from './components/common/CategoryPills';
import { ContactCard } from './components/contacts/ContactCard';
import { ContactDetailModal } from './components/contacts/ContactDetailModal';
import { AddContactModal } from './components/contacts/AddContactModal';
import { EmergencyRail } from './components/contacts/EmergencyRail';
import { BusinessCard } from './components/business/BusinessCard';
import { BusinessDetailModal } from './components/business/BusinessDetailModal';
import { RegisterBusinessModal } from './components/business/RegisterBusinessModal';
import { OffersHubView } from './components/offers/OffersHubView';
import { KeypadDialer } from './components/dialer/KeypadDialer';
import { EmergencyHubView } from './components/emergency/EmergencyHubView';
import { OfferFlagBadge } from './components/common/OfferFlagBadge';
import { SearchBar } from './components/common/SearchBar';
import { Contact } from './types/contact';
import { Business } from './types/business';
import {
  Users,
  Building2,
  Sparkles,
  Filter,
  CheckCircle2,
  Plus,
  PhoneCall,
  Tag,
  Star,
  MapPin,
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('contacts');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSimulatorMode, setIsSimulatorMode] = useState(false);

  // Modals state
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isRegisterBusinessOpen, setIsRegisterBusinessOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Contexts
  const {
    filteredContacts,
    activeFilter,
    setActiveFilter,
    toggleFavorite,
    deleteContact,
    toggleBlock,
  } = useContacts();

  const {
    filteredBusinesses,
    selectedCategory,
    setSelectedCategory,
    onlyOffers,
    setOnlyOffers,
    onlyVerified,
    setOnlyVerified,
    deleteBusiness,
    offersCount,
    businesses,
  } = useBusinesses();

  // Category counts
  const categoryCounts: Record<string, number> = {};
  businesses.forEach((b) => {
    categoryCounts[b.category] = (categoryCounts[b.category] || 0) + 1;
  });
  categoryCounts['All'] = businesses.length;

  const renderContent = () => {
    switch (activeTab) {
      case 'contacts':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Mobile Search Bar (Only visible on <640px) */}
            <div className="mobile-search-bar-wrap">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search contacts by name, mobile, email..."
              />
            </div>

            {/* Emergency Rail Quick Access */}
            <EmergencyRail />

            {/* Filter Pills & Stats Row */}
            <div
              className="contacts-filter-bar"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div className="filter-pills-row">
                {[
                  { id: 'all', label: `All (${filteredContacts.length})` },
                  { id: 'favorites', label: '⭐ Favorites' },
                  { id: 'hasApp', label: '🟢 Connected' },
                  { id: 'business', label: '💼 Business' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveFilter(f.id as any)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: activeFilter === f.id ? '1.5px solid var(--primary)' : '1px solid var(--border)',
                      backgroundColor: activeFilter === f.id ? 'var(--primary-light)' : 'var(--surface)',
                      color: activeFilter === f.id ? 'var(--primary)' : 'var(--text-secondary)',
                      fontSize: '11.5px',
                      fontWeight: activeFilter === f.id ? 800 : 600,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsAddContactOpen(true)}
                className="contacts-add-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: 'var(--primary)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '7px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-glow)',
                  whiteSpace: 'nowrap',
                }}
              >
                <Plus size={14} /> Add Contact
              </button>
            </div>

            {/* Contacts Grid */}
            {filteredContacts.length > 0 ? (
              <div className="responsive-contacts-grid">
                {filteredContacts.map((contact) => (
                  <ContactCard
                    key={contact.id}
                    contact={contact}
                    onSelect={setSelectedContact}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px dashed var(--border)',
                }}
              >
                <Users size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                  No contacts found
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Try adjusting your search or add a new contact to your directory.
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddContactOpen(true)}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '9px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Add Contact Now
                </button>
              </div>
            )}
          </div>
        );

      case 'businesses':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Mobile Search Bar (Only visible on <640px) */}
            <div className="mobile-search-bar-wrap">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search businesses, categories, cities..."
              />
            </div>

            {/* Category Pills Scroller */}
            <CategoryPills
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              businessCounts={categoryCounts}
            />

            {/* Filter Controls Row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '10px',
                backgroundColor: 'var(--surface)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {/* Active Deals Toggle with Wavy Flag */}
                <button
                  type="button"
                  onClick={() => setOnlyOffers(!onlyOffers)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: onlyOffers ? '1.5px solid #059669' : '1px solid var(--border)',
                    backgroundColor: onlyOffers ? 'rgba(16, 185, 129, 0.15)' : 'var(--surface-variant)',
                    color: onlyOffers ? '#047857' : 'var(--text-secondary)',
                    fontWeight: onlyOffers ? 800 : 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <OfferFlagBadge size="sm" />
                  <span>Deals ({offersCount})</span>
                </button>

                {/* Verified Filter */}
                <button
                  type="button"
                  onClick={() => setOnlyVerified(!onlyVerified)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: 'var(--radius-full)',
                    border: onlyVerified ? '1.5px solid #2563EB' : '1px solid var(--border)',
                    backgroundColor: onlyVerified ? 'rgba(37, 99, 235, 0.12)' : 'var(--surface-variant)',
                    color: onlyVerified ? '#1D4ED8' : 'var(--text-secondary)',
                    fontWeight: onlyVerified ? 800 : 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <CheckCircle2 size={13} />
                  <span>Verified Only</span>
                </button>
              </div>

              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                <strong style={{ color: 'var(--text)' }}>{filteredBusinesses.length}</strong> businesses
              </div>
            </div>

            {/* Businesses Grid */}
            {filteredBusinesses.length > 0 ? (
              <div className="responsive-business-grid">
                {filteredBusinesses.map((b) => (
                  <BusinessCard
                    key={b.id}
                    business={b}
                    onSelect={setSelectedBusiness}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  textAlign: 'center',
                  padding: '60px 20px',
                  backgroundColor: 'var(--surface)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px dashed var(--border)',
                }}
              >
                <Building2 size={48} style={{ color: 'var(--text-tertiary)', margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
                  No businesses match your filter
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Try selecting "All" categories or reset the filter toggles.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('All');
                    setOnlyOffers(false);
                    setOnlyVerified(false);
                  }}
                  style={{
                    backgroundColor: 'var(--primary)',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: 'var(--radius-md)',
                    padding: '9px 18px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Reset Filters
                </button>
              </div>
            )}
          </div>
        );

      case 'offers':
        return <OffersHubView onSelectBusiness={setSelectedBusiness} />;

      case 'dialer':
        return <KeypadDialer />;

      case 'emergency':
        return <EmergencyHubView />;

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--background)', width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '24px',
            backgroundColor: '#16A34A',
            color: '#FFFFFF',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 10px 25px rgba(22, 163, 74, 0.4)',
            zIndex: 11000,
            fontSize: '14px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'fadeIn 0.25s ease-out',
          }}
        >
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isSimulatorMode && (
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenRegisterBusiness={() => setIsRegisterBusinessOpen(true)}
          onOpenAddContact={() => setIsAddContactOpen(true)}
          isSimulatorMode={isSimulatorMode}
          onToggleSimulator={() => setIsSimulatorMode(!isSimulatorMode)}
        />
      )}

      {/* Main Container */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, width: '100%', maxWidth: '100%', overflowX: 'hidden' }}>
        <Navbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenRegisterBusiness={() => setIsRegisterBusinessOpen(true)}
          onOpenAddContact={() => setIsAddContactOpen(true)}
          isSimulatorMode={isSimulatorMode}
          onToggleSimulator={() => setIsSimulatorMode(!isSimulatorMode)}
        />

        <main
          className={isSimulatorMode ? '' : 'app-main-content'}
          style={isSimulatorMode ? { flex: 1, padding: 0 } : undefined}
        >
          {isSimulatorMode ? (
            <MobileSimulatorFrame onExit={() => setIsSimulatorMode(false)}>
              <div style={{ padding: '16px' }}>
                {renderContent()}
              </div>
            </MobileSimulatorFrame>
          ) : (
            <div style={{ maxWidth: '1380px', margin: '0 auto' }}>
              {renderContent()}
            </div>
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          onOpenRegisterBusiness={() => setIsRegisterBusinessOpen(true)}
        />
      </div>

      {/* Modals */}
      <ContactDetailModal
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onToggleFavorite={toggleFavorite}
        onDelete={(id) => {
          deleteContact(id);
          showToast('Contact deleted');
        }}
        onToggleBlock={(id) => {
          toggleBlock(id);
          showToast('Contact updated');
        }}
      />

      <AddContactModal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        onSuccess={(name) => showToast(`Contact "${name}" added successfully!`)}
      />

      <BusinessDetailModal
        business={selectedBusiness}
        onClose={() => setSelectedBusiness(null)}
        onDelete={(id) => {
          deleteBusiness(id);
          showToast('Business deleted');
        }}
      />

      <RegisterBusinessModal
        isOpen={isRegisterBusinessOpen}
        onClose={() => setIsRegisterBusinessOpen(false)}
        onSuccess={(name) => showToast(`Business "${name}" registered successfully!`)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ContactsProvider>
        <BusinessProvider>
          <MainAppContent />
        </BusinessProvider>
      </ContactsProvider>
    </ThemeProvider>
  );
};

export default App;
