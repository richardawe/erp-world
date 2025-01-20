import type { NewsSource } from '../types';
import { getVendorIcon } from '../utils/vendor';

interface VendorFilterProps {
  selectedVendor: NewsSource | 'All';
  onVendorSelect: (vendor: NewsSource | 'All') => void;
}

const erpVendors: NewsSource[] = [
  'SAP',
  'Oracle',
  'Microsoft',
  'Workday',
  'Unit4',
  'Infor'
];

const techSources: NewsSource[] = [
  'TechCrunch',
  'VentureBeat'
];

export function VendorFilter({ selectedVendor, onVendorSelect }: VendorFilterProps) {
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
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider px-4">
          ERP Vendors
        </h3>
        <div className="space-y-1">
          {erpVendors.map((vendor) => {
            const isSelected = vendor === selectedVendor;
            const Icon = getVendorIcon(vendor);
            
            return (
              <button
                key={vendor}
                onClick={() => onVendorSelect(vendor)}
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

      {/* Tech News Sources */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider px-4">
          Technology News
        </h3>
        <div className="space-y-1">
          {techSources.map((vendor) => {
            const isSelected = vendor === selectedVendor;
            const Icon = getVendorIcon(vendor);
            
            return (
              <button
                key={vendor}
                onClick={() => onVendorSelect(vendor)}
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
    </div>
  );
} 