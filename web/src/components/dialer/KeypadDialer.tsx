import React, { useState } from 'react';
import { Phone, Delete, UserPlus, PhoneCall, History } from 'lucide-react';
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
    <div
      className="keypad-container"
      style={{
        maxWidth: '440px',
        width: '100%',
        margin: '0 auto',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-md)',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Brand Carrier Indicator */}
      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '8px', textAlign: 'center' }}>
        Connecting via Leads Phone Book
      </div>

      {/* Number Display */}
      <div style={{ minHeight: '56px', width: '100%', textAlign: 'center', marginBottom: '14px' }}>
        <input
          type="text"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="Enter number..."
          className="keypad-number-display"
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '28px',
            fontWeight: 800,
            textAlign: 'center',
            color: 'var(--text)',
            letterSpacing: '0.06em',
            fontFamily: 'JetBrains Mono, monospace',
          }}
        />

        {matchedContact && (
          <div style={{ fontSize: '12.5px', color: 'var(--primary)', fontWeight: 700, marginTop: '2px' }}>
            👤 {matchedContact.name} ({matchedContact.category || 'Contact'})
          </div>
        )}
      </div>

      {/* Keypad Grid (3x4) */}
      <div
        className="keypad-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          width: '100%',
          maxWidth: '320px',
          marginBottom: '20px',
        }}
      >
        {keys.map((k) => (
          <button
            key={k.digit}
            type="button"
            onClick={() => handleDigit(k.digit)}
            className="keypad-btn hover:border-primary active:scale-90 active:bg-primary active:text-white"
            style={{
              aspectRatio: '1',
              width: '70px',
              height: '70px',
              margin: '0 auto',
              borderRadius: '50%',
              backgroundColor: 'var(--surface-variant)',
              border: '1px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.1s ease',
              userSelect: 'none',
            }}
          >
            <span style={{ fontSize: '22px', fontWeight: 700, lineHeight: 1, color: 'var(--text)' }}>
              {k.digit}
            </span>
            <span style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-tertiary)', marginTop: '2px' }}>
              {k.sub}
            </span>
          </button>
        ))}
      </div>

      {/* Bottom Actions Row: Spacer / Call Button / Backspace */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          width: '100%',
          maxWidth: '320px',
        }}
      >
        <div style={{ width: '48px' }} />

        {/* Green Dial Button */}
        <button
          type="button"
          onClick={handleCall}
          disabled={!number.trim()}
          className={`keypad-call-btn ${number.trim() ? 'hover:scale-105 active:scale-95' : ''}`}
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: number.trim() ? '#16A34A' : 'var(--surface-variant)',
            color: number.trim() ? '#FFFFFF' : 'var(--text-tertiary)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: number.trim() ? 'pointer' : 'default',
            boxShadow: number.trim() ? '0 6px 20px rgba(22, 163, 74, 0.4)' : 'none',
            transition: 'all 0.2s ease',
          }}
          title="Start Call"
        >
          <PhoneCall size={26} />
        </button>

        {/* Backspace Button */}
        <div style={{ width: '48px', display: 'flex', justifyContent: 'center' }}>
          {number ? (
            <button
              type="button"
              onClick={handleBackspace}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              title="Delete"
            >
              <Delete size={22} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
