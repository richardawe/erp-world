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
    name: 'Oracle',
    description: 'Provider of enterprise software, cloud infrastructure, and integrated hardware/software systems.',
    website: 'https://www.oracle.com',
    products: [
      { name: 'Oracle ERP Cloud', url: 'https://www.oracle.com/erp/' },
      { name: 'Oracle NetSuite', url: 'https://www.netsuite.com/' },
      { name: 'Oracle JD Edwards', url: 'https://www.oracle.com/erp/jd-edwards/' }
    ],
    modules: [
      'Finance', 'Procurement', 'Project Management', 'Risk Management', 'Supply Chain', 'EPM'
    ],
    customers: [
      'AT&T', 'Bank of America', 'LinkedIn', 'Marriott', 'Walmart', 'FedEx'
    ]
  },
  Microsoft: {
    name: 'Microsoft',
    description: 'Leading provider of cloud-based business applications and productivity tools.',
    website: 'https://www.microsoft.com',
    products: [
      { name: 'Dynamics 365', url: 'https://dynamics.microsoft.com/' },
      { name: 'Dynamics 365 Business Central', url: 'https://dynamics.microsoft.com/business-central/' },
      { name: 'Power Platform', url: 'https://powerplatform.microsoft.com/' }
    ],
    modules: [
      'Finance', 'Sales', 'Customer Service', 'Field Service', 'Supply Chain', 'Commerce'
    ],
    customers: [
      'HP', 'Coca-Cola', 'BMW', 'Chevron', 'Delta Air Lines', 'Walgreens'
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
  Sage: {
    name: 'Sage',
    description: 'Provider of cloud business management solutions.',
    website: 'https://www.sage.com',
    products: [
      { name: 'Sage Intacct', url: 'https://www.sage.com/en-us/products/sage-intacct/' },
      { name: 'Sage X3', url: 'https://www.sage.com/en-us/products/sage-x3/' },
      { name: 'Sage 300', url: 'https://www.sage.com/en-us/products/sage-300/' }
    ],
    modules: [
      'Financial Management', 'HR', 'Payroll', 'Business Intelligence', 'CRM', 'Project Accounting'
    ],
    customers: [
      'American Express', 'Subway', 'Liverpool FC', 'WWF', 'UNICEF'
    ]
  },
  NetSuite: {
    name: 'NetSuite',
    description: 'Cloud-based business management suite.',
    website: 'https://www.netsuite.com',
    products: [
      { name: 'NetSuite ERP', url: 'https://www.netsuite.com/portal/products/netsuite/erp.shtml' },
      { name: 'SuiteCommerce', url: 'https://www.netsuite.com/portal/products/netsuite/ecommerce.shtml' },
      { name: 'OpenAir', url: 'https://www.netsuite.com/portal/products/openair.shtml' }
    ],
    modules: [
      'Financials', 'Inventory', 'Order Management', 'CRM', 'eCommerce', 'Professional Services'
    ],
    customers: [
      'Groupon', 'Land O\'Lakes', 'Shaw Industries', 'Williams-Sonoma', 'Roku'
    ]
  },
  Epicor: {
    name: 'Epicor',
    description: 'Industry-focused enterprise software solutions.',
    website: 'https://www.epicor.com',
    products: [
      { name: 'Epicor ERP', url: 'https://www.epicor.com/en-us/erp-systems/epicor-erp/' },
      { name: 'Prophet 21', url: 'https://www.epicor.com/en-us/erp-systems/prophet-21/' },
      { name: 'BisTrack', url: 'https://www.epicor.com/en-us/erp-systems/bistrack/' }
    ],
    modules: [
      'Manufacturing', 'Distribution', 'Retail', 'Service', 'Financial Management', 'Supply Chain'
    ],
    customers: [
      'Domino\'s Pizza', 'Energizer', 'Mazda', 'Trek Bikes', 'Yamaha'
    ]
  },
  IFS: {
    name: 'IFS',
    description: 'Global enterprise software provider.',
    website: 'https://www.ifs.com',
    products: [
      { name: 'IFS Cloud', url: 'https://www.ifs.com/solutions/ifs-cloud/' },
      { name: 'IFS Field Service', url: 'https://www.ifs.com/solutions/service-management/' },
      { name: 'IFS Applications', url: 'https://www.ifs.com/solutions/enterprise-resource-planning/' }
    ],
    modules: [
      'ERP', 'Field Service', 'Enterprise Asset Management', 'Project Management', 'Supply Chain'
    ],
    customers: [
      'Volvo', 'Rolls-Royce', 'Jotun', 'Carlsberg', 'Panasonic'
    ]
  },
  Odoo: {
    name: 'Odoo',
    description: 'Open source business applications suite.',
    website: 'https://www.odoo.com',
    products: [
      { name: 'Odoo ERP', url: 'https://www.odoo.com/app/erp' },
      { name: 'Odoo CRM', url: 'https://www.odoo.com/app/crm' },
      { name: 'Odoo eCommerce', url: 'https://www.odoo.com/app/ecommerce' }
    ],
    modules: [
      'Sales', 'CRM', 'Inventory', 'Manufacturing', 'Accounting', 'eCommerce', 'Website Builder'
    ],
    customers: [
      'Toyota', 'Hyundai', 'Danone', 'WWF', 'Red Cross'
    ]
  },
  Acumatica: {
    name: 'Acumatica',
    description: 'Cloud ERP software for small and mid-market businesses.',
    website: 'https://www.acumatica.com',
    products: [
      { name: 'Acumatica Cloud ERP', url: 'https://www.acumatica.com/cloud-erp-software/' },
      { name: 'Construction Edition', url: 'https://www.acumatica.com/cloud-erp-software/construction-management/' },
      { name: 'Commerce Edition', url: 'https://www.acumatica.com/cloud-erp-software/commerce-management/' }
    ],
    modules: [
      'Financial Management', 'Distribution', 'Manufacturing', 'Construction', 'Field Service', 'Commerce'
    ],
    customers: [
      'Shoebacca', 'Superprem', 'ASi', 'Bertram Yachts', 'Specified Technologies'
    ]
  },
  SYSPRO: {
    name: 'SYSPRO',
    description: 'ERP software for manufacturing and distribution.',
    website: 'https://www.syspro.com',
    products: [
      { name: 'SYSPRO ERP', url: 'https://www.syspro.com/product/what-is-syspro/' },
      { name: 'Manufacturing Operations', url: 'https://www.syspro.com/product/manufacturing-software/' },
      { name: 'Distribution Management', url: 'https://www.syspro.com/product/distribution-software/' }
    ],
    modules: [
      'Manufacturing', 'Distribution', 'Financial', 'Inventory', 'Planning', 'Quality'
    ],
    customers: [
      'McCain Foods', 'Dunlop', 'Cascade', 'Amcor', 'Kohler'
    ]
  },
  Deltek: {
    name: 'Deltek',
    description: 'Project-based software solutions.',
    website: 'https://www.deltek.com',
    products: [
      { name: 'Deltek Vantagepoint', url: 'https://www.deltek.com/en/products/project-erp/vantagepoint' },
      { name: 'Deltek Costpoint', url: 'https://www.deltek.com/en/products/project-erp/costpoint' },
      { name: 'Deltek Vision', url: 'https://www.deltek.com/en/products/project-erp/vision' }
    ],
    modules: [
      'Project Management', 'Resource Planning', 'Financial Management', 'Business Development', 'HR'
    ],
    customers: [
      'Parsons', 'Jacobs', 'AECOM', 'Burns & McDonnell', 'HDR'
    ]
  },
  QAD: {
    name: 'QAD',
    description: 'Cloud ERP for manufacturing companies.',
    website: 'https://www.qad.com',
    products: [
      { name: 'QAD Adaptive ERP', url: 'https://www.qad.com/adaptive-erp' },
      { name: 'QAD DynaSys DSCP', url: 'https://www.qad.com/solutions/supply-chain-planning' },
      { name: 'QAD Precision', url: 'https://www.qad.com/solutions/global-trade-and-transportation' }
    ],
    modules: [
      'Manufacturing', 'Supply Chain', 'Finance', 'Customer Management', 'Service & Support', 'Analytics'
    ],
    customers: [
      'Zodiac Aerospace', 'Cascade Engineering', 'Solaft', 'Vitatech', 'BorgWarner'
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
  },
  ZDNet: {
    name: 'ZDNet',
    description: 'Business technology news website covering IT, computing, and enterprise tech.',
    website: 'https://www.zdnet.com',
    topics: ['Enterprise Tech', 'Security', 'Cloud', 'Innovation'],
    coverage: ['Tech Reviews', 'Industry Analysis', 'Digital Transformation', 'Cybersecurity']
  },
  ComputerWeekly: {
    name: 'Computer Weekly',
    description: 'Leading provider of enterprise IT news and analysis.',
    website: 'https://www.computerweekly.com',
    topics: ['Enterprise IT', 'Digital Transformation', 'Security', 'Cloud'],
    coverage: ['IT Strategy', 'Technology Implementation', 'Industry News', 'Case Studies']
  },
  InformationWeek: {
    name: 'Information Week',
    description: 'Enterprise technology publication focused on IT strategy and innovation.',
    website: 'https://www.informationweek.com',
    topics: ['Enterprise Tech', 'IT Strategy', 'DevOps', 'Security'],
    coverage: ['IT Leadership', 'Digital Transformation', 'Infrastructure', 'Data Management']
  }
};

export function VendorInfo({ vendor, compact = false }: VendorInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (vendor === 'All') return null;

  const info = newsSourceInfo[vendor];
  if (!info) return null;  // Return null if vendor info is not found
  
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