import { useState } from 'react';
import type { Article } from '../types';
import { getVendorColor } from '../utils/vendor';
import { ArticleModal } from './ArticleModal';
import { ArrowUpRight, Share2, Twitter, Linkedin, Mail } from 'lucide-react';

interface NewsCardProps {
  article: Article;
}

export function NewsCard({ article }: NewsCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const vendorColor = getVendorColor(article.vendor);
  const formattedDate = new Date(article.published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Share URLs
  const shareUrls = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`${article.title} - From ERP World`)}&url=${encodeURIComponent(article.url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(article.url)}`,
    email: `mailto:?subject=${encodeURIComponent(`${article.title} - From ERP World`)}&body=${encodeURIComponent(`Check out this article from ERP World:\n\n${article.url}`)}`
  };

  return (
    <div className="relative group">
      <article 
        className="flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      >
        {/* Card Content */}
        <div className="relative overflow-hidden rounded-xl">
          {/* Hover Effect Overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Image */}
          <div 
            className="aspect-video w-full bg-gray-100"
          >
            {article.image_url ? (
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100"
                style={{ 
                  borderBottom: `4px solid ${vendorColor}`
                }}
              >
                <span className="text-gray-400 text-sm font-medium">
                  {article.vendor}
                </span>
              </div>
            )}
            
            {/* Vendor Badge */}
            <div 
              className="absolute top-3 left-3 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm shadow-sm"
              style={{ color: vendorColor }}
            >
              <span className="text-sm font-medium">
                {article.vendor}
              </span>
            </div>

            {/* Share Menu */}
            <div className="absolute top-3 right-3">
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsShareMenuOpen(!isShareMenuOpen);
                  }}
                  className="p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
                >
                  <Share2 className="w-4 h-4 text-gray-600" />
                </button>

                {/* Share Options Dropdown */}
                {isShareMenuOpen && (
                  <div 
                    className="absolute right-0 mt-2 py-2 w-40 bg-white rounded-lg shadow-lg z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <a
                      href={shareUrls.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Twitter className="w-4 h-4" />
                      Twitter
                    </a>
                    <a
                      href={shareUrls.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Linkedin className="w-4 h-4" />
                      LinkedIn
                    </a>
                    <a
                      href={shareUrls.email}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="w-4 h-4" />
                      Email
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div 
            className="flex flex-col flex-1 p-4"
          >
            {/* Date */}
            <time dateTime={article.published_at} className="text-sm text-gray-500 mb-2">
              {formattedDate}
            </time>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
              {article.title}
            </h3>

            {/* Summary */}
            <p className="text-gray-600 line-clamp-3 mb-4 text-sm sm:text-base">
              {article.summary}
            </p>

            {/* Categories */}
            <div className="mt-auto flex flex-wrap gap-2">
              {article.categories.map((category) => (
                <span
                  key={category}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                >
                  {category}
                </span>
              ))}
            </div>

            {/* Read More Button */}
            <div className="mt-4 flex justify-end">
              <button
                className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors group/btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsModalOpen(true);
                }}
              >
                Read more
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Article Modal */}
      <ArticleModal
        article={article}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}