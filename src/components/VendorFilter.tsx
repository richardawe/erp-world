import { useState, useEffect } from 'react';
import type { NewsSource } from '../types';
import { getVendorIcon } from '../utils/vendor';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface VendorFilterProps {
  selectedVendor: NewsSource | 'All';
  onVendorSelect: (vendor: NewsSource | 'All') => void;
}

interface Source {
  vendor: string;
  type: 'rss' | 'html';
  active: boolean;
}

export function VendorFilter({ selectedVendor, onVendorSelect }: VendorFilterProps) {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSources() {
      try {
        const { data, error } = await supabase
          .from('sources')
          .select('vendor, type, active')
          .eq('active', true)
          .order('vendor');

        if (error) throw error;
        setSources(data || []);
      } catch (error) {
        console.error('Error fetching sources:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchSources();
  }, []);

  // Group sources by type
  const erpVendors = sources
    .filter(source => !['TechCrunch', 'VentureBeat', 'ZDNet', 'ComputerWeekly', 'InformationWeek']
    .includes(source.vendor))
    .map(source => source.vendor);

  const techSources = sources
    .filter(source => ['TechCrunch', 'VentureBeat', 'ZDNet', 'ComputerWeekly', 'InformationWeek']
    .includes(source.vendor))
    .map(source => source.vendor);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-white/10 rounded-lg"></div>
        <div className="space-y-2">
          <div className="h-4 w-24 bg-white/10 rounded"></div>
          <div className="space-y-1">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-white/10 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* All Sources Button */}
      <button
        onClick={() => onVendorSelect('All')}
        className={`
          w-full px-4 py-2 rounded-lg transition-colors flex items-center gap-2
          ${selectedVendor === 'All' 
            ? 'bg-white text-blue-600' 
            : 'text-white/80 hover:text-white hover:bg-white/10'
          }
        `}
      >
        <img
          src="/vendor-logos/all.svg"
          alt="All vendors"
          className="w-4 h-4 object-contain opacity-50"
        />
        <span className="text-sm font-medium">All Sources</span>
      </button>

      {/* ERP Vendors */}
      {erpVendors.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider px-4">
            ERP Vendors
          </h3>
          <div className="space-y-1">
            {erpVendors.map((vendor) => {
              const isSelected = vendor === selectedVendor;
              const Icon = getVendorIcon(vendor as NewsSource);
              
              return (
                <button
                  key={vendor}
                  onClick={() => onVendorSelect(vendor as NewsSource)}
                  className={`
                    w-full px-4 py-2 rounded-lg transition-colors flex items-center gap-2
                    ${isSelected 
                      ? 'bg-white text-blue-600' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{vendor}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Tech News Sources */}
      {techSources.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider px-4">
            Technology News
          </h3>
          <div className="space-y-1">
            {techSources.map((vendor) => {
              const isSelected = vendor === selectedVendor;
              const Icon = getVendorIcon(vendor as NewsSource);
              
              return (
                <button
                  key={vendor}
                  onClick={() => onVendorSelect(vendor as NewsSource)}
                  className={`
                    w-full px-4 py-2 rounded-lg transition-colors flex items-center gap-2
                    ${isSelected 
                      ? 'bg-white text-blue-600' 
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{vendor}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
} 