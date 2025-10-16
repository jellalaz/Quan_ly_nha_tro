import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message,
  Space,
  Popconfirm,
  Tag
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined 
} from '@ant-design/icons';
import { ownerService } from '../services/ownerService';
import { useNavigate } from 'react-router-dom';

const Owners = () => {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOwner, setEditingOwner] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOwners();
  }, []);

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const data = await ownerService.getAll();
      setOwners(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách chủ trọ!');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingOwner(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingOwner(record);
    form.setFieldsValue({
      fullname: record.fullname,
      phone: record.phone,
      email: record.email,
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await ownerService.delete(id);
      message.success('Xóa chủ trọ thành công!');
      fetchOwners();
    } catch (error) {
      message.error('Lỗi khi xóa chủ trọ!');
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingOwner) {
        const updateData = {
          fullname: values.fullname,
          phone: values.phone,
          email: values.email,
        };
        await ownerService.update(editingOwner.owner_id, updateData);
        message.success('Cập nhật chủ trọ thành công!');
      } else {
        if (!values.password) {
          message.error('Vui lòng nhập mật khẩu!');
          return;
        }
        await ownerService.create(values);
        message.success('Tạo tài khoản chủ trọ thành công!');
      }
      setModalVisible(false);
      fetchOwners();
    } catch (error) {
      const res = error?.response;
      const status = res?.status;
      const data = res?.data;

      if (status === 422 && Array.isArray(data?.detail)) {
        const antFields = data.detail
          .filter(Boolean)
          .map((e) => ({
            name: e?.loc?.[e.loc.length - 1] || 'fullname',
            errors: [e?.msg || 'Dữ liệu không hợp lệ']
          }));
        if (antFields.length) form.setFields(antFields);
        const msgs = data.detail.map((e) => e.msg).filter(Boolean).join('\n');
        message.error(msgs || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.');
      } else if (status === 400) {
        let detailText = '';
        if (typeof data?.detail === 'string') detailText = data.detail;
        else if (Array.isArray(data?.detail)) detailText = data.detail.map((e) => e.msg).join('\n');
        else if (typeof data === 'string') detailText = data;

        const dupMap = {
          'Email already registered': 'Email đã được sử dụng.',
          'Phone already registered': 'Số điện thoại đã được sử dụng.',
          'Email or Phone already registered': 'Email hoặc số điện thoại đã tồn tại.'
        };

        if (detailText in dupMap) {
          const vi = dupMap[detailText];
          message.error(vi);
          const fields = [];
          if (detailText.includes('Email')) fields.push({ name: 'email', errors: [vi] });
          if (detailText.includes('Phone')) fields.push({ name: 'phone', errors: [vi] });
          if (!fields.length) fields.push({ name: 'email', errors: [vi] }, { name: 'phone', errors: [vi] });
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
        message.error('Lưu thất bại. Vui lòng thử lại.');
      }
    }
  };

  const handleViewDetails = (record) => {
    navigate(`/owners/${record.owner_id}`);
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'owner_id',
      key: 'owner_id',
      width: 80,
    },
    {
      title: 'Họ tên',
      dataIndex: 'fullname',
      key: 'fullname',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Không hoạt động'}
        </Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '-',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            Chi tiết
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa chủ trọ này?"
            description="Hành động này sẽ xóa tất cả dữ liệu liên quan đến chủ trọ."
            onConfirm={() => handleDelete(record.owner_id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Quản lý chủ trọ"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Tạo tài khoản chủ trọ
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={owners}
          rowKey="owner_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Tổng cộng ${total} chủ trọ`,
          }}
        />
      </Card>

      <Modal
        title={editingOwner ? 'Sửa thông tin chủ trọ' : 'Tạo tài khoản chủ trọ'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="fullname"
            label="Họ tên"
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }, { min: 3, message: 'Họ tên phải có ít nhất 3 ký tự' }]}
          >
            <Input placeholder="Nhập họ tên chủ trọ" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại!' },
              { pattern: /^\d{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
            ]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: 'Vui lòng nhập email!' },
              { type: 'email', message: 'Email không hợp lệ!' }
            ]}
          >
            <Input placeholder="Nhập email" disabled={!!editingOwner} />
          </Form.Item>

          {!editingOwner && (
            <Form.Item
              name="password"
              label="Mật khẩu"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 8, message: 'Mật khẩu tối thiểu 8 ký tự' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value) return Promise.resolve();
                    const hasUpper = /[A-Z]/.test(value);
                    const hasLower = /[a-z]/.test(value);
                    const hasDigit = /\d/.test(value);
                    const hasSpecial = /[^A-Za-z0-9]/.test(value);
                    if (hasUpper && hasLower && hasDigit && hasSpecial) return Promise.resolve();
                    return Promise.reject(new Error('Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt'));
                  },
                })
              ]}
            >
              <Input.Password placeholder="Nhập mật khẩu" />
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingOwner ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Owners;
