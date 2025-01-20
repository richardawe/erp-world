import { Building2, Database, MonitorPlay, Clock, BarChart2, Package, Newspaper, Tv, Calculator, Cloud, Factory, Settings, Box, LayoutGrid, Cog, BarChart, Boxes, Globe, Monitor, FileText } from 'lucide-react';
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
    case 'Sage':
      return 'https://www.sage.com/favicon.ico';
    case 'NetSuite':
      return 'https://www.netsuite.com/favicon.ico';
    case 'Epicor':
      return 'https://www.epicor.com/favicon.ico';
    case 'IFS':
      return 'https://www.ifs.com/favicon.ico';
    case 'Odoo':
      return 'https://www.odoo.com/favicon.ico';
    case 'Acumatica':
      return 'https://www.acumatica.com/favicon.ico';
    case 'SYSPRO':
      return 'https://www.syspro.com/favicon.ico';
    case 'Deltek':
      return 'https://www.deltek.com/favicon.ico';
    case 'QAD':
      return 'https://www.qad.com/favicon.ico';
    // Tech News Sources
    case 'TechCrunch':
      return 'https://techcrunch.com/wp-content/uploads/2015/02/cropped-cropped-favicon-gradient.png';
    case 'VentureBeat':
      return 'https://venturebeat.com/wp-content/themes/vb-news/img/favicon.ico';
    case 'ZDNet':
      return 'https://www.zdnet.com/favicon.ico';
    case 'ComputerWeekly':
      return 'https://www.computerweekly.com/favicon.ico';
    case 'InformationWeek':
      return 'https://www.informationweek.com/favicon.ico';
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
    case 'Sage':
      return '#00703C';
    case 'NetSuite':
      return '#00703C';
    case 'Epicor':
      return '#00703C';
    case 'IFS':
      return '#00703C';
    case 'Odoo':
      return '#00703C';
    case 'Acumatica':
      return '#00703C';
    case 'SYSPRO':
      return '#00703C';
    case 'Deltek':
      return '#00703C';
    case 'QAD':
      return '#00703C';
    // Tech News Sources
    case 'TechCrunch':
      return '#00D084';
    case 'VentureBeat':
      return '#1C5FAD';
    case 'ZDNet':
      return '#00703C';
    case 'ComputerWeekly':
      return '#00703C';
    case 'InformationWeek':
      return '#00703C';
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
    case 'Sage':
      return Calculator;
    case 'NetSuite':
      return Cloud;
    case 'Epicor':
      return Factory;
    case 'IFS':
      return Settings;
    case 'Odoo':
      return Box;
    case 'Acumatica':
      return LayoutGrid;
    case 'SYSPRO':
      return Cog;
    case 'Deltek':
      return BarChart;
    case 'QAD':
      return Boxes;
    // Tech News Sources
    case 'TechCrunch':
      return Newspaper;
    case 'VentureBeat':
      return Tv;
    case 'ZDNet':
      return Globe;
    case 'ComputerWeekly':
      return Monitor;
    case 'InformationWeek':
      return FileText;
    default:
      return Building2;
  }
} 