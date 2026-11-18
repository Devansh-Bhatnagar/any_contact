import React from 'react';
import { Wifi, Battery, Signal, ArrowLeft } from 'lucide-react';

interface MobileSimulatorFrameProps {
  children: React.ReactNode;
  onExit: () => void;
}

export const MobileSimulatorFrame: React.FC<MobileSimulatorFrameProps> = ({
  children,
  onExit,
}) => {
  const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        minHeight: 'calc(100vh - 70px)',
      }}
    >
      {/* Top Banner Notice */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
          padding: '8px 16px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <button
          type="button"
          onClick={onExit}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: 'none',
            color: 'var(--primary)',
            fontSize: '12.5px',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={14} /> Back to Full Web App
        </button>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>•</span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>
          Interactive Mobile Shell Preview (iPhone 16 Pro mockup)
        </span>
      </div>

      {/* iPhone Frame Shell */}
      <div
        style={{
          width: '390px',
          height: '810px',
          backgroundColor: '#000000',
          borderRadius: '52px',
          padding: '12px',
          boxShadow: '0 25px 60px -15px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Inner Screen */}
        <div
          style={{
            flex: 1,
            backgroundColor: 'var(--background)',
            borderRadius: '42px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          {/* iOS Dynamic Island & Status Bar */}
          <div
            style={{
              height: '44px',
              backgroundColor: 'var(--surface)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 24px',
              fontSize: '12px',
              fontWeight: 700,
              color: 'var(--text)',
              position: 'relative',
              flexShrink: 0,
              zIndex: 30,
            }}
          >
            <span>{currentTime}</span>

            {/* Dynamic Island pill */}
            <div
              style={{
                position: 'absolute',
                top: '9px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '108px',
                height: '24px',
                backgroundColor: '#000000',
                borderRadius: '16px',
              }}
            />

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Signal size={13} />
              <Wifi size={13} />
              <Battery size={15} />
            </div>
          </div>

          {/* Interactive Screen Scroll Container */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              paddingBottom: '70px',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
