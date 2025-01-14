import { Modal } from './Modal';
import type { Article } from '../types';
import { getVendorColor } from '../utils/vendor';
import { AISummary } from './AISummary';

interface ArticleModalProps {
  article: Article;
  isOpen: boolean;
  onClose: () => void;
}

export function ArticleModal({ article, isOpen, onClose }: ArticleModalProps) {
  const vendorColor = getVendorColor(article.vendor);
  const formattedDate = new Date(article.published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={article.title}>
      <div className="space-y-6">
        {/* Article Header */}
        <div className="space-y-4">
          {article.image_url && (
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-64 object-cover rounded-lg"
            />
          )}
          
          {/* Metadata */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span style={{ color: vendorColor }} className="font-semibold">
              {article.vendor}
            </span>
            <span>•</span>
            <time dateTime={article.published_at}>{formattedDate}</time>
          </div>
        </div>

        {/* AI Summary */}
        <AISummary content={article.content || article.summary} />

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          {/* Summary */}
          <p className="text-lg font-medium text-gray-900 leading-relaxed">
            {article.summary}
          </p>
          
          {/* Full Content */}
          {article.content ? (
            <div 
              className="mt-6 text-gray-700"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          ) : (
            <div className="mt-8 flex flex-col items-center gap-4 text-center">
              <p className="text-gray-600">
                Full article content is available on the vendor's website.
              </p>
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 rounded-full text-white font-semibold transition-colors"
                style={{ backgroundColor: vendorColor }}
              >
                Read Full Article
              </a>
            </div>
          )}
        </div>

        {/* Categories */}
        {article.categories.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {article.categories.map((category) => (
              <span
                key={category}
                className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full"
              >
                {category}
              </span>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
} 