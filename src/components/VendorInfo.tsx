import { useState } from 'react';
import type { NewsSource } from '../types';
import { getVendorColor, getVendorIcon } from '../utils/vendor';
import { Building2, Link, Globe, Package, Grid, Users, ChevronDown } from 'lucide-react';

interface VendorInfoProps {
  vendor: NewsSource | 'All';
  compact?: boolean;
}

interface Product {
  name: string;
  url: string;
}

interface ERPVendorInfo {
  name: string;
  description: string;
  website: string;
  products: Product[];
  modules: string[];
  customers: string[];
}

interface NewsSourceInfo {
  name: string;
  description: string;
  website: string;
  topics: string[];
  coverage: string[];
}

type VendorInfo = ERPVendorInfo | NewsSourceInfo;

const newsSourceInfo: Record<NewsSource, VendorInfo> = {
  // ERP Vendors
  SAP: {
    name: 'SAP',
    description: 'Global leader in enterprise application software and software-related services.',
    website: 'https://www.sap.com',
    products: [
      { name: 'SAP S/4HANA', url: 'https://www.sap.com/products/erp/s4hana.html' },
      { name: 'SAP Business One', url: 'https://www.sap.com/products/erp/business-one.html' },
      { name: 'SAP Business ByDesign', url: 'https://www.sap.com/products/erp/business-bydesign.html' }
    ],
    modules: [
      'Finance', 'Sales', 'Manufacturing', 'Supply Chain', 'HR', 'Analytics', 'CRM', 'Project Management'
    ],
    customers: [
      'Coca-Cola', 'BMW', 'Siemens', 'Shell', 'Procter & Gamble', 'Nike'
    ]
  },
  Oracle: {
    name: 'Oracle Corporation',
    description: 'Provider of enterprise software and cloud computing solutions.',
    website: 'https://www.oracle.com',
    products: [
      { name: 'Oracle Cloud ERP', url: 'https://www.oracle.com/erp/' },
      { name: 'Oracle NetSuite', url: 'https://www.netsuite.com/' },
      { name: 'Oracle JD Edwards', url: 'https://www.oracle.com/erp/jd-edwards/' }
    ],
    modules: [
      'Financial Management', 'Procurement', 'Project Management', 'Risk Management', 'Supply Chain', 'Enterprise Performance'
    ],
    customers: [
      'AT&T', 'Bank of America', 'LinkedIn', 'Marriott', 'FedEx', 'Walmart'
    ]
  },
  Microsoft: {
    name: 'Microsoft',
    description: 'Leading provider of cloud computing services and enterprise software solutions.',
    website: 'https://www.microsoft.com',
    products: [
      { name: 'Dynamics 365 Finance', url: 'https://dynamics.microsoft.com/finance/' },
      { name: 'Dynamics 365 Business Central', url: 'https://dynamics.microsoft.com/business-central/' },
      { name: 'Dynamics 365 Supply Chain', url: 'https://dynamics.microsoft.com/supply-chain-management/' }
    ],
    modules: [
      'Finance', 'Operations', 'Sales', 'Marketing', 'Customer Service', 'Field Service', 'Project Operations'
    ],
    customers: [
      'HP', 'Coca-Cola FEMSA', 'Pandora', 'Delta Air Lines', 'BMW Group', 'Chevron'
    ]
  },
  Workday: {
    name: 'Workday',
    description: 'Provider of enterprise cloud applications for finance and HR.',
    website: 'https://www.workday.com',
    products: [
      { name: 'Workday Financial Management', url: 'https://www.workday.com/financial-management' },
      { name: 'Workday Human Capital Management', url: 'https://www.workday.com/human-capital-management' },
      { name: 'Workday Adaptive Planning', url: 'https://www.workday.com/adaptive-planning' }
    ],
    modules: [
      'Core Financials', 'HR', 'Payroll', 'Talent Management', 'Analytics', 'Planning', 'Expenses'
    ],
    customers: [
      'Netflix', 'Airbnb', 'Salesforce', 'Target', 'Adobe', 'Visa'
    ]
  },
  Unit4: {
    name: 'Unit4',
    description: 'Global provider of enterprise applications for service organizations.',
    website: 'https://www.unit4.com',
    products: [
      { name: 'Unit4 ERP', url: 'https://www.unit4.com/products/erp' },
      { name: 'Unit4 FP&A', url: 'https://www.unit4.com/products/financial-planning-analysis' },
      { name: 'Unit4 PSA', url: 'https://www.unit4.com/products/professional-services-automation' }
    ],
    modules: [
      'Financials', 'Project Management', 'Procurement', 'HR & Payroll', 'Asset Management', 'Field Services'
    ],
    customers: [
      'Salvation Army', 'Oxfam', 'Marie Stopes', 'Southampton University', 'Cranfield University'
    ]
  },
  Infor: {
    name: 'Infor',
    description: 'Enterprise software provider specializing in industry-specific solutions.',
    website: 'https://www.infor.com',
    products: [
      { name: 'Infor CloudSuite', url: 'https://www.infor.com/products/cloudsuite' },
      { name: 'Infor LN', url: 'https://www.infor.com/products/ln' },
      { name: 'Infor M3', url: 'https://www.infor.com/products/m3' }
    ],
    modules: [
      'Manufacturing', 'Distribution', 'Finance', 'HR', 'Asset Management', 'Supply Chain', 'CRM'
    ],
    customers: [
      'Ferrari', 'Triumph Motorcycles', 'BAE Systems', 'Heineken', 'Liberty Steel Group'
    ]
  },
  // Tech News Sources
  TechCrunch: {
    name: 'TechCrunch',
    description: 'Leading technology media platform covering startups, tech news, and industry analysis.',
    website: 'https://techcrunch.com',
    topics: ['Startups', 'Venture Capital', 'Tech Industry', 'Product Launches', 'Company News'],
    coverage: ['Technology News', 'Startup News', 'Funding Rounds', 'Product Launches']
  },
  VentureBeat: {
    name: 'VentureBeat',
    description: 'Technology website focusing on transformative tech news and innovation.',
    website: 'https://venturebeat.com',
    topics: ['AI', 'Enterprise', 'Cloud', 'GamesBeat'],
    coverage: ['AI/ML News', 'Enterprise Tech', 'Cloud Computing', 'Gaming Industry']
  }
};

