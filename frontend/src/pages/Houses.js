import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  App, // Import App
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
import { houseService } from '../services/houseService';
import { useNavigate } from 'react-router-dom';

const Houses = () => {
  const { message } = App.useApp(); // Use hook to get message
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHouse, setEditingHouse] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    showSizeChanger: true,
    pageSizeOptions: ['5', '10', '20', '50'],
    showQuickJumper: true,
    showTotal: (total) => `Tổng cộng ${total} nhà trọ`,
  });
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    fetchHouses();
  }, []);

  const fetchHouses = async () => {
    setLoading(true);
    try {
      const data = await houseService.getAll();
      setHouses(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách nhà trọ!');
    } finally {
      setLoading(false);
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleCreate = () => {
    setEditingHouse(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingHouse(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await houseService.delete(id, { message });
      message.success('Xóa nhà trọ thành công!');
      fetchHouses();
    } catch (error) {
      // Error is now handled by the interceptor
      console.error('Delete house error:', error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingHouse) {
        await houseService.update(editingHouse.house_id, values);
        message.success('Cập nhật nhà trọ thành công!');
      } else {
        await houseService.create(values);
        message.success('Tạo nhà trọ thành công!');
      }
      setModalVisible(false);
      fetchHouses();
    } catch (error) {
      message.error('Lỗi khi lưu nhà trọ!');
    }
  };

  const columns = [
    {
      title: 'Tên nhà trọ',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Số tầng',
      dataIndex: 'floor_count',
      key: 'floor_count',
      render: (value) => `${value} tầng`,
    },
    {
      title: 'Phường/Xã',
      dataIndex: 'ward',
      key: 'ward',
    },
    {
      title: 'Quận/Huyện',
      dataIndex: 'district',
      key: 'district',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address_line',
      key: 'address_line',
      ellipsis: true,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      width: 260,
      render: (_, record) => (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/rooms?house=${record.house_id}`)}
          >
            Xem phòng
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa nhà trọ này?"
            onConfirm={() => handleDelete(record.house_id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Quản lý nhà trọ"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Tạo nhà trọ mới
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={houses}
          rowKey="house_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editingHouse ? 'Sửa nhà trọ' : 'Tạo nhà trọ mới'}
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
            name="name"
            label="Tên nhà trọ"
            rules={[{ required: true, message: 'Vui lòng nhập tên nhà trọ!' }]}
          >
            <Input placeholder="Nhập tên nhà trọ" />
          </Form.Item>

          <Form.Item
            name="floor_count"
            label="Số tầng"
            rules={[{ required: true, message: 'Vui lòng nhập số tầng!' }]}
          >
            <InputNumber
              min={1}
              max={20}
              style={{ width: '100%' }}
              placeholder="Nhập số tầng"
            />
          </Form.Item>

          <Form.Item
            name="ward"
            label="Phường/Xã"
            rules={[{ required: true, message: 'Vui lòng nhập phường/xã!' }]}
          >
            <Input placeholder="Nhập phường/xã" />
          </Form.Item>

          <Form.Item
            name="district"
            label="Quận/Huyện"
            rules={[{ required: true, message: 'Vui lòng nhập quận/huyện!' }]}
          >
            <Input placeholder="Nhập quận/huyện" />
          </Form.Item>

          <Form.Item
            name="address_line"
            label="Địa chỉ chi tiết"
            rules={[{ required: true, message: 'Vui lòng nhập địa chỉ!' }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Nhập địa chỉ chi tiết"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingHouse ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Houses;
