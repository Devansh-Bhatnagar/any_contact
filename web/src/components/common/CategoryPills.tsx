import React from 'react';
import { useBusinesses } from '../../context/BusinessContext';
import { CATEGORIES } from '../../data/categories';
import {
  Grid,
  Utensils,
  Coffee,
  Hotel,
  HeartPulse,
  ShoppingBasket,
  ShoppingBag,
  Tv,
  Smartphone,
  Scissors,
  Dumbbell,
  Landmark,
  Home,
  Car,
  Wrench,
  GraduationCap,
  Plane,
  Briefcase,
  Sparkles,
  Store,
  MoreHorizontal,
} from 'lucide-react';

interface CategoryPillsProps {
  selectedCategory: string;
  onSelectCategory: (cat: string) => void;
  businessCounts?: Record<string, number>;
}

const iconMap: Record<string, React.ElementType> = {
  Grid,
  Utensils,
  Coffee,
  Hotel,
  HeartPulse,
  ShoppingBasket,
  ShoppingBag,
  Tv,
  Smartphone,
  Scissors,
  Dumbbell,
  Landmark,
  Home,
  Car,
  Wrench,
  GraduationCap,
  Plane,
  Briefcase,
  Sparkles,
  Store,
  MoreHorizontal,
};

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  selectedCategory,
  onSelectCategory,
  businessCounts = {},
}) => {
  const { categories } = useBusinesses();
  const displayCategories = categories && categories.length > 0 ? categories : CATEGORIES;

  return (
    <div
      className="category-pills-scroll"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '6px',
        scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      {displayCategories.map((cat) => {
        const isSelected = selectedCategory.toLowerCase() === cat.name.toLowerCase();
        const IconComponent = iconMap[cat.iconName] || Grid;
        const count = businessCounts[cat.name] || 0;

        return (
          <button
            key={cat.name}
            type="button"
            onClick={() => onSelectCategory(cat.name)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-full)',
              border: isSelected
                ? `1.5px solid ${cat.color}`
                : '1px solid var(--border)',
              backgroundColor: isSelected ? cat.color : 'var(--surface)',
              color: isSelected ? '#FFFFFF' : 'var(--text)',
              fontSize: '13px',
              fontWeight: isSelected ? 700 : 500,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: isSelected
                ? `0 4px 12px ${cat.color}40`
                : 'var(--shadow-sm)',
            }}
          >
            <IconComponent
              size={15}
              style={{
                color: isSelected ? '#FFFFFF' : cat.color,
                strokeWidth: 2.2,
              }}
            />
            <span>{cat.name}</span>
            {count > 0 && (
              <span
                style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'var(--surface-variant)',
                  color: isSelected ? '#FFFFFF' : 'var(--text-secondary)',
                  fontWeight: 600,
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
