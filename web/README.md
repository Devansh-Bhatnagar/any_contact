# Leads Phone Book - Web Application 🌐

A modern, responsive React + TypeScript web application for **Leads Phone Book** (Smart Calling & Business Directory with Live Offers).

Built to seamlessly mirror and complement the mobile application with senior-level UI/UX, responsive layouts, and interactive features.

---

## 🚀 Quick Start

From this `web/` directory:

```bash
# Install dependencies (already installed)
npm install

# Start Vite development server
npm run dev
# The app opens instantly at http://localhost:3000

# Production build
npm run build
```

Or from the project root:
```bash
npm run dev --prefix web
```

---

## ✨ Features & Architecture

### 1. 👥 Contacts PhoneBook
- Alphabetical grouping and instant multi-field search (Name, Phone number, Email, Category tags).
- Category filters: All, ⭐ Favorites, 🟢 App Connected, 💼 Business Contacts.
- Direct calling (`tel:`), WhatsApp click-to-chat (`https://wa.me/`), copy to clipboard.
- Contact Details modal with multiple phone numbers (Mobile, Work, Home), notes, star favorite toggle, block/unblock, and delete.
- Add New Contact modal with instant validation.

### 2. 🏢 Business Leads Directory
- 20+ Categories with color-coded pills: Restaurants, Cafes, Hotels, Hospitals, Grocery, Electronics, Mobile Stores, Salons, Gyms, Real Estate, Automobile, Mechanics, etc.
- **Offer Flag Badge**: Displays the custom wavy `% OFFER` flag on businesses with active promotional deals.
- Filter toggles: **Only Active Offers** and **Verified Only**.
- Rich Business Details Sheet with ratings & reviews, opening hours, address, Google Maps directions, website link, email, social profiles, and WhatsApp messaging with prefilled template.

### 3. 🏷️ Exclusive Offers Hub
- Dedicated promo deals hub aggregating all active discount campaigns across businesses.
- Filter by deal type: "Buy 1 Get 1 Free (BOGO)", "Flat Discounts & % Off", "Festival & Special Offers", "Free Delivery & Consultations".
- Each deal is color-coded using the palette system from the mobile app (Ruby Red, Vivid Orange, Emerald Green, Royal Violet, Amber Gold).
- One-click "Claim on WhatsApp" and "Call Business" buttons.

### 4. 📝 Register Business Modal
- Full onboarding form mirroring the mobile registration experience:
  - Company name, Category selector, Phone, Email, Owner name, City, Address, Hours, Website, Description.
  - Quick Preset Offers suggestions ("Buy 1 Get 1 Free", "Christmas offer flat 80% off", "Flat 50% Off", etc.) with checkmark selection and clean chips.
  - Custom offer input field with instant tag generation.
  - Form validation and persistent local storage.

### 5. ⌨️ Interactive Keypad Dialer
- Live digit input with formatting and matched contact preview.
- Realistic DTMF touch-tones using the Web Audio API.
- Direct call trigger and backspace deletion.

### 6. 🚨 Emergency 24x7 Quick Dispatch
- One-click access to Police (100), Ambulance (108), Fire (101), Women Helpline (1091), and Disaster Relief (1070).

### 7. 📱 Mobile App Simulator Mode
- Toggle between full **Responsive Desktop Dashboard** and an **Interactive Mobile Frame (iPhone 16 Pro mockup)** with dynamic island, status bar, and fixed bottom tab navigation mirroring the exact React Native app experience.

### 8. 🎨 Design System & Theming
- Native Dark / Light mode toggle with persistent state.
- Custom typography using Google Font *Plus Jakarta Sans*.
- Brand identity using the newly created 3D globe & phonebook app icon.

---

## 📂 Project Structure

```
web/
├── public/
│   ├── app-icon.png         # 3D Globe & Phone Book App Icon
│   └── offer-flag.png       # Wavy % OFFER Flag Asset
├── src/
│   ├── assets/              # App images
│   ├── components/
│   │   ├── business/        # Business cards & modals
│   │   ├── common/          # Search bar, category pills, offer badge
│   │   ├── contacts/        # Contact cards, details & emergency rail
│   │   ├── dialer/          # Web Audio DTMF Keypad dialer
│   │   ├── layout/          # Sidebar, Navbar, MobileBottomNav
│   │   ├── offers/          # OffersHub promotional view
│   │   └── preview/         # Mobile phone mockup simulator
│   ├── constants/           # Offer color palettes & categories
│   ├── context/             # Theme, Contacts & Business contexts
│   ├── data/                # Mock businesses, contacts & emergency data
│   ├── types/               # TypeScript interfaces
│   ├── App.tsx              # Main application root
│   ├── main.tsx             # DOM mount entry
│   └── index.css            # Design system, themes & animations
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```
