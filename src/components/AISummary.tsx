import React, { useState } from 'react';
import { Button, Card, Select, Spin, Typography, Space, Divider } from 'antd';
import { BulbOutlined, BarChartOutlined, RocketOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface AISummaryProps {
  content: string;
  onClose?: () => void;
}

interface SummaryContent {
  executiveSummary: string[];
  keyTakeaways: string[];
  strategicImplications: string[];
}

const parseSummaryContent = (content: string): SummaryContent => {
  // Split into main sections
  const sections = content.split(/\n\n/);
  
  // Helper function to extract bullet points
  const extractBulletPoints = (section: string): string[] => {
    return section
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('•'))
      .map(line => line.substring(1).trim())
      .filter(line => line && !line.includes('Executive Summary:') && !line.includes('Key Takeaways:') && !line.includes('Strategic Implications:'));
  };

  // Find sections by their headers
  const executiveSummarySection = sections.find(s => s.includes('Executive Summary:')) || '';
  const keyTakeawaysSection = sections.find(s => s.includes('Key Takeaways:')) || '';
  const strategicImplicationsSection = sections.find(s => s.includes('Strategic Implications:')) || '';

  return {
    executiveSummary: extractBulletPoints(executiveSummarySection),
    keyTakeaways: extractBulletPoints(keyTakeawaysSection),
    strategicImplications: extractBulletPoints(strategicImplicationsSection)
  };
};

export const AISummary: React.FC<AISummaryProps> = ({ content, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [aspect, setAspect] = useState<string>('general');
  const [summary, setSummary] = useState<SummaryContent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!content?.trim()) {
        throw new Error('No content available to analyze');
      }

      const response = await fetch('/.netlify/functions/generateSummary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, aspect }),
      });

      // Check if response is not empty
      const text = await response.text();
      if (!text) {
        throw new Error('Received empty response from the server');
      }

      const data = JSON.parse(text);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate summary');
      }

      if (!data.summary) {
        throw new Error('No summary received from the API');
      }

      setSummary(parseSummaryContent(data.summary));
    } catch (err: any) {
      console.error('Summary generation error:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'Failed to generate summary. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title={
        <Space>
          <BulbOutlined style={{ color: '#1890ff' }} />
          <span>AI Executive Summary</span>
        </Space>
      }
      extra={
        <Space>
          <Select
            value={aspect}
            onChange={setAspect}
            style={{ width: 200 }}
            disabled={loading}
          >
            <Option value="general">General Analysis</Option>
            <Option value="market_trends">Market Trends</Option>
            <Option value="competitive_moves">Competitive Analysis</Option>
            <Option value="technology_impacts">Technology Impact</Option>
          </Select>
          <Button
            type="primary"
            onClick={generateSummary}
            loading={loading}
          >
            Generate Summary
          </Button>
        </Space>
      }
      style={{ marginBottom: 24 }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
            Generating executive insights...
          </Text>
        </div>
      ) : error ? (
        <Text type="danger">{error}</Text>
      ) : summary ? (
        <>
          <Title level={4}>
            <Space>
              <BarChartOutlined />
              Executive Summary
            </Space>
          </Title>
          <Paragraph>
            {summary.executiveSummary.map((point, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                • {point}
              </div>
            ))}
          </Paragraph>

          <Divider />

          <Title level={4}>
            <Space>
              <BulbOutlined />
              Key Takeaways
            </Space>
          </Title>
          <Paragraph>
            {summary.keyTakeaways.map((point, index) => (
              <div key={index} style={{ marginBottom: 8 }}>
                • {point}
              </div>
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
              <div key={index} style={{ marginBottom: 8 }}>
                • {point}
              </div>
            ))}
          </Paragraph>
        </>
      ) : (
        <Text type="secondary">
          Select an aspect and click "Generate Summary" to get AI-powered insights.
        </Text>
      )}
    </Card>
  );
};

export default AISummary; 