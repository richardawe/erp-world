import React, { useState } from 'react';
import { Button, Card, Select, Spin, Typography, Space, Divider, Tooltip, message } from 'antd';
import { BulbOutlined, BarChartOutlined, RocketOutlined, TwitterOutlined, LinkedinOutlined, MailOutlined, LinkOutlined } from '@ant-design/icons';

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
  // Split content into sections based on headers
  const sections = content.split(/(?=Executive Summary:|Key Takeaways:|Strategic Implications:)/);
  
  // Helper function to extract bullet points from a section
  const extractBulletPoints = (section: string): string[] => {
    // Remove the header
    const contentWithoutHeader = section.replace(/^(Executive Summary:|Key Takeaways:|Strategic Implications:)/, '').trim();
    
    return contentWithoutHeader
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.startsWith('•'))
      .map(line => line.substring(1).trim())
      .filter(Boolean);
  };

  // Find and process each section
  const executiveSummarySection = sections.find(s => s.includes('Executive Summary:')) || '';
  const keyTakeawaysSection = sections.find(s => s.includes('Key Takeaways:')) || '';
  const strategicImplicationsSection = sections.find(s => s.includes('Strategic Implications:')) || '';

  // Extract bullet points for each section
  return {
    executiveSummary: extractBulletPoints(executiveSummarySection),
    keyTakeaways: extractBulletPoints(keyTakeawaysSection),
    strategicImplications: extractBulletPoints(strategicImplicationsSection)
  };
};

const formatSummaryForShare = (summary: SummaryContent): string => {
  const formatSection = (title: string, points: string[]) => 
    `${title}:\n${points.map(point => `• ${point}`).join('\n')}`;

  return [
    formatSection('Executive Summary', summary.executiveSummary),
    formatSection('Key Takeaways', summary.keyTakeaways),
    formatSection('Strategic Implications', summary.strategicImplications)
  ].join('\n\n');
};

const ShareButtons: React.FC<{ summary: SummaryContent, articleUrl?: string }> = ({ summary, articleUrl }) => {
  const shareText = formatSummaryForShare(summary);
  
  const handleTwitterShare = () => {
    // Twitter has a character limit, so we'll include just the first point and a link
    const text = `AI-Generated Summary:\n\n${summary.executiveSummary[0]}\n\nRead full summary and article at:`;
    const url = articleUrl || window.location.href;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleLinkedInShare = () => {
    const url = articleUrl || window.location.href;
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
  };

  const handleEmailShare = () => {
    const subject = 'AI-Generated Article Summary';
    const body = `${shareText}\n\nOriginal article: ${articleUrl || window.location.href}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleCopyLink = async () => {
    try {
      const textToCopy = `${shareText}\n\nOriginal article: ${articleUrl || window.location.href}`;
      await navigator.clipboard.writeText(textToCopy);
      message.success('Summary copied to clipboard!');
    } catch (err) {
      message.error('Failed to copy summary to clipboard');
    }
  };

  return (
    <Space>
      <Tooltip title="Share on Twitter">
        <Button icon={<TwitterOutlined />} onClick={handleTwitterShare} />
      </Tooltip>
      <Tooltip title="Share on LinkedIn">
        <Button icon={<LinkedinOutlined />} onClick={handleLinkedInShare} />
      </Tooltip>
      <Tooltip title="Share via Email">
        <Button icon={<MailOutlined />} onClick={handleEmailShare} />
      </Tooltip>
      <Tooltip title="Copy Link">
        <Button icon={<LinkOutlined />} onClick={handleCopyLink} />
      </Tooltip>
    </Space>
  );
};

export const AISummary: React.FC<AISummaryProps> = ({ content, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [aspect, setAspect] = useState<string>('general');
  const [summary, setSummary] = useState<SummaryContent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [articleUrl, setArticleUrl] = useState<string>();

  const generateSummary = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Extract URL from content
      const urlMatch = content.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        setArticleUrl(urlMatch[0]);
      }

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
          {articleUrl && (
            <>
              <Paragraph>
                <Text strong>Original Article: </Text>
                <a href={articleUrl} target="_blank" rel="noopener noreferrer">{articleUrl}</a>
              </Paragraph>
              <Divider />
            </>
          )}

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

          <Divider />
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text strong>Share this summary:</Text>
            <ShareButtons summary={summary} articleUrl={articleUrl} />
          </Space>
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