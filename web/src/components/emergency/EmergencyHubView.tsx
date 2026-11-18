import React from 'react';
import {
  Shield,
  Ambulance,
  Flame,
  HeartHandshake,
  AlertTriangle,
  PhoneCall,
  ShieldAlert,
  Baby,
  Laptop,
  PhoneForwarded,
  MapPin,
  CheckCircle2,
  Phone,
  LifeBuoy,
} from 'lucide-react';

interface EmergencyItem {
  id: string;
  title: string;
  number: string;
  category: string;
  icon: React.ElementType;
  bgColor: string;
  badgeBg: string;
  description: string;
}

const ALL_EMERGENCY_SERVICES: EmergencyItem[] = [
  {
    id: 'em-police',
    title: 'Police Control Room',
    number: '100',
    category: 'Immediate Police Assistance & Crime Dispatch',
    icon: Shield,
    bgColor: '#1D4ED8',
    badgeBg: 'rgba(29, 78, 216, 0.1)',
    description: 'Direct PCR van dispatch & emergency law enforcement support',
  },
  {
    id: 'em-ambulance',
    title: 'Medical Ambulance (24x7)',
    number: '108',
    category: 'National Emergency Ambulance & Paramedic',
    icon: Ambulance,
    bgColor: '#DC2626',
    badgeBg: 'rgba(220, 38, 38, 0.1)',
    description: 'Rapid ambulance dispatch for trauma, cardiac & medical distress',
  },
  {
    id: 'em-fire',
    title: 'Fire Brigade & Rescue',
    number: '101',
    category: 'Fire Hazard & Disaster Rescue Services',
    icon: Flame,
    bgColor: '#EA580C',
    badgeBg: 'rgba(234, 88, 12, 0.1)',
    description: 'State fire stations emergency response and evacuation support',
  },
  {
    id: 'em-women',
    title: 'Women Helpline (24x7)',
    number: '1091',
    category: 'Dedicated Safety & Distress Assistance for Women',
    icon: HeartHandshake,
    bgColor: '#DB2777',
    badgeBg: 'rgba(219, 39, 119, 0.1)',
    description: 'Confidential legal, safety and rapid assistance for women',
  },
  {
    id: 'em-disaster',
    title: 'Disaster Management Helpline',
    number: '1070',
    category: 'NDRF & State Disaster Relief Control Room',
    icon: AlertTriangle,
    bgColor: '#059669',
    badgeBg: 'rgba(5, 150, 105, 0.1)',
    description: 'Flood, earthquake, cyclone and natural disaster evacuation relief',
  },
  {
    id: 'em-child',
    title: 'Childline Helpline',
    number: '1098',
    category: 'Protection & Care for Children in Distress',
    icon: Baby,
    bgColor: '#8B5CF6',
    badgeBg: 'rgba(139, 92, 246, 0.1)',
    description: 'Free national emergency assistance for missing or abused children',
  },
  {
    id: 'em-cyber',
    title: 'National Cyber Crime Helpline',
    number: '1930',
    category: 'Financial Cyber Fraud & Scam Prevention',
    icon: Laptop,
    bgColor: '#0284C7',
    badgeBg: 'rgba(2, 132, 199, 0.1)',
    description: 'Immediate freezing of fraudulent bank transactions & cybercrime aid',
  },
  {
    id: 'em-senior',
    title: 'Elder Line (Senior Citizens)',
    number: '14567',
    category: 'Welfare & Emergency Care for Seniors',
    icon: LifeBuoy,
    bgColor: '#4F46E5',
    badgeBg: 'rgba(79, 70, 229, 0.1)',
    description: 'National helpline for elderly abuse, emotional support and shelter',
  },
  {
    id: 'em-highway',
    title: 'National Highway Emergency',
    number: '1033',
    category: 'Accident & Medical Aid on Highways',
    icon: PhoneForwarded,
    bgColor: '#D97706',
    badgeBg: 'rgba(217, 119, 6, 0.1)',
    description: 'NHAI 24x7 highway patrol, towing and emergency medical help',
  },
];

