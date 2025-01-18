import { Building2, Database, MonitorPlay, Clock, BarChart2, Package, Newspaper, Tv } from 'lucide-react';
import type { NewsSource } from '../types';

export function getVendorLogo(vendor: NewsSource): string {
  const logos: Record<NewsSource, string> = {
    SAP: '/vendor-logos/sap.svg',
    Oracle: '/vendor-logos/oracle.svg',
    Microsoft: '/vendor-logos/microsoft.svg',
    Workday: '/vendor-logos/workday.svg',
    Unit4: '/vendor-logos/unit4.svg',
    Infor: '/vendor-logos/infor.svg',
    Forterro: '/vendor-logos/forterro.svg'
  };

  return logos[vendor];
}

export function getVendorColor(vendor: NewsSource): string {
  const colors: Record<NewsSource, string> = {
    SAP: '#0077B3',
    Oracle: '#C74634',
    Microsoft: '#00A4EF',
    Workday: '#0066A1',
    Unit4: '#1A1A1A',
    Infor: '#C8102E',
    Forterro: '#00529B'
  };

  return colors[vendor] || '#2563eb';
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

export function getVendorWebsite(vendor: NewsSource): string {
  const websites: Record<NewsSource, string> = {
    SAP: 'https://www.sap.com',
    Oracle: 'https://www.oracle.com',
    Microsoft: 'https://dynamics.microsoft.com',
    Workday: 'https://www.workday.com',
    Unit4: 'https://www.unit4.com',
    Infor: 'https://www.infor.com',
    Forterro: 'https://www.forterro.com'
  };

  return websites[vendor];
} 