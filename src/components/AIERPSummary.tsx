import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Divider, Spin, Alert } from 'antd';
import { RobotOutlined, BulbOutlined, RocketOutlined } from '@ant-design/icons';
import { createClient } from '@supabase/supabase-js';

const { Title, Text, Paragraph } = Typography;

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

export const AIERPSummary: React.FC<AIERPSummaryProps> = ({ date = new Date().toLocaleDateString() }) => {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<SummaryContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // First, fetch AI-related articles from today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const { data: articles, error: fetchError } = await supabase
          .from('articles')
          .select('*')
          .eq('is_ai_related', true)
          .gte('published_at', today.toISOString())
          .order('published_at', { ascending: false });

        if (fetchError) {
          throw new Error('Failed to fetch AI-related articles');
        }

        if (!articles || articles.length === 0) {
          throw new Error('No AI-related articles found today');
        }

        // Combine all articles content
        const combinedContent = articles
          .map(article => `${article.title}\n\n${article.content || article.summary}`)
          .join('\n\n---\n\n');

        // Generate summary
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

  return (
    <Card
      title={
        <Space>
          <RobotOutlined style={{ color: '#1890ff' }} />
          <span>Daily AI in ERP Summary</span>
          <Text type="secondary" style={{ fontSize: '14px' }}>
            {date}
          </Text>
        </Space>
      }
      style={{ marginBottom: 24 }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            Analyzing AI developments in ERP...
          </Text>
        </div>
      ) : error ? (
        <Alert type="error" message={error} />
      ) : summary ? (
        <>
          <Title level={4}>
            <Space>
              <BulbOutlined />
              Executive Summary
            </Space>
          </Title>
          <Paragraph>
            {summary.executiveSummary.map((point, index) => (
              <div key={index} style={{ marginBottom: 8 }}>• {point}</div>
            ))}
          </Paragraph>

          <Divider />

          <Title level={4}>
            <Space>
              <RobotOutlined />
              Key Innovations
            </Space>
          </Title>
          <Paragraph>
            {summary.keyInnovations.map((point, index) => (
              <div key={index} style={{ marginBottom: 8 }}>• {point}</div>
            ))}
          </Paragraph>

          <Divider />

          <Title level={4}>
            <Space>
              <RocketOutlined />
              Strategic Implications
            </Space>
          </Title>
          <Paragraph>
            {summary.strategicImplications.map((point, index) => (
              <div key={index} style={{ marginBottom: 8 }}>• {point}</div>
            ))}
          </Paragraph>
        </>
      ) : null}
    </Card>
  );
}; 