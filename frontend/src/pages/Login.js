import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const { Title } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp(); // Dùng message từ App context để hiển thị thông báo

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authService.login(values.email, values.password);
      message.success('Đăng nhập thành công!');
      navigate('/dashboard');
    } catch (error) {
      message.error('Email hoặc mật khẩu không đúng!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: 'linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #4facfe)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite'
    }}>
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.7; }
            50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
          }
          @keyframes float2 {
            0%, 100% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0.5; }
            33% { transform: translateY(-30px) translateX(20px) rotate(120deg); opacity: 0.8; }
            66% { transform: translateY(-10px) translateX(-20px) rotate(240deg); opacity: 0.6; }
          }
          .bubble {
            position: absolute;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            pointer-events: none;
          }
          .bubble1 {
            width: 80px;
            height: 80px;
            top: 10%;
            left: 10%;
            animation: float 6s ease-in-out infinite;
          }
          .bubble2 {
            width: 120px;
            height: 120px;
            top: 60%;
            left: 80%;
            animation: float2 8s ease-in-out infinite;
          }
          .bubble3 {
            width: 60px;
            height: 60px;
            top: 80%;
            left: 20%;
            animation: float 7s ease-in-out infinite 1s;
          }
          .bubble4 {
            width: 100px;
            height: 100px;
            top: 20%;
            left: 75%;
            animation: float2 9s ease-in-out infinite 2s;
          }
          .bubble5 {
            width: 70px;
            height: 70px;
            top: 50%;
            left: 5%;
            animation: float 5s ease-in-out infinite 1.5s;
          }
        `}
      </style>
      <div className="bubble bubble1"></div>
      <div className="bubble bubble2"></div>
      <div className="bubble bubble3"></div>
      <div className="bubble bubble4"></div>
      <div className="bubble bubble5"></div>
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.15)', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#1890ff' }}>
            Quản lý nhà trọ
          </Title>
          <p style={{ color: '#666', marginBottom: 0 }}>
            Đăng nhập vào hệ thống
          </p>
        </div>
        
        <Form
          name="login"
          onFinish={onFinish}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Email" 
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="Mật khẩu"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{ width: '100%' }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 8 }}>
          <Button type="link" onClick={() => navigate('/register')}>
            Chưa có tài khoản? Đăng ký
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
