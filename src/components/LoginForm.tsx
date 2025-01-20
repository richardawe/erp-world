import React, { useState } from 'react';
import { Card, Input, Button, message } from 'antd';
import { useAuth } from '../contexts/AuthContext';
import { LockOutlined, UserOutlined } from '@ant-design/icons';

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      message.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      message.success('Logged in successfully');
    } catch (error) {
      message.error('Failed to log in. Please check your credentials.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card 
        title="Admin Login" 
        className="w-full max-w-md bg-white/10 backdrop-blur-md border-white/20"
        headStyle={{ borderBottom: '1px solid rgba(255, 255, 255, 0.2)', color: 'white' }}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-white/5 border-white/20 text-white"
            />
          </div>
          <div>
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-white/20 text-white"
            />
          </div>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            className="w-full"
          >
            Log In
          </Button>
        </form>
      </Card>
    </div>
  );
}; 