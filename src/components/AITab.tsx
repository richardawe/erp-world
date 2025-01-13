import { NewsCard } from './NewsCard';
import type { Article } from '../types';
import { Brain } from 'lucide-react';

interface AITabProps {
  articles: Article[];
}

export function AITab({ articles }: AITabProps) {
  const aiArticles = articles.filter(article => article.is_ai_related);

  return (
    <div className="space-y-6">
      {/* AI Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <Brain className="w-8 h-8" />
          <h2 className="text-2xl font-bold">AI in ERP</h2>
        </div>
        <p className="text-white/90">
          Stay updated with the latest artificial intelligence developments in enterprise software.
          From machine learning to automation, discover how AI is transforming ERP systems.
        </p>
      </div>

      {/* AI Articles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {aiArticles.map((article) => (
          <NewsCard key={article.url} article={article} />
        ))}
      </div>

      {/* No Results */}
      {aiArticles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-white text-lg">
            No AI-related articles found at the moment.
          </p>
        </div>
      )}
    </div>
  );
} 