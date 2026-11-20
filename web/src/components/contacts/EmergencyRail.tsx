import React from 'react';
import { useContacts } from '../../context/ContactsContext';
import { Shield, Ambulance, Flame, HeartHandshake, AlertTriangle, ShieldAlert, Baby, Laptop } from 'lucide-react';

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

  return (
    <div className="emergency-rail-container">
      <div className="emergency-rail-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <span className="emergency-live-dot" />
          <h3 className="emergency-rail-title">
            National Helplines (24x7)
          </h3>
        </div>
        <span className="emergency-rail-sub">
          Official Toll-Free
        </span>
      </div>

      <div className="emergency-quick-grid">
        {emergencyContacts.map((item) => {
          const IconComp = iconMap[item.iconName] || Shield;
          return (
            <div
              key={item.id}
              className="emergency-quick-card"
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
            </div>
          );
        })}
      </div>
    </div>
  );
};
