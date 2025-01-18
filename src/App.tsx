import { useState, useEffect } from 'react';
import { VendorFilter } from './components/VendorFilter';
import { NewsCard } from './components/NewsCard';
import { SearchBar } from './components/SearchBar';
import { VendorInfo } from './components/VendorInfo';
import { AITab } from './components/AITab';
import { AIERPSummary } from './components/AIERPSummary';
import type { Article, NewsSource } from './types';
import { getVendorColor } from './utils/vendor';
import { createClient } from '@supabase/supabase-js';
import { Brain, Newspaper, Menu, X } from 'lucide-react';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Detailed environment variable checking
if (!supabaseUrl) {
  console.error('Missing VITE_SUPABASE_URL environment variable');
  throw new Error('Missing Supabase URL');
}

if (!supabaseKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY environment variable');
  throw new Error('Missing Supabase anon key');
}

// Debug logging
console.log('Supabase Configuration:', {
  url: supabaseUrl,
  keyLength: supabaseKey.length,
  keyIsValid: supabaseKey.startsWith('eyJ'),
  keyFirstPart: supabaseKey.split('.')[0],
  timestamp: new Date().toISOString()
});

// Initialize Supabase client with explicit configuration
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  },
  db: {
    schema: 'public'
  }
});

// Test database connection
(async () => {
  try {
    // First test if we can reach Supabase
    const { error: healthError } = await supabase.from('articles').select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.error('Supabase connection test failed:', {
        error: healthError.message,
        hint: healthError.hint,
        details: healthError.details,
        code: healthError.code,
        url: supabaseUrl
      });

      // Additional debugging information
      if (healthError.message.includes('Invalid API key')) {
        console.error('API key validation failed. Please check:');
        console.error('1. Key format is correct (should start with "eyJ")');
        console.error('2. Key is from the correct project');
        console.error('3. Key has not expired');
        console.error('4. Key has proper permissions');
        
        // Log the first part of the key for debugging (safe to show as it's just the header)
        const [header] = supabaseKey.split('.');
        console.error('Key header:', header);
      }
      
      return;
    }

    // If health check passes, try to fetch some data
    const { data, error } = await supabase
      .from('articles')
      .select('id, title')
      .limit(1);

    if (error) {
      console.error('Failed to fetch data:', error);
    } else {
      console.log('Successfully connected to Supabase and fetched data:', {
        dataReceived: !!data,
        recordCount: data?.length || 0
      });
    }
  } catch (error) {
    console.error('Unexpected error during Supabase initialization:', error);
  }
})();

type Tab = 'news' | 'ai';

export default function App() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('news');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [filters, setFilters] = useState({
    vendor: 'All' as NewsSource | 'All',
    search: ''
  });

  // Fetch articles on mount
  useEffect(() => {
    async function fetchArticles() {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) {
        console.error('Error fetching articles:', error);
      } else {
        // Transform the data to ensure proper types
        const transformedArticles = (data || []).map(article => ({
          ...article,
          published_at: new Date(article.published_at),
          is_ai_related: article.is_ai_related || false
        }));
        setArticles(transformedArticles);
      }
    }
    fetchArticles();
  }, []);

  // Filter articles based on vendor and search
  const filteredArticles = articles.filter(article => {
    const vendorMatch = filters.vendor === 'All' || article.vendor === filters.vendor;
    const searchMatch = filters.search === '' || 
      article.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      article.summary.toLowerCase().includes(filters.search.toLowerCase());
    return vendorMatch && searchMatch;
  });

  return (
    <div 
      className="min-h-screen transition-colors duration-700"
      style={filters.vendor !== 'All' ? {
        background: `linear-gradient(to bottom right, ${getVendorColor(filters.vendor as NewsSource)}, ${getVendorColor(filters.vendor as NewsSource)}cc)`
      } : {
        background: 'linear-gradient(to bottom right, #2563eb, #4f46e5, #7c3aed)'
      }}
    >
      <AIERPSummary />
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="max-w-[2000px] mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <h1 className="text-2xl font-bold text-white">
              ERP World
            </h1>
          </div>
          {activeTab === 'news' && (
            <div className="w-72">
              <SearchBar
                value={filters.search}
                onChange={(search) => setFilters(prev => ({ ...prev, search }))}
              />
            </div>
          )}
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside 
          className={`
            fixed lg:static inset-y-0 left-0 z-30
            w-64 min-h-[calc(100vh-73px)] bg-white/10 backdrop-blur-md border-r border-white/20 
            p-6 space-y-8 transition-all duration-300 lg:translate-x-0
            lg:hover:translate-x-0 lg:w-16 lg:hover:w-64 group
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
          style={{ top: '73px' }}
        >
          {/* Navigation */}
          <nav className="space-y-6">
            {/* Tabs */}
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('news')}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'news'
                    ? 'bg-white text-blue-600'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Newspaper className="w-4 h-4" />
                <span className="lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  News Feed
                </span>
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className={`w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === 'ai'
                    ? 'bg-white text-purple-600'
                    : 'text-white/80 hover:text-white hover:bg-white/10'
                }`}
              >
                <Brain className="w-4 h-4" />
                <span className="lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                  AI in ERP
                </span>
              </button>
            </div>

            {/* Filters (only show in news tab) */}
            {activeTab === 'news' && (
              <div className="space-y-6 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <VendorFilter
                  selectedVendor={filters.vendor}
                  onVendorSelect={(vendor) => setFilters(prev => ({ ...prev, vendor }))}
                />
              </div>
            )}
          </nav>
        </aside>

        {/* Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 px-6 py-8">
          {/* Content */}
          {activeTab === 'news' ? (
            <>
              {/* Vendor Header */}
              {filters.vendor !== 'All' && (
                <div className="mb-8">
                  <VendorInfo vendor={filters.vendor} />
                </div>
              )}

              {/* Articles Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredArticles.map((article) => (
                  <NewsCard key={article.url} article={article} />
                ))}
              </div>

              {/* No Results */}
              {filteredArticles.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-white text-lg">
                    No articles found. Try adjusting your filters.
                  </p>
                </div>
              )}
            </>
          ) : (
            <AITab articles={articles} />
          )}
        </main>
      </div>
    </div>
  );
}