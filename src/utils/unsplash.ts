const VENDOR_IMAGES: Record<string, string> = {
  'SAP': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
  'Oracle': 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&auto=format&fit=crop&q=80',
  'Microsoft': 'https://images.unsplash.com/photo-1623479322729-28b25c16b011?w=800&auto=format&fit=crop&q=80',
  'Workday': 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
  'Unit4': 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
  'Infor': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80'
};

const CATEGORY_IMAGES: Record<string, string> = {
  'Product Launch': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
  'Security Update': 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&auto=format&fit=crop&q=80',
  'Market Trend': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&auto=format&fit=crop&q=80',
  'Partnership': 'https://images.unsplash.com/photo-1521790797524-b2497295b8a0?w=800&auto=format&fit=crop&q=80',
  'Acquisition': 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
  'AI Innovation': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=80',
  'General': 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=80'
};

export function getPlaceholderImage(vendor: string, categories: string[] = []): string {
  // First try to get a category-specific image
  if (categories.length > 0) {
    for (const category of categories) {
      if (CATEGORY_IMAGES[category]) {
        return CATEGORY_IMAGES[category];
      }
    }
  }
  
  // Fallback to vendor-specific image
  if (VENDOR_IMAGES[vendor]) {
    return VENDOR_IMAGES[vendor];
  }
  
  // Final fallback to a general tech image
  return CATEGORY_IMAGES['General'];
} 