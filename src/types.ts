export type ERPVendor = 'SAP' | 'Oracle' | 'Microsoft' | 'Workday' | 'Unit4' | 'Infor';

export type NewsSource = 
  | 'SAP'
  | 'Oracle'
  | 'Microsoft'
  | 'Workday'
  | 'Unit4'
  | 'Infor'
  | 'Forterro';

export type Category = 'Product Launch' | 'Security Update' | 'Market Trend' | 'Partnership' | 'Acquisition' | 'AI Innovation' | 'General';

export interface Article {
  title: string;
  summary: string;
  content: string;
  source: string;
  url: string;
  image_url: string | null;
  published_at: Date;
  vendor: NewsSource;
  categories: Category[];
  is_ai_related: boolean;
}

export interface VendorInfo {
  name: ERPVendor;
  description: string;
  products: {
    name: string;
    description: string;
  }[];
  industries: {
    name: string;
    description: string;
  }[];
  customers: {
    name: string;
    description: string;
    logo?: string;
  }[];
}

export interface FilterState {
  vendor: ERPVendor | 'All';
  category: Category | 'All';
  searchQuery: string;
} 