import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Select, message, Table, Space, Tag, Modal } from 'antd';
import { PlusOutlined, DeleteOutlined, LogoutOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from './LoginForm';

const { Option } = Select;
const { confirm } = Modal;

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Source {
  id: number;
  url: string;
  vendor: string;
  type: 'rss' | 'html';
  active: boolean;
  last_crawled: string | null;
}

export const AdminPanel: React.FC = () => {
  const { user, signOut } = useAuth();
  const [url, setUrl] = useState('');
  const [vendor, setVendor] = useState<string>('');
  const [type, setType] = useState<'rss' | 'html'>('rss');
  const [loading, setLoading] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [tableLoading, setTableLoading] = useState(false);

  // If not authenticated, show login form
  if (!user) {
    return <LoginForm />;
  }

  useEffect(() => {
    if (user) {
      fetchSources();
    }
  }, [user]);

  const validateUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const fetchSources = async () => {
    setTableLoading(true);
    try {
      const { data, error } = await supabase
        .from('sources')
        .select('*')
        .order('vendor', { ascending: true });

      if (error) throw error;
      setSources(data || []);
    } catch (error) {
      message.error('Failed to fetch sources');
      console.error('Error fetching sources:', error);
    } finally {
      setTableLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validate fields
    if (!url || !vendor) {
      message.error('Please fill in all fields');
      return;
    }

    if (!validateUrl(url)) {
      message.error('Please enter a valid URL');
      return;
    }

    // Check for duplicate URL
    const duplicateSource = sources.find(source => source.url === url);
    if (duplicateSource) {
      message.error('This URL already exists in the sources');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('sources')
        .insert([
          {
            url: url.trim(),
            vendor: vendor.trim(),
            type,
            active: true
          }
        ]);

      if (error) throw error;

      message.success('Source added successfully');
      setUrl('');
      setVendor('');
      setType('rss');
      fetchSources();
    } catch (error) {
      message.error('Failed to add source');
      console.error('Error adding source:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    confirm({
      title: 'Are you sure you want to delete this source?',
      icon: <ExclamationCircleOutlined />,
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          const { error } = await supabase
            .from('sources')
            .delete()
            .eq('id', id);

          if (error) throw error;

          message.success('Source deleted successfully');
          fetchSources();
        } catch (error) {
          message.error('Failed to delete source');
          console.error('Error deleting source:', error);
        }
      },
    });
  };

  const handleToggleActive = async (record: Source) => {
    try {
      const { error } = await supabase
        .from('sources')
        .update({ active: !record.active })
        .eq('id', record.id);

      if (error) throw error;

      message.success(`Source ${record.active ? 'deactivated' : 'activated'} successfully`);
      fetchSources();
    } catch (error) {
      message.error('Failed to update source');
      console.error('Error updating source:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      message.success('Logged out successfully');
    } catch (error) {
      message.error('Failed to log out');
      console.error('Error signing out:', error);
    }
  };

  const columns = [
    {
      title: 'Vendor',
      dataIndex: 'vendor',
      key: 'vendor',
      sorter: (a: Source, b: Source) => a.vendor.localeCompare(b.vendor),
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      render: (text: string) => (
        <a href={text} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-500">
          {text}
        </a>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      filters: [
        { text: 'RSS', value: 'rss' },
        { text: 'HTML', value: 'html' },
      ],
      onFilter: (value: string | number | boolean, record: Source) => record.type === value,
      render: (text: string) => (
        <Tag color={text === 'rss' ? 'green' : 'blue'}>
          {text.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'active',
      key: 'active',
      filters: [
        { text: 'Active', value: true },
        { text: 'Inactive', value: false },
      ],
      onFilter: (value: string | number | boolean, record: Source) => record.active === value,
      render: (active: boolean) => (
        <Tag color={active ? 'success' : 'error'}>
          {active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Last Crawled',
      dataIndex: 'last_crawled',
      key: 'last_crawled',
      render: (text: string) => text ? new Date(text).toLocaleString() : 'Never',
      sorter: (a: Source, b: Source) => {
        if (!a.last_crawled) return 1;
        if (!b.last_crawled) return -1;
        return new Date(a.last_crawled).getTime() - new Date(b.last_crawled).getTime();
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, record: Source) => (
        <Space>
          <Button
            type={record.active ? 'default' : 'primary'}
            onClick={() => handleToggleActive(record)}
            className={record.active ? 'hover:text-red-500' : 'hover:text-green-500'}
          >
            {record.active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">Admin Panel</h2>
        <Button 
          icon={<LogoutOutlined />} 
          onClick={handleSignOut}
          danger
        >
          Sign Out
        </Button>
      </div>

      <Card 
        title={
          <div className="text-white">
            Add New Source
            <span className="text-sm text-gray-400 ml-2">
              Add RSS feeds or HTML pages to crawl
            </span>
          </div>
        }
        className="bg-white/10 backdrop-blur-md border-white/20"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-white text-sm mb-1">URL</div>
              <Input
                placeholder="https://example.com/feed"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="bg-white/5 border-white/20 text-white"
              />
            </div>
            <div>
              <div className="text-white text-sm mb-1">Vendor Name</div>
              <Input
                placeholder="Vendor"
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                className="bg-white/5 border-white/20 text-white"
              />
            </div>
            <div>
              <div className="text-white text-sm mb-1">Source Type</div>
              <Select
                value={type}
                onChange={setType}
                className="w-full"
              >
                <Option value="rss">RSS Feed</Option>
                <Option value="html">HTML Page</Option>
              </Select>
            </div>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleSubmit}
            loading={loading}
            className="w-full md:w-auto"
          >
            Add Source
          </Button>
        </div>
      </Card>

      <Card 
        title={
          <div className="text-white">
            Manage Sources
            <span className="text-sm text-gray-400 ml-2">
              {sources.length} sources found
            </span>
          </div>
        }
        className="bg-white/10 backdrop-blur-md border-white/20"
      >
        <Table
          columns={columns}
          dataSource={sources}
          rowKey="id"
          className="bg-white/5"
          loading={tableLoading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} items`,
          }}
        />
      </Card>
    </div>
  );
}; 