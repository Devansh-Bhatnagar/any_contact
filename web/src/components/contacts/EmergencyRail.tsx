import React from 'react';
import { useContacts } from '../../context/ContactsContext';
import { Shield, Ambulance, Flame, HeartHandshake, AlertTriangle, PhoneCall, ShieldAlert } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Shield,
  Ambulance,
  Flame,
  HeartHandshake,
  AlertTriangle,
  ShieldAlert,
};

export const EmergencyRail: React.FC = () => {
  const { emergencyContacts } = useContacts();

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="emergency-rail-container" style={{ width: '100%', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#EF4444',
              boxShadow: '0 0 8px #EF4444',
            }}
          />
          <h3 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            Emergency Quick Dispatch (24x7)
          </h3>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
          Direct Access
        </span>
      </div>

      <div className="emergency-quick-grid">
        {emergencyContacts.map((item) => {
          const IconComp = iconMap[item.iconName] || Shield;
          return (
            <div
              key={item.id}
              onClick={() => handleCall(item.number)}
              className="emergency-quick-card hover:border-primary active:scale-[0.98]"
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: item.bgColor,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `0 2px 6px ${item.bgColor}35`,
                }}
              >
                <IconComp size={16} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 800,
                    color: item.bgColor,
                    fontFamily: 'monospace',
                    lineHeight: 1.2,
                  }}
                >
                  {item.number}
                </div>
              </div>

              <PhoneCall size={12} style={{ color: item.bgColor, flexShrink: 0 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
