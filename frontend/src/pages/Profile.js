import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Typography, Descriptions, message } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import { authService } from '../services/authService';

const { Title } = Typography;

const Profile = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const loadUser = async () => {
    try {
      const u = await authService.getCurrentUser();
      setUser(u);
      form.setFieldsValue({
        fullname: u.fullname,
        phone: u.phone,
        email: u.email,
      });
    } catch (e) {
      message.error('Không tải được thông tin người dùng');
    }
  };

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await authService.updateProfile({
        fullname: values.fullname,
        phone: values.phone,
        email: values.email,
      });
      message.success('Cập nhật thông tin thành công');
      await loadUser();
    } catch (err) {
      const res = err?.response;
      const status = res?.status;
      const data = res?.data;
      if (status === 422 && Array.isArray(data?.detail)) {
        const msgs = data.detail.map((e) => e.msg).filter(Boolean);
        message.error(msgs.join('\n') || 'Dữ liệu không hợp lệ');
      } else if (status === 400) {
        const detail = typeof data?.detail === 'string' ? data.detail : '';
        if (detail === 'Email already registered') {
          message.error('Email đã được sử dụng.');
          form.setFields([{ name: 'email', errors: ['Email đã được sử dụng.'] }]);
        } else if (detail === 'Phone already registered') {
          message.error('Số điện thoại đã được sử dụng.');
          form.setFields([{ name: 'phone', errors: ['Số điện thoại đã được sử dụng.'] }]);
        } else if (detail === 'Email or Phone already registered') {
          message.error('Email hoặc số điện thoại đã tồn tại.');
          form.setFields([
            { name: 'email', errors: ['Email hoặc số điện thoại đã tồn tại.'] },
            { name: 'phone', errors: ['Email hoặc số điện thoại đã tồn tại.'] },
          ]);
        } else {
          message.error(detail || 'Cập nhật thất bại');
        }
      } else {
        message.error('Cập nhật thất bại');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={3}>Thông tin cá nhân</Title>

      {user && (
        <Card style={{ marginBottom: 24 }}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="ID người dùng">{user.owner_id}</Descriptions.Item>
            <Descriptions.Item label="Vai trò">{user.role?.authority}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">{user.is_active ? 'Hoạt động' : 'Không hoạt động'}</Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {user.created_at ? new Date(user.created_at).toLocaleString('vi-VN') : '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Card title="Chỉnh sửa thông tin">
        <Form layout="vertical" form={form} onFinish={onFinish}>
          <Form.Item
            name="fullname"
            label="Họ và tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ và tên' }, { min: 3, message: 'Tối thiểu 3 ký tự' }]}
          >
            <Input prefix={<UserOutlined />} placeholder="Họ và tên" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }, { pattern: /^\d{10,11}$/, message: 'Số điện thoại không hợp lệ (10-11 chữ số)' }]}
          >
            <Input prefix={<PhoneOutlined />} placeholder="Số điện thoại" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email', message: 'Email không hợp lệ' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="Email" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Lưu thay đổi
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Profile;