export function VendorInfo({ vendor, compact = false }: VendorInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (vendor === 'All') return null;

  const info = newsSourceInfo[vendor];
  const Icon = getVendorIcon(vendor);
  const vendorColor = getVendorColor(vendor);

  const isERPVendor = (info: VendorInfo): info is ERPVendorInfo => 
    'products' in info && 'modules' in info && 'customers' in info;

  return (
    <div className="relative">
      {/* Header - Always Visible */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          bg-white/95 backdrop-blur-sm rounded-lg p-4 border border-white/20 
          flex items-center gap-3 cursor-pointer transition-all duration-300
          ${isExpanded ? 'rounded-b-none border-b-0' : ''}
        `}
      >
        <div 
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${vendorColor}20` }}
        >
          <Icon className="w-4 h-4" style={{ color: vendorColor }} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-gray-900">{info.name}</h3>
          <p className="text-xs text-gray-500 line-clamp-1">{info.description}</p>
        </div>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Expandable Content */}
      <div 
        className={`
          overflow-hidden transition-all duration-300 ease-out
          ${isExpanded ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0'}
        `}
      >
        <div className="bg-white/95 backdrop-blur-sm rounded-b-lg p-4 pt-2 border border-t-0 border-white/20">
          {isERPVendor(info) ? (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  Products
                </h4>
                <div className="space-y-1">
                  {info.products.map((product) => (
                    <a
                      key={product.name}
                      href={product.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-xs text-gray-700 hover:text-blue-600 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {product.name}
                    </a>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Grid className="w-3 h-3" />
                  Key Modules
                </h4>
                <div className="space-y-1">
                  {info.modules.map((module) => (
                    <div key={module} className="text-xs text-gray-700">
                      {module}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  Customers
                </h4>
                <div className="space-y-1">
                  {info.customers.map((customer) => (
                    <div key={customer} className="text-xs text-gray-700">
                      {customer}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Key Topics
                </h4>
                <div className="space-y-1">
                  {info.topics.map((topic) => (
                    <div key={topic} className="text-xs text-gray-700">
                      {topic}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                  <Link className="w-3 h-3" />
                  Coverage
                </h4>
                <div className="space-y-1">
                  {info.coverage.map((area) => (
                    <div key={area} className="text-xs text-gray-700">
                      {area}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <a
            href={info.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 mt-3 text-xs text-gray-500 hover:text-blue-600 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <Globe className="w-3 h-3" />
            Visit Website
          </a>
        </div>
      </div>
    </div>
  );
} 