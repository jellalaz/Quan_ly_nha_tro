import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, App } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { authService } from '../services/authService';

const { Title } = Typography;

const Register = () => {
  const { message } = App.useApp(); // Use App context for message
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = async (values) => {
    if (values.password !== values.confirmPassword) {
      message.error('Mật khẩu xác nhận không khớp');
      return;
    }
    setLoading(true);
    try {
      const { fullname, phone, email, password } = values;
      await authService.register({ fullname, phone, email, password });
      message.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      const res = err?.response;
      const status = res?.status;
      const data = res?.data;

      // 422: FastAPI validation errors
      if (status === 422 && Array.isArray(data?.detail)) {
        const msgs = data.detail.map((e) => e.msg).filter(Boolean);
        const combined = msgs.join('\n');
        message.error(combined || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
      } else if (status === 400) {
        // 400: Often duplicate or bad request; surface detail if possible
        let detailText = '';
        if (typeof data?.detail === 'string') detailText = data.detail;
        else if (Array.isArray(data?.detail)) detailText = data.detail.map((e) => e.msg).join('\n');
        else if (typeof data === 'string') detailText = data; // e.g., HTML/text body

        const dupMap = {
          'Email already registered': 'Email đã được sử dụng.',
          'Phone already registered': 'Số điện thoại đã được sử dụng.',
          'Email or Phone already registered': 'Email hoặc số điện thoại đã tồn tại.'
        };

        if (detailText in dupMap) {
          const vi = dupMap[detailText];
          message.error(vi);
          // Inline errors on fields for better UX
          const fields = [];
          if (detailText.includes('Email')) fields.push({ name: 'email', errors: [vi] });
          if (detailText.includes('Phone')) fields.push({ name: 'phone', errors: [vi] });
          if (fields.length === 0) fields.push({ name: 'email', errors: [vi] }, { name: 'phone', errors: [vi] });
          form.setFields(fields);
        } else if (detailText) {
          message.error(detailText);
        } else {
          const vi = 'Dữ liệu đã tồn tại trong hệ thống hoặc không hợp lệ.';
          message.error(vi);
          form.setFields([
            { name: 'email', errors: [vi] },
            { name: 'phone', errors: [vi] }
          ]);
        }
      } else {
        // Other statuses or missing response
        const fallback = (typeof data?.detail === 'string' && data.detail) ||
                         (typeof data === 'string' && data) ||
                         err?.message ||
                         'Đăng ký thất bại. Vui lòng thử lại.';
        message.error(fallback);
      }
    } finally {
      setLoading(false);
    }
  };

  // Strong password helper validator
  const passwordRules = [
    { required: true, message: 'Vui lòng nhập mật khẩu' },
    { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
    ({ getFieldValue }) => ({
      validator(_, value) {
        if (!value) return Promise.resolve();
        const hasUpper = /[A-Z]/.test(value);
        const hasLower = /[a-z]/.test(value);
        const hasDigit = /\d/.test(value);
        const hasSpecial = /[^A-Za-z0-9]/.test(value);
        if (hasUpper && hasLower && hasDigit && hasSpecial) return Promise.resolve();
        return Promise.reject(
          new Error('Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt')
        );
      },
    }),
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 60px',
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
        width: '420px',
        zIndex: 1,
        color: 'white',
        textShadow: '2px 2px 12px rgba(0,0,0,0.7)',
        padding: '40px',
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
          Tham gia cùng<br />Chúng tôi
        </h1>
        <p style={{
          fontSize: '22px',
          marginBottom: '36px',
          color: '#ffffff',
          lineHeight: '1.6',
          fontWeight: '400',
          textShadow: '2px 2px 10px rgba(0,0,0,0.7)'
        }}>
          Quản lý nhà trọ chuyên nghiệp và hiệu quả
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
            <span>Quản lý nhà & phòng trọ</span>
          </div>
          <div style={{
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>✓</span>
            <span>Hợp đồng & hóa đơn</span>
          </div>
          <div style={{
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>✓</span>
            <span>Quản lý tài sản</span>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span style={{ fontSize: '24px' }}>✓</span>
            <span>Báo cáo & AI hỗ trợ</span>
          </div>
        </div>
      </div>

      {/* Register Card - Right Side */}
      <Card style={{
        width: 480,
        boxShadow: '0 12px 48px rgba(0,0,0,0.3)',
        zIndex: 1,
        position: 'relative',
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        padding: '16px 25px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <Title level={2} style={{
            color: '#1890ff',
            marginBottom: '4px',
            fontSize: '30px',
            fontWeight: '600'
          }}>
            Đăng ký tài khoản
          </Title>
          <p style={{
            color: '#666',
            marginBottom: 0,
            fontSize: '15px'
          }}>
            Điền thông tin để tạo tài khoản chủ trọ
          </p>
        </div>

        <style>
          {`
            .ant-form-vertical .ant-form-item-label {
              padding-bottom: 2px;
            }
          `}
        </style>
        <Form layout="vertical" form={form} onFinish={onFinish} size="large" style={{ fontSize: '16px' }}>
          <Form.Item
            label={<span style={{ fontSize: '16px', fontWeight: '500' }}>Họ và tên</span>}
            name="fullname"
            rules={[
              { required: true, message: 'Vui lòng nhập họ và tên' },
              { min: 3, message: 'Họ tên phải có ít nhất 3 ký tự' }
            ]}
            style={{ marginBottom: '6px' }}
          >
            <Input
              prefix={<UserOutlined style={{ fontSize: '18px' }} />}
              placeholder="Ví dụ: Nguyễn Văn A"
              style={{
                fontSize: '16px',
                padding: '10px 14px',
                height: '44px'
              }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '16px', fontWeight: '500' }}>Số điện thoại</span>}
            name="phone"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              { pattern: /^\d{10,11}$/, message: 'Số điện thoại không hợp lệ (10-11 chữ số)' }
            ]}
            style={{ marginBottom: '6px' }}
          >
            <Input
              prefix={<PhoneOutlined style={{ fontSize: '18px' }} />}
              placeholder="Ví dụ: 0912345678"
              style={{
                fontSize: '16px',
                padding: '10px 14px',
                height: '44px'
              }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '16px', fontWeight: '500' }}>Email</span>}
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
            style={{ marginBottom: '6px' }}
          >
            <Input
              prefix={<MailOutlined style={{ fontSize: '18px' }} />}
              placeholder="you@example.com"
              style={{
                fontSize: '16px',
                padding: '10px 14px',
                height: '44px'
              }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '16px', fontWeight: '500' }}>Mật khẩu</span>}
            name="password"
            rules={passwordRules}
            hasFeedback
            style={{ marginBottom: '6px' }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ fontSize: '18px' }} />}
              placeholder="Nhập mật khẩu"
              style={{
                fontSize: '16px',
                padding: '10px 14px',
                height: '44px'
              }}
            />
          </Form.Item>

          <Form.Item
            label={<span style={{ fontSize: '16px', fontWeight: '500' }}>Xác nhận mật khẩu</span>}
            name="confirmPassword"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Vui lòng xác nhận mật khẩu' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                },
              }),
            ]}
            style={{ marginBottom: '6px' }}
          >
            <Input.Password
              prefix={<LockOutlined style={{ fontSize: '18px' }} />}
              placeholder="Nhập lại mật khẩu"
              style={{
                fontSize: '16px',
                padding: '10px 14px',
                height: '44px'
              }}
            />
          </Form.Item>

          <Form.Item style={{ marginTop: '16px', marginBottom: '4px' }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{
                width: '100%',
                height: '44px',
                fontSize: '17px',
                fontWeight: '600'
              }}
            >
              Đăng ký
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <Button
            type="link"
            onClick={() => navigate('/login')}
            style={{ fontSize: '15px' }}
          >
            Đã có tài khoản? Đăng nhập
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Register;
