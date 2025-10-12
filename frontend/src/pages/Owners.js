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
        // Update owner - only send allowed fields
        const updateData = {
          fullname: values.fullname,
          phone: values.phone,
          email: values.email,
        };
        await ownerService.update(editingOwner.owner_id, updateData);
        message.success('Cập nhật chủ trọ thành công!');
      } else {
        // Create owner - must include password
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
      const errorMsg = error.response?.data?.detail || 'Lỗi khi lưu thông tin chủ trọ!';
      message.error(errorMsg);
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
            rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}
          >
            <Input placeholder="Nhập họ tên chủ trọ" />
          </Form.Item>

          <Form.Item
            name="phone"
            label="Số điện thoại"
            rules={[
              { required: true, message: 'Vui lòng nhập số điện thoại!' },
              { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ!' }
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
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
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
