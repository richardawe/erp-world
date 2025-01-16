import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Divider, Spin, Alert, Collapse } from 'antd';
import { RobotOutlined, BulbOutlined, RocketOutlined, CaretRightOutlined } from '@ant-design/icons';
import { createClient } from '@supabase/supabase-js';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface AIERPSummaryProps {
  date?: string;
}

interface SummaryContent {
  executiveSummary: string[];
  keyInnovations: string[];
  strategicImplications: string[];
}

const parseSummaryContent = (content: string): SummaryContent => {
  const sections = content.split(/(?=Executive Summary:|Key Innovations:|Strategic Implications:)/);
  
  const extractBulletPoints = (section: string): string[] => {
    const contentWithoutHeader = section
      .replace(/^(Executive Summary:|Key Innovations:|Strategic Implications:)/, '')
      .trim();
    
    return contentWithoutHeader
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('•'))
      .map(line => line.substring(1).trim())
      .filter(Boolean);
  };

  const executiveSummarySection = sections.find(s => s.includes('Executive Summary:')) || '';
  const keyInnovationsSection = sections.find(s => s.includes('Key Innovations:')) || '';
  const strategicImplicationsSection = sections.find(s => s.includes('Strategic Implications:')) || '';

  return {
    executiveSummary: extractBulletPoints(executiveSummarySection),
    keyInnovations: extractBulletPoints(keyInnovationsSection),
    strategicImplications: extractBulletPoints(strategicImplicationsSection)
  };
};

interface ArticleWithSummary {
  title: string;
  url: string;
  summary: string;
}

export const AIERPSummary: React.FC<AIERPSummaryProps> = ({ date = new Date().toLocaleDateString() }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [articles, setArticles] = useState<ArticleWithSummary[]>([]);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: fetchedArticles, error: fetchError } = await supabase
          .from('articles')
          .select('*')
          .eq('is_ai_related', true)
          .gte('published_at', today.toISOString())
          .order('published_at', { ascending: false });

        if (fetchError) {
          throw new Error('Failed to fetch AI-related articles');
        }

        if (!fetchedArticles || fetchedArticles.length === 0) {
          throw new Error('No AI-related articles found today');
        }

        // Store articles for linking
        setArticles(fetchedArticles.map(article => ({
          title: article.title,
          url: article.url,
          summary: article.summary
        })));

        const combinedContent = fetchedArticles
          .map(article => `${article.title}\n\n${article.content || article.summary}`)
          .join('\n\n---\n\n');

        const response = await fetch('/.netlify/functions/generateSummary', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            content: combinedContent,
            aspect: 'ai_in_erp' 
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate summary');
        }

        const data = await response.json();
        if (!data.summary) {
          throw new Error('No summary received');
        }

        setSummary(parseSummaryContent(data.summary));
      } catch (err) {
        console.error('Error generating summary:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate summary');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const findArticleUrl = (point: string): string | null => {
    return articles.find(article => 
      point.toLowerCase().includes(article.title.toLowerCase()) ||
      article.summary.toLowerCase().includes(point.toLowerCase())
    )?.url || null;
  };

  const renderPoint = (point: string) => {
    const url = findArticleUrl(point);
    return (
      <div style={{ marginBottom: 8 }}>
        • {url ? (
          <a 
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-600"
          >
            {point}
          </a>
        ) : point}
      </div>
    );
  };

  return (
    <Collapse
      className="mb-6 bg-gray-800/90 backdrop-blur-md border border-gray-700"
      expandIcon={({ isActive }) => (
        <CaretRightOutlined 
          rotate={isActive ? 90 : 0} 
          className="text-gray-200"
        />
      )}
    >
      <Panel 
        header={
          <Space>
            <RobotOutlined className="text-gray-200" />
            <span className="text-gray-100 font-medium">Daily AI in ERP Summary</span>
            <Text className="text-black text-sm">
              {date}
            </Text>
          </Space>
        }
        key="1"
        className="site-collapse-custom-panel"
      >
        {loading ? (
          <div className="text-center py-8">
            <Spin size="large" />
            <Text className="block mt-4 text-gray-200">
              Analyzing AI developments in ERP...
            </Text>
          </div>
        ) : error ? (
          <Alert 
            type="error" 
            message={error} 
            className="bg-gray-800/80 border-red-500/50 text-gray-200"
          />
        ) : summary ? (
          <div className="text-gray-200">
            <Title level={4} className="flex items-center gap-2 text-gray-100">
              <BulbOutlined />
              Executive Summary
            </Title>
            <Paragraph className="text-black">
              {summary.executiveSummary.map((point, index) => (
                <React.Fragment key={index}>
                  {renderPoint(point)}
                </React.Fragment>
              ))}
            </Paragraph>

            <Divider className="border-gray-600" />

            <Title level={4} className="flex items-center gap-2 text-gray-100">
              <RobotOutlined />
              Key Innovations
            </Title>
            <Paragraph className="text-black">
              {summary.keyInnovations.map((point, index) => (
                <React.Fragment key={index}>
                  {renderPoint(point)}
                </React.Fragment>
              ))}
            </Paragraph>

            <Divider className="border-gray-600" />

            <Title level={4} className="flex items-center gap-2 text-gray-100">
              <RocketOutlined />
              Strategic Implications
            </Title>
            <Paragraph className="text-black">
              {summary.strategicImplications.map((point, index) => (
                <React.Fragment key={index}>
                  {renderPoint(point)}
                </React.Fragment>
              ))}
            </Paragraph>
          </div>
        ) : null}
      </Panel>
    </Collapse>
  );
}; 