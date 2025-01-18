import { getVendorColor, getVendorIcon } from '../utils/vendor';
import type { NewsSource } from '../types';

interface VendorFilterProps {
  selectedVendor: NewsSource | 'All';
  onVendorSelect: (vendor: NewsSource | 'All') => void;
}

const vendors: (NewsSource | 'All')[] = [
  'All',
  'SAP',
  'Oracle',
  'Microsoft',
  'Workday',
  'Unit4',
  'Infor',
  'Forterro'
];

export const VendorFilter: React.FC<VendorFilterProps> = ({
  selectedVendor,
  onVendorSelect,
}) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-white/60 px-4">
        Vendors
      </h3>
      <div className="space-y-1">
        {vendors.map((vendor) => {
          const Icon = vendor === 'All' ? undefined : getVendorIcon(vendor);
          return (
            <button
              key={vendor}
              onClick={() => onVendorSelect(vendor)}
              className={`
                w-full px-4 py-2 rounded-lg text-sm font-medium 
                transition-colors flex items-center gap-2
                ${selectedVendor === vendor
                  ? 'bg-white text-blue-600'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
                }
              `}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {vendor}
            </button>
          );
        })}
      </div>
    </div>
  );
}; 