import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { authService } from '../services/authService';

const { Title } = Typography;

const Register = () => {
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
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 480, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Title level={2} style={{ color: '#1890ff' }}>
            Đăng ký tài khoản
          </Title>
          <p style={{ color: '#666', marginBottom: 0 }}>
            Điền thông tin để tạo tài khoản chủ trọ
          </p>
        </div>

        <Form layout="vertical" form={form} onFinish={onFinish} size="large">
          <Form.Item
            label="Họ và tên"
            name="fullname"
            rules={[
              { required: true, message: 'Vui lòng nhập họ và tên' },
              { min: 3, message: 'Họ tên phải có ít nhất 3 ký tự' }
            ]}
          >
            <Input prefix={<UserOutlined />} placeholder="Ví dụ: Nguyễn Văn A" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại' },
              { pattern: /^\d{10,11}$/, message: 'Số điện thoại không hợp lệ (10-11 chữ số)' }
            ]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="Ví dụ: 0912345678" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: 'Vui lòng nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="you@example.com" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={passwordRules}
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập mật khẩu" />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
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
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
              Đăng ký
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Button type="link" onClick={() => navigate('/login')}>
            Đã có tài khoản? Đăng nhập
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Register;
