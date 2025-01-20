import { Building2, Database, MonitorPlay, Clock, BarChart2, Package, Newspaper, Tv } from 'lucide-react';
import type { NewsSource } from '../types';

export function getVendorLogo(vendor: NewsSource): string {
  switch (vendor) {
    // ERP Vendors
    case 'SAP':
      return 'https://www.sap.com/dam/application/shared/logos/sap-logo-svg.svg';
    case 'Oracle':
      return 'https://www.oracle.com/asset/web/favicons/favicon-192.png';
    case 'Microsoft':
      return 'https://img-prod-cms-rt-microsoft-com.akamaized.net/cms/api/am/imageFileData/RE1Mu3b';
    case 'Workday':
      return 'https://workday.com/content/dam/web/en-us/images/workday-header-logo.svg';
    case 'Unit4':
      return 'https://www.unit4.com/assets/logos/unit4-logo.svg';
    case 'Infor':
      return 'https://www.infor.com/static-resources/images/infor-logo.svg';
    // Tech News Sources
    case 'TechCrunch':
      return 'https://techcrunch.com/wp-content/uploads/2015/02/cropped-cropped-favicon-gradient.png';
    case 'VentureBeat':
      return 'https://venturebeat.com/wp-content/themes/vb-news/img/favicon.ico';
    default:
      return '';
  }
}

export function getVendorColor(vendor: NewsSource): string {
  switch (vendor) {
    // ERP Vendors
    case 'SAP':
      return '#003366';
    case 'Oracle':
      return '#C74634';
    case 'Microsoft':
      return '#00A4EF';
    case 'Workday':
      return '#0875E1';
    case 'Unit4':
      return '#1A1F71';
    case 'Infor':
      return '#C8102E';
    // Tech News Sources
    case 'TechCrunch':
      return '#00D084';
    case 'VentureBeat':
      return '#1C5FAD';
    default:
      return '#6B7280';
  }
}

export function getVendorIcon(vendor: NewsSource) {
  switch (vendor) {
    // ERP Vendors
    case 'SAP':
      return Database;
    case 'Oracle':
      return Database;
    case 'Microsoft':
      return MonitorPlay;
    case 'Workday':
      return Clock;
    case 'Unit4':
      return BarChart2;
    case 'Infor':
      return Package;
    // Tech News Sources
    case 'TechCrunch':
      return Newspaper;
    case 'VentureBeat':
      return Tv;
    default:
      return Building2;
  }
} 