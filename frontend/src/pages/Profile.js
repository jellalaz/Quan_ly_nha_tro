import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Button, Typography, Descriptions, App } from 'antd';
import { UserOutlined, MailOutlined, PhoneOutlined, LockOutlined } from '@ant-design/icons';
import { authService } from '../services/authService';

const { Title } = Typography;

const Profile = () => {
  const [form] = Form.useForm();
  const [pwdForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);
  const [user, setUser] = useState(null);
  const { message } = App.useApp(); // Dùng message từ App context để hiển thị thông báo

  // Tải thông tin người dùng hiện tại
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

  // Lưu thay đổi thông tin (email KHÔNG cho phép chỉnh sửa)
  const onFinish = async (values) => {
    setLoading(true);
    try {
      // Không gửi email lên server để tránh bị cập nhật
      await authService.updateProfile({
        fullname: values.fullname,
        phone: values.phone,
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
        if (detail === 'Phone already registered') {
          message.error('Số điện thoại đã được sử dụng.');
          form.setFields([{ name: 'phone', errors: ['Số điện thoại đã được sử dụng.'] }]);
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

  // Đổi mật khẩu
  const onChangePassword = async (values) => {
    setPwdLoading(true);
    try {
      await authService.changePassword(values.old_password, values.new_password);
      message.success('Đổi mật khẩu thành công');
      pwdForm.resetFields();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === 'string') {
        message.error(detail);
      } else if (Array.isArray(err?.response?.data?.detail)) {
        const msgs = err.response.data.detail.map((e) => e.msg).filter(Boolean);
        message.error(msgs.join('\n') || 'Đổi mật khẩu thất bại');
      } else {
        message.error('Đổi mật khẩu thất bại');
      }
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div>
      <Title level={3}>Thông tin cá nhân</Title>

      {/* Thông tin tổng quan người dùng */}
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

      <Card title="Chỉnh sửa thông tin" style={{ marginBottom: 24 }}>
        {/* Form chỉnh sửa thông tin: KHÔNG cho phép sửa email */}
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
            label="Email (không thể chỉnh sửa)"
          >
            <Input prefix={<MailOutlined />} placeholder="Email" disabled readOnly />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              Lưu thay đổi
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Đổi mật khẩu">
        {/* Form đổi mật khẩu */}
        <Form layout="vertical" form={pwdForm} onFinish={onChangePassword}>
          <Form.Item
            name="old_password"
            label="Mật khẩu hiện tại"
            rules={[{ required: true, message: 'Vui lòng nhập mật khẩu hiện tại' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu hiện tại" />
          </Form.Item>

          <Form.Item
            name="new_password"
            label="Mật khẩu mới"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu mới' },
              { min: 8, message: 'Tối thiểu 8 ký tự' },
              // Gợi ý quy tắc mạnh hơn để phù hợp với backend
              { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).+$/, message: 'Phải có chữ hoa, chữ thường, số và ký tự đặc biệt' },
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Mật khẩu mới" />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label="Nhập lại mật khẩu mới"
            dependencies={["new_password"]}
            rules={[
              { required: true, message: 'Vui lòng nhập lại mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Mật khẩu nhập lại không khớp'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Nhập lại mật khẩu mới" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={pwdLoading}>
              Đổi mật khẩu
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Profile;

