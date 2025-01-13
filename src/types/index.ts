export interface Article {
  id: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  vendor: ERPVendor;
  categories: Category[];
}

export type ERPVendor = 'SAP' | 'Oracle' | 'Microsoft' | 'Workday' | 'Unit4' | 'Infor' | 'Other';

export type Category = 
  | 'Product Launch'
  | 'Security Update'
  | 'Market Trend'
  | 'Partnership'
  | 'Acquisition'
  | 'General';

export interface FilterState {
  vendor: ERPVendor | 'All';
  category: Category | 'All';
  searchQuery: string;
}