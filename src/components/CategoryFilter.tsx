import type { Category } from '../types';

interface CategoryFilterProps {
  selectedCategory: Category | 'All';
  onCategorySelect: (category: Category | 'All') => void;
}

const categories: (Category | 'All')[] = [
  'All',
  'Product Launch',
  'Security Update',
  'Market Trend',
  'Partnership',
  'Acquisition',
  'AI Innovation',
  'General'
];

export function CategoryFilter({ selectedCategory, onCategorySelect }: CategoryFilterProps) {
  return (
    <select
      value={selectedCategory}
      onChange={(e) => onCategorySelect(e.target.value as Category | 'All')}
      className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-lg border border-white/20 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {categories.map((category) => (
        <option key={category} value={category}>
          {category === 'All' ? 'All Categories' : category}
        </option>
      ))}
    </select>
  );
} 