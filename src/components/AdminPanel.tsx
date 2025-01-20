import React, { useState } from 'react';
import { Card, Input, Button, Select, message, Table, Space, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, LogoutOutlined } from '@ant-design/icons';
import { createClient } from '@supabase/supabase-js';
import { useAuth } from '../contexts/AuthContext';
import { LoginForm } from './LoginForm';

const { Option } = Select;

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

  // If not authenticated, show login form
  if (!user) {
    return <LoginForm />;
  }

  // Fetch sources on component mount
  React.useEffect(() => {
    if (user) {
      fetchSources();
    }
  }, [user]);

  const fetchSources = async () => {
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
    }
  };

  const handleSubmit = async () => {
    if (!url || !vendor) {
      message.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('sources')
        .insert([
          {
            url,
            vendor,
            type,
            active: true
          }
        ]);

      if (error) throw error;

      message.success('Source added successfully');
      setUrl('');
      setVendor('');
      fetchSources();
    } catch (error) {
      message.error('Failed to add source');
      console.error('Error adding source:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
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
    },
    {
      title: 'URL',
      dataIndex: 'url',
      key: 'url',
      render: (text: string) => (
        <a href={text} target="_blank" rel="noopener noreferrer">
          {text}
        </a>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
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
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, record: Source) => (
        <Space>
          <Button
            type={record.active ? 'default' : 'primary'}
            onClick={() => handleToggleActive(record)}
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

      <Card title="Add New Source" className="bg-white/10 backdrop-blur-md border-white/20">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              placeholder="Enter URL"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="bg-white/5 border-white/20 text-white"
            />
            <Input
              placeholder="Vendor Name"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="bg-white/5 border-white/20 text-white"
            />
            <Select
              value={type}
              onChange={setType}
              className="w-full"
            >
              <Option value="rss">RSS Feed</Option>
              <Option value="html">HTML Page</Option>
            </Select>
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

      <Card title="Manage Sources" className="bg-white/10 backdrop-blur-md border-white/20">
        <Table
          columns={columns}
          dataSource={sources}
          rowKey="id"
          className="bg-white/5"
        />
      </Card>
    </div>
  );
}; 