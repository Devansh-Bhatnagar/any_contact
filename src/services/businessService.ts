import { SAMPLE_BUSINESSES } from '../data/businesses';
import { Business, BusinessCategory, BusinessSection } from '../types/business';

export interface BusinessFilterOptions {
  query?: string;
  category?: BusinessCategory;
  onlyBesties?: boolean;
}

export class BusinessService {
  /**
   * Fetches the business directory data.
   * Can be easily switched from local data to a REST API (Node/Postgres) in the future.
   */
  static async getBusinesses(): Promise<Business[]> {
    // Simulated network latency for smooth, realistic loading
    await new Promise<void>((resolve) => setTimeout(() => resolve(), 80));
    return [...SAMPLE_BUSINESSES];
  }

  /**
   * Filter and search businesses by text and category
   */
  static filterBusinesses(
    businesses: Business[],
    options: BusinessFilterOptions
  ): Business[] {
    const { query = '', category = 'All', onlyBesties = false } = options;
    const cleanQuery = query.trim().toLowerCase();

    return businesses.filter((b) => {
      // Bestie filter
      if (onlyBesties && !b.isBestie) {
        return false;
      }

      // Category filter
      if (category !== 'All' && b.category !== category) {
        return false;
      }

      // Search query filter (matches name, category, city, address, phone)
      if (cleanQuery.length > 0) {
        const matchesName = b.name.toLowerCase().includes(cleanQuery);
        const matchesCategory = b.category.toLowerCase().includes(cleanQuery);
        const matchesCity = b.city.toLowerCase().includes(cleanQuery);
        const matchesAddress = b.address.toLowerCase().includes(cleanQuery);
        const matchesPhone = b.phone.toLowerCase().includes(cleanQuery);
        const matchesDesc = b.description.toLowerCase().includes(cleanQuery);

        return (
          matchesName ||
          matchesCategory ||
          matchesCity ||
          matchesAddress ||
          matchesPhone ||
          matchesDesc
        );
      }

      return true;
    });
  }

  /**
   * Sorts businesses alphabetically by name
   */
  static sortAlphabetically(businesses: Business[]): Business[] {
    return [...businesses].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
    );
  }

  /**
   * Groups businesses into A-Z sections for SectionList
   */
  static groupIntoSections(businesses: Business[]): BusinessSection[] {
    const sorted = this.sortAlphabetically(businesses);
    const groups: Record<string, Business[]> = {};

    sorted.forEach((item) => {
      const firstChar = item.name.trim().charAt(0).toUpperCase();
      const sectionKey = /^[A-Z]$/.test(firstChar) ? firstChar : '#';

      if (!groups[sectionKey]) {
        groups[sectionKey] = [];
      }
      groups[sectionKey].push(item);
    });

    // Create sorted sections (A-Z, with '#' at end if present)
    const letters = Object.keys(groups).sort((a, b) => {
      if (a === '#') return 1;
      if (b === '#') return -1;
      return a.localeCompare(b);
    });

    return letters.map((letter) => ({
      title: letter,
      data: groups[letter],
    }));
  }
}
