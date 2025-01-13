import type { VendorInfo } from '../types';

export const vendorInfo: Record<string, VendorInfo> = {
  SAP: {
    name: 'SAP',
    description: 'SAP is a global leader in enterprise software, offering a comprehensive suite of business applications and technology platforms.',
    products: [
      {
        name: 'SAP S/4HANA',
        description: 'Intelligent ERP system built on in-memory database technology for real-time processing and analytics.'
      },
      {
        name: 'SAP Business One',
        description: 'ERP solution designed specifically for small and medium-sized businesses.'
      },
      {
        name: 'SAP Business ByDesign',
        description: 'Cloud-based ERP solution for midsize companies and subsidiaries.'
      }
    ],
    industries: [
      {
        name: 'Manufacturing',
        description: 'End-to-end solutions for discrete and process manufacturing.'
      },
      {
        name: 'Retail',
        description: 'Omnichannel retail solutions for modern commerce.'
      },
      {
        name: 'Financial Services',
        description: 'Solutions for banking, insurance, and financial management.'
      }
    ],
    customers: [
      {
        name: 'BMW Group',
        description: 'Automotive manufacturer using SAP S/4HANA for global operations.'
      },
      {
        name: 'Coca-Cola',
        description: 'Beverage company utilizing SAP solutions for supply chain management.'
      },
      {
        name: 'Siemens',
        description: 'Technology company leveraging SAP for enterprise resource planning.'
      }
    ]
  },
  Oracle: {
    name: 'Oracle',
    description: 'Oracle provides integrated cloud applications and platform services, including leading database and ERP solutions.',
    products: [
      {
        name: 'Oracle Fusion Cloud ERP',
        description: 'Complete cloud ERP suite with AI-powered features.'
      },
      {
        name: 'Oracle NetSuite',
        description: 'Cloud-based ERP designed for fast-growing businesses.'
      },
      {
        name: 'Oracle E-Business Suite',
        description: 'Comprehensive suite of integrated business applications.'
      }
    ],
    industries: [
      {
        name: 'Healthcare',
        description: 'Solutions for healthcare providers and payers.'
      },
      {
        name: 'Public Sector',
        description: 'Government and public service solutions.'
      },
      {
        name: 'Higher Education',
        description: 'Complete solutions for educational institutions.'
      }
    ],
    customers: [
      {
        name: 'FedEx',
        description: 'Logistics company using Oracle Cloud ERP.'
      },
      {
        name: 'Bank of America',
        description: 'Financial institution leveraging Oracle solutions.'
      },
      {
        name: 'Marriott International',
        description: 'Hotel chain using Oracle Hospitality solutions.'
      }
    ]
  },
  Microsoft: {
    name: 'Microsoft',
    description: 'Microsoft provides cloud-based business applications and platforms through its Dynamics 365 suite.',
    products: [
      {
        name: 'Dynamics 365 Finance',
        description: 'Cloud-based financial management solution.'
      },
      {
        name: 'Dynamics 365 Supply Chain',
        description: 'End-to-end supply chain management solution.'
      },
      {
        name: 'Dynamics 365 Business Central',
        description: 'All-in-one business management solution for SMBs.'
      }
    ],
    industries: [
      {
        name: 'Professional Services',
        description: 'Solutions for consulting and professional services firms.'
      },
      {
        name: 'Retail & Commerce',
        description: 'Unified commerce solutions for retailers.'
      },
      {
        name: 'Manufacturing',
        description: 'Smart manufacturing solutions with IoT integration.'
      }
    ],
    customers: [
      {
        name: 'HP Inc.',
        description: 'Technology company using Dynamics 365.'
      },
      {
        name: 'Chevron',
        description: 'Energy corporation leveraging Microsoft solutions.'
      },
      {
        name: 'Walgreens',
        description: 'Retail pharmacy chain using Microsoft cloud solutions.'
      }
    ]
  },
  Workday: {
    name: 'Workday',
    description: 'Workday delivers cloud-based enterprise solutions for financial management, HR, and planning.',
    products: [
      {
        name: 'Workday Financial Management',
        description: 'Core financials, accounting, and planning solution.'
      },
      {
        name: 'Workday Human Capital Management',
        description: 'Complete solution for HR and workforce management.'
      },
      {
        name: 'Workday Adaptive Planning',
        description: 'Enterprise planning and analytics platform.'
      }
    ],
    industries: [
      {
        name: 'Technology',
        description: 'Solutions for technology and software companies.'
      },
      {
        name: 'Healthcare',
        description: 'Healthcare provider and payer solutions.'
      },
      {
        name: 'Education',
        description: 'Solutions for higher education institutions.'
      }
    ],
    customers: [
      {
        name: 'Netflix',
        description: 'Streaming service using Workday HCM and Financial Management.'
      },
      {
        name: 'Salesforce',
        description: 'CRM company leveraging Workday solutions.'
      },
      {
        name: 'Target',
        description: 'Retail corporation using Workday for HR and finance.'
      }
    ]
  },
  Unit4: {
    name: 'Unit4',
    description: 'Unit4 specializes in enterprise software for service-centric organizations.',
    products: [
      {
        name: 'Unit4 ERP',
        description: 'Cloud ERP designed for people-centric organizations.'
      },
      {
        name: 'Unit4 Financial Planning & Analysis',
        description: 'Advanced financial planning and analytics solution.'
      },
      {
        name: 'Unit4 Student Management',
        description: 'Student information system for higher education.'
      }
    ],
    industries: [
      {
        name: 'Professional Services',
        description: 'Solutions for professional services organizations.'
      },
      {
        name: 'Higher Education',
        description: 'Complete solutions for universities and colleges.'
      },
      {
        name: 'Public Sector',
        description: 'Solutions for government and non-profit organizations.'
      }
    ],
    customers: [
      {
        name: 'Middlesex University',
        description: 'University using Unit4 Student Management.'
      },
      {
        name: 'Sikich',
        description: 'Professional services firm using Unit4 ERP.'
      },
      {
        name: 'Save the Children',
        description: 'Non-profit organization using Unit4 solutions.'
      }
    ]
  },
  Infor: {
    name: 'Infor',
    description: 'Infor provides industry-specific cloud solutions for enterprise software.',
    products: [
      {
        name: 'Infor CloudSuite',
        description: 'Industry-specific ERP solutions in the cloud.'
      },
      {
        name: 'Infor LN',
        description: 'ERP solution for complex manufacturing.'
      },
      {
        name: 'Infor M3',
        description: 'ERP solution for distribution and manufacturing.'
      }
    ],
    industries: [
      {
        name: 'Manufacturing',
        description: 'Solutions for discrete and process manufacturing.'
      },
      {
        name: 'Distribution',
        description: 'Solutions for wholesale and distribution.'
      },
      {
        name: 'Healthcare',
        description: 'Solutions for healthcare organizations.'
      }
    ],
    customers: [
      {
        name: 'Ferrari',
        description: 'Automotive manufacturer using Infor LN.'
      },
      {
        name: 'Heineken',
        description: 'Beverage company using Infor M3.'
      },
      {
        name: 'BAE Systems',
        description: 'Defense contractor using Infor CloudSuite.'
      }
    ]
  }
}; 