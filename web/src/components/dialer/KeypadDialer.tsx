import React, { useState } from 'react';
import { Phone, Delete, PhoneCall, Sparkles, User, Smartphone } from 'lucide-react';
import { useContacts } from '../../context/ContactsContext';

// DTMF tone frequencies for authentic phone audio
const DTMF_FREQS: Record<string, [number, number]> = {
  '1': [697, 1209], '2': [697, 1336], '3': [697, 1477],
  '4': [770, 1209], '5': [770, 1336], '6': [770, 1477],
  '7': [852, 1209], '8': [852, 1336], '9': [852, 1477],
  '*': [941, 1209], '0': [941, 1336], '#': [941, 1477],
};

export const KeypadDialer: React.FC = () => {
  const [number, setNumber] = useState('');
  const { contacts, logCall } = useContacts();

  const playTone = (digit: string) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const freqs = DTMF_FREQS[digit] || [800, 1200];

      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = freqs[0];
      osc2.frequency.value = freqs[1];

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.15);
      osc2.stop(ctx.currentTime + 0.15);
    } catch {
      // AudioContext not allowed or unsupported
    }
  };

  const handleDigit = (digit: string) => {
    playTone(digit);
    setNumber((prev) => prev + digit);
  };

  const handleBackspace = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  const handleCall = () => {
    if (!number.trim()) return;
    const cleanNum = number.replace(/[^0-9]/g, '');
    const matched = contacts.find((c) =>
      c.primaryPhone.replace(/[^0-9]/g, '').includes(cleanNum)
    );
    logCall({
      name: matched ? matched.name : `Direct Call: ${number.trim()}`,
      number: number.trim(),
      tag: matched ? 'Client' : 'Outgoing',
    });
    window.location.href = `tel:${number.trim()}`;
  };

  const handleSpeedDial = (phoneNum: string, name: string) => {
    setNumber(phoneNum);
    playTone('1');
  };

  const keys = [
    { digit: '1', sub: ' ' },
    { digit: '2', sub: 'ABC' },
    { digit: '3', sub: 'DEF' },
    { digit: '4', sub: 'GHI' },
    { digit: '5', sub: 'JKL' },
    { digit: '6', sub: 'MNO' },
    { digit: '7', sub: 'PQRS' },
    { digit: '8', sub: 'TUV' },
    { digit: '9', sub: 'WXYZ' },
    { digit: '*', sub: ' ' },
    { digit: '0', sub: '+' },
    { digit: '#', sub: ' ' },
  ];

  const matchedContact = number.length >= 3
    ? contacts.find((c) => c.primaryPhone.replace(/[^0-9]/g, '').includes(number.replace(/[^0-9]/g, '')))
    : null;

  return (
    <div className="dialer-page-wrapper">
      {/* Dialer Main Column */}
      <div className="keypad-container">
        {/* Brand Carrier Indicator */}
        <div className="keypad-carrier-tag">
          Connecting via Leads Phone Book
        </div>

        {/* Number Display */}
        <div className="keypad-display-wrap">
          <input
            type="text"
            value={number}
            onChange={(e) => setNumber(e.target.value)}
            placeholder="Enter number..."
            className="keypad-number-display"
          />

          {matchedContact && (
            <div className="keypad-matched-contact">
              👤 {matchedContact.name} ({matchedContact.category || 'Contact'})
            </div>
          )}
        </div>

        {/* Keypad Grid (3x4) */}
        <div className="keypad-grid">
          {keys.map((k) => (
            <button
              key={k.digit}
              type="button"
              onClick={() => handleDigit(k.digit)}
              className="keypad-btn hover:border-primary active:scale-90"
            >
              <span className="keypad-digit">{k.digit}</span>
              <span className="keypad-sub">{k.sub}</span>
            </button>
          ))}
        </div>

        {/* Bottom Actions Row: Spacer / Call Button / Backspace */}
        <div className="keypad-actions-row">
          <div style={{ width: '48px' }} />

          {/* Green Dial Button */}
          <button
            type="button"
            onClick={handleCall}
            disabled={!number.trim()}
            className={`keypad-call-btn ${number.trim() ? 'active hover:scale-105 active:scale-95' : 'disabled'}`}
            title="Start Call"
          >
            <PhoneCall size={24} />
          </button>

          {/* Backspace Button */}
          <div style={{ width: '48px', display: 'flex', justifyContent: 'center' }}>
            {number ? (
              <button
                type="button"
                onClick={handleBackspace}
                className="keypad-backspace-btn"
                title="Delete"
              >
                <Delete size={20} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Speed Dial / Recent Directory Side Panel (Shown on Desktop & Tablet >=840px) */}
      <div className="dialer-side-directory">
        <div className="dialer-side-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} style={{ color: 'var(--primary)' }} />
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
              Speed Dial & Directory
            </h3>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
            {contacts.length} Contacts
          </span>
        </div>

        <div className="dialer-side-list">
          {contacts.slice(0, 8).map((c) => (
            <div
              key={c.id}
              onClick={() => handleSpeedDial(c.primaryPhone, c.name)}
              className="dialer-speed-item hover:border-primary hover:bg-primary-light"
            >
              <img
                src={c.avatar}
                alt={c.name}
                className="dialer-speed-avatar"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80';
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {c.name}
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Smartphone size={11} />
                  <span>{c.primaryPhone}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  window.location.href = `tel:${c.primaryPhone}`;
                }}
                className="dialer-speed-call-btn"
                title={`Call ${c.name}`}
              >
                <Phone size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