export const EmergencyHubView: React.FC = () => {
  const handleCall = (num: string) => {
    window.location.href = `tel:${num}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
      {/* 1. UNIFIED NATIONAL 112 HERO BANNER */}
      <div
        style={{
          background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 60%, #991B1B 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 20px',
          color: '#FFFFFF',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 30px -4px rgba(220, 38, 38, 0.45)',
        }}
      >
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Beacon pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              marginBottom: '12px',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 0 10px #FFFFFF',
                animation: 'pulse 1.5s infinite',
              }}
            />
            <span style={{ fontSize: '11.5px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              All-In-One Unified Helpline
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ flex: 1, minWidth: '220px' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '6px', lineHeight: 1.25 }}>
                National Emergency Support: Dial 112
              </h1>
              <p style={{ fontSize: '13px', opacity: 0.92, lineHeight: 1.5, margin: 0 }}>
                India's single unified emergency number connecting Police, Fire, Ambulance & Women Safety instantly across all states.
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleCall('112')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FFFFFF',
                color: '#DC2626',
                border: 'none',
                borderRadius: 'var(--radius-full)',
                padding: '12px 24px',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
                transition: 'transform 0.15s ease',
                flexShrink: 0,
              }}
              className="hover:scale-105 active:scale-95"
            >
              <PhoneCall size={18} />
              <span>Call 112 Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. EMERGENCY DIRECTORY SECTION HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '0 4px',
        }}
      >
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
          <h2 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: 0 }}>
            Official Emergency Dispatch Lines (24x7)
          </h2>
        </div>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
          Toll-Free Direct Access
        </span>
      </div>

      {/* 3. RESPONSIVE EMERGENCY CARDS LIST / GRID */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '12px',
          width: '100%',
        }}
      >
        {ALL_EMERGENCY_SERVICES.map((item) => {
          const IconComp = item.icon;
          return (
            <div
              key={item.id}
              onClick={() => handleCall(item.number)}
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: 'var(--shadow-sm)',
                boxSizing: 'border-box',
                width: '100%',
                minWidth: 0,
              }}
              className="hover:border-primary hover:-translate-y-0.5 hover:shadow-md"
            >
              {/* Emergency Icon */}
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: item.bgColor,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: `0 4px 12px ${item.bgColor}40`,
                }}
              >
                <IconComp size={22} />
              </div>

              {/* Title & Micro Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <h3
                    style={{
                      fontSize: '14px',
                      fontWeight: 800,
                      color: 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      margin: 0,
                    }}
                  >
                    {item.title}
                  </h3>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: '4px' }}>
                  {item.category}
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '14px',
                    fontWeight: 800,
                    color: item.bgColor,
                    fontFamily: 'monospace',
                  }}
                >
                  <span>Dial {item.number}</span>
                </div>
              </div>

              {/* Quick Call Action Pill */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCall(item.number);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  backgroundColor: '#16A34A',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  flexShrink: 0,
                  boxShadow: '0 2px 8px rgba(22, 163, 74, 0.35)',
                }}
                className="hover:scale-105 active:scale-95"
                title={`Call ${item.title}`}
              >
                <Phone size={13} />
                <span>Call</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* 4. EMERGENCY PROTOCOLS & DISPATCH GUIDELINES (3 INFO CARDS) */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={18} style={{ color: '#EF4444' }} />
          <span>National Emergency Dispatch Guidelines</span>
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '12px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-variant)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <MapPin size={16} style={{ color: '#2563EB' }} />
              <strong style={{ fontSize: '13px', color: 'var(--text)' }}>1. State Exact Location First</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              Immediately mention your city, nearby prominent landmark or street name so dispatchers can route the nearest PCR or ambulance without delay.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface-variant)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <CheckCircle2 size={16} style={{ color: '#16A34A' }} />
              <strong style={{ fontSize: '13px', color: 'var(--text)' }}>2. Toll-Free & Zero Balance</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              All 112, 100, 108 & 101 numbers are 100% free of charge and can be dialed even when your SIM has no recharge or from lock screens.
            </p>
          </div>

          <div
            style={{
              backgroundColor: 'var(--surface-variant)',
              borderRadius: 'var(--radius-lg)',
              padding: '14px',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Shield size={16} style={{ color: '#8B5CF6' }} />
              <strong style={{ fontSize: '13px', color: 'var(--text)' }}>3. Official Control Room Verified</strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
              All helplines on Leads Phone Book are direct state disaster management & central emergency control rooms verified regularly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
