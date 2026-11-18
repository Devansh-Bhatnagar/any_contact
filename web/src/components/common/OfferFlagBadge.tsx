import React from 'react';

interface OfferFlagBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  showText?: boolean;
}

export const OfferFlagBadge: React.FC<OfferFlagBadgeProps> = ({
  size = 'md',
  label = 'OFFER',
  className = '',
  showText = false,
}) => {
  const height = size === 'sm' ? 16 : size === 'lg' ? 28 : 22;

  return (
    <span
      className={`inline-flex items-center gap-1.5 select-none ${className}`}
      title="Exclusive Active Offer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'middle',
      }}
    >
      <img
        src="/offer-flag.png"
        alt="Offer Flag"
        className="offer-flag-img"
        style={{
          height: `${height}px`,
          width: 'auto',
          objectFit: 'contain',
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))',
        }}
      />
      {showText && (
        <span
          style={{
            fontSize: size === 'sm' ? '11px' : '12px',
            fontWeight: 700,
            color: '#059669',
            letterSpacing: '0.02em',
          }}
        >
          {label}
        </span>
      )}
    </span>
  );
};
