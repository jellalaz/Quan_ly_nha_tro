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
      justifyContent: 'space-between',
      padding: '40px 60px',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: '#000000'
    }}>
      {/* 3D Background using iframe to isolate errors */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <iframe
          src="https://my.spline.design/r4xbot-OaKDFcUbSxFFfqVeaB8uvzNg/"
          frameBorder="0"
          width="100%"
          height="100%"
          style={{
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0
          }}
          title="3D Background"
        />
      </div>

      {/* Welcome Text - Left Side */}
      <div style={{
        width: '378px',
        zIndex: 1,
        color: 'white',
        textShadow: '2px 2px 12px rgba(0,0,0,0.7)',
        padding: '36px',
        backgroundColor: 'rgba(24, 144, 255, 0.55)',
        borderRadius: '24px',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        boxShadow: '0 12px 48px rgba(24, 144, 255, 0.2)'
      }}>
        <h1 style={{
          fontSize: '42px',
          fontWeight: '700',
          marginBottom: '24px',
          color: '#ffffff',
          lineHeight: '1.2',
          letterSpacing: '-1px',
          textShadow: '3px 3px 15px rgba(0,0,0,0.8)'
        }}>
          Quản lý<br />Nhà trọ Thông minh
        </h1>
        <p style={{
          fontSize: '22px',
          marginBottom: '36px',
          color: '#ffffff',
          lineHeight: '1.6',
          fontWeight: '400',
          textShadow: '2px 2px 10px rgba(0,0,0,0.7)'
        }}>
          Giải pháp quản lý toàn diện cho chủ nhà trọ
        </p>
        <div style={{
          fontSize: '20px',
          color: '#ffffff',
          lineHeight: '2'
        }}>
          <div style={{
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>✓</span>
            <span>Quản lý phòng & hợp đồng</span>
          </div>
          <div style={{
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>✓</span>
            <span>Tính hóa đơn tự động</span>
          </div>
          <div style={{
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>✓</span>
            <span>Theo dõi tài sản</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>✓</span>
            <span>Báo cáo doanh thu</span>
          </div>
        </div>
      </div>

      {/* Login Card - Right Side */}
      <Card style={{
        width: 450,
        boxShadow: '0 12px 48px rgba(0,0,0,0.3)',
        zIndex: 1,
        position: 'relative',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        padding: '36px 27px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Title level={2} style={{
            color: '#1890ff',
            marginBottom: '16px',
            fontSize: '42px',
            fontWeight: '600'
          }}>
            Quản lý nhà trọ
          </Title>
          <p style={{
            color: '#666',
            marginBottom: 0,
            fontSize: '20px'
          }}>
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
              prefix={<UserOutlined style={{ fontSize: '22px' }} />}
              placeholder="Email"
              style={{
                fontSize: '20px',
                padding: '16px 20px',
                height: '60px'
              }}
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ fontSize: '22px' }} />}
              placeholder="Mật khẩu"
              style={{
                fontSize: '20px',
                padding: '16px 20px',
                height: '60px'
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: '32px' }}>
            <Button
              type="primary" 
              htmlType="submit" 
              loading={loading}
              style={{
                width: '100%',
                height: '50px',
                fontSize: '18px',
                fontWeight: '600'
              }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Button
            type="link"
            onClick={() => navigate('/register')}
            style={{ fontSize: '18px' }}
          >
            Chưa có tài khoản? Đăng ký
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Login;
