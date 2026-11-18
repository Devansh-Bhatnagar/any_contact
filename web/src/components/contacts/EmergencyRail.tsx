import React from 'react';
import { useContacts } from '../../context/ContactsContext';
import { Shield, Ambulance, Flame, HeartHandshake, AlertTriangle, PhoneCall, ShieldAlert, Baby, Laptop } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Shield,
  Ambulance,
  Flame,
  HeartHandshake,
  AlertTriangle,
  ShieldAlert,
  Baby,
  Laptop,
};

export const EmergencyRail: React.FC = () => {
  const { emergencyContacts } = useContacts();

  const handleCall = (number: string) => {
    window.location.href = `tel:${number}`;
  };

  return (
    <div className="emergency-rail-container">
      <div className="emergency-rail-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span className="emergency-live-dot" />
          <h3 className="emergency-rail-title">
            Emergency Dispatch (24x7)
          </h3>
        </div>
        <span className="emergency-rail-sub">
          Toll-Free Access
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
                className="emergency-quick-icon-wrap"
                style={{
                  backgroundColor: item.bgColor,
                  boxShadow: `0 2px 6px ${item.bgColor}35`,
                }}
              >
                <IconComp size={15} />
              </div>

              <div className="emergency-quick-info">
                <div className="emergency-quick-title">
                  {item.title}
                </div>
                <div
                  className="emergency-quick-number"
                  style={{ color: item.bgColor }}
                >
                  {item.number}
                </div>
              </div>

              <PhoneCall size={12} style={{ color: item.bgColor, flexShrink: 0, opacity: 0.8 }} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
