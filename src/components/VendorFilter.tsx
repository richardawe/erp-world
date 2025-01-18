import { getVendorColor, getVendorIcon, getVendorLogo } from '../utils/vendor';
import type { NewsSource } from '../types';

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
  'Infor',
  'Forterro'
];

const techSources: NewsSource[] = [
  'TechCrunch',
  'VentureBeat'
];

export const VendorFilter: React.FC<VendorFilterProps> = ({
  selectedVendor,
  onVendorSelect,
}) => {
  return (
    <div className="space-y-6">
      {/* All Sources Button */}
      <button
        onClick={() => onVendorSelect('All')}
        className={`
          w-full px-4 py-2 rounded-lg text-sm font-medium 
          transition-colors flex items-center gap-2
          ${selectedVendor === 'All'
            ? 'bg-white text-blue-600'
            : 'text-white/80 hover:text-white hover:bg-white/10'
          }
        `}
      >
        <span className="truncate">All Sources</span>
      </button>

      {/* ERP Vendors */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-white/60 px-4">
          ERP Vendors
        </h3>
        <div className="space-y-1">
          {erpVendors.map((vendor) => {
            const Icon = getVendorIcon(vendor);
            const logo = getVendorLogo(vendor);
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
                {logo ? (
                  <img src={logo} alt={vendor} className="w-4 h-4 object-contain" />
                ) : Icon ? (
                  <Icon className="w-4 h-4" />
                ) : null}
                <span className="truncate">{vendor}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tech News Sources */}
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-white/60 px-4">
          Tech News
        </h3>
        <div className="space-y-1">
          {techSources.map((source) => {
            const Icon = getVendorIcon(source);
            return (
              <button
                key={source}
                onClick={() => onVendorSelect(source)}
                className={`
                  w-full px-4 py-2 rounded-lg text-sm font-medium 
                  transition-colors flex items-center gap-2
                  ${selectedVendor === source
                    ? 'bg-white text-blue-600'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="truncate">{source}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 