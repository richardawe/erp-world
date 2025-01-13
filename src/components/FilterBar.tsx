import React from 'react';
import { Search, Filter } from 'lucide-react';
import { ERPVendor, Category, FilterState } from '../types';

interface FilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

const vendors: (ERPVendor | 'All')[] = ['All', 'SAP', 'Oracle', 'Microsoft', 'Workday', 'Unit4', 'Infor', 'Other'];
const categories: (Category | 'All')[] = ['All', 'Product Launch', 'Security Update', 'Market Trend', 'Partnership', 'Acquisition', 'AI Innovation', 'General'];

export function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  return (
    <div className="bg-white shadow-sm border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search news..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-500" />
              <select
                value={filters.vendor}
                onChange={(e) => onFilterChange({ ...filters, vendor: e.target.value as ERPVendor | 'All' })}
                className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {vendors.map((vendor) => (
                  <option key={vendor} value={vendor}>
                    {vendor}
                  </option>
                ))}
              </select>
            </div>
            
            <select
              value={filters.category}
              onChange={(e) => onFilterChange({ ...filters, category: e.target.value as Category | 'All' })}
              className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}