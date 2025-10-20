import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  App, // Import App
  Space,
  Popconfirm,
  Tag,
  Row,
  Col
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { roomService } from '../services/roomService';
import { houseService } from '../services/houseService';
import { assetService } from '../services/assetService';

const { TextArea } = Input;
const { Option } = Select;

const Rooms = () => {
  const { message } = App.useApp(); // Use hook to get message
  const [rooms, setRooms] = useState([]);
  const [houses, setHouses] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [assetModalVisible, setAssetModalVisible] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 5,
    showSizeChanger: true,
    pageSizeOptions: ['5', '10', '20', '50'],
    showQuickJumper: true,
    showTotal: (total) => `Tổng cộng ${total} phòng`,
  });
  const [form] = Form.useForm();
  const [assetForm] = Form.useForm();
  const navigate = useNavigate();

  const houseId = searchParams.get('house');

  useEffect(() => {
    fetchHouses();
    if (houseId) {
      fetchRooms(houseId);
    } else {
      fetchAllRooms();
    }
  }, [houseId]);

  const fetchHouses = async () => {
    try {
      const data = await houseService.getAll();
      setHouses(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách nhà trọ!');
    }
  };

  const fetchRooms = async (houseId) => {
    setLoading(true);
    try {
      const data = await roomService.getByHouse(houseId);
      setRooms(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách phòng!');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRooms = async () => {
    setLoading(true);
    try {
      const data = await roomService.getAll();
      setRooms(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách phòng!');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async (roomId) => {
    try {
      const data = await assetService.getByRoom(roomId);
      setAssets(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách tài sản!');
    }
  };

  const handleTableChange = (pagination) => {
    setPagination(pagination);
  };

  const handleCreate = () => {
    setEditingRoom(null);
    form.resetFields();
    if (houseId) {
      form.setFieldsValue({ house_id: parseInt(houseId) });
    }
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingRoom(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await roomService.delete(id, { message });
      message.success('Xóa phòng thành công!');
      if (houseId) {
        fetchRooms(houseId);
      } else {
        fetchAllRooms();
      }
    } catch (error) {
      // Error message is handled by the service/interceptor now
      console.error('Delete room error:', error);
    }
  };

  const handleSubmit = async (values) => {
    try {
      if (editingRoom) {
        await roomService.update(editingRoom.room_id, values);
        message.success('Cập nhật phòng thành công!');
      } else {
        await roomService.create(values);
        message.success('Tạo phòng thành công!');
      }
      setModalVisible(false);
      if (houseId) {
        fetchRooms(houseId);
      } else {
        fetchAllRooms();
      }
    } catch (error) {
      message.error('Lỗi khi lưu phòng!');
    }
  };

  const handleViewAssets = (record) => {
    setSelectedRoom(record);
    fetchAssets(record.room_id);
    setAssetModalVisible(true);
  };

  const handleAddAsset = async (values) => {
    try {
      await assetService.create({
        ...values,
        room_id: selectedRoom.room_id
      });
      message.success('Thêm tài sản thành công!');
      assetForm.resetFields();
      fetchAssets(selectedRoom.room_id);
    } catch (error) {
      message.error('Lỗi khi thêm tài sản!');
    }
  };

  const handleDeleteAsset = async (id) => {
    try {
      await assetService.delete(id);
      message.success('Xóa tài sản thành công!');
      fetchAssets(selectedRoom.room_id);
    } catch (error) {
      message.error('Lỗi khi xóa tài sản!');
    }
  };

  const housesById = useMemo(() => {
    const m = {};
    houses.forEach(h => { m[h.house_id] = h; });
    return m;
  }, [houses]);

  const columns = [
    {
      title: 'Tên phòng',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Sức chứa',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (value) => `${value} người`,
    },
    {
      title: 'Giá thuê',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `${price.toLocaleString()} VNĐ`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_available',
      key: 'is_available',
      render: (available) => (
        <Tag color={available ? 'green' : 'red'}>
          {available ? 'Trống' : 'Đã thuê'}
        </Tag>
      ),
    },
    {
      title: 'Nhà trọ',
      dataIndex: 'house',
      key: 'house',
      render: (_, record) => (record.house?.name) || housesById[record.house_id]?.name || 'N/A',
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      width: 280,
      render: (_, record) => (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Button
            type="link"
            icon={<HomeOutlined />}
            onClick={() => handleViewAssets(record)}
          >
            Tài sản
          </Button>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/contracts?room=${record.room_id}`)}
          >
            Hợp đồng
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa phòng này?"
            onConfirm={() => handleDelete(record.room_id)}
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
        title={`Quản lý phòng trọ${houseId ? ` - ${houses.find(h => h.house_id == houseId)?.name}` : ''}`}
        extra={
          <Space>
            {!houseId && (
              <Select
                placeholder="Chọn nhà trọ"
                style={{ width: 200 }}
                allowClear
                onChange={(value) => {
                  if (value) {
                    setSearchParams({ house: value });
                  } else {
                    setSearchParams({});
                  }
                }}
              >
                {houses.map(house => (
                  <Option key={house.house_id} value={house.house_id}>
                    {house.name}
                  </Option>
                ))}
              </Select>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Tạo phòng mới
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={rooms}
          rowKey="room_id"
          loading={loading}
          pagination={pagination}
          onChange={handleTableChange}
        />
      </Card>

      <Modal
        title={editingRoom ? 'Sửa phòng' : 'Tạo phòng mới'}
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
            label="Tên phòng"
            rules={[{ required: true, message: 'Vui lòng nhập tên phòng!' }]}
          >
            <Input placeholder="Nhập tên phòng (VD: P101)" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="capacity"
                label="Sức chứa"
                rules={[{ required: true, message: 'Vui lòng nhập sức chứa!' }]}
              >
                <InputNumber
                  min={1}
                  max={10}
                  style={{ width: '100%' }}
                  placeholder="Số người"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="price"
                label="Giá thuê (VNĐ)"
                rules={[{ required: true, message: 'Vui lòng nhập giá thuê!' }]}
              >
                <InputNumber
                  min={0}
                  style={{ width: '100%' }}
                  placeholder="Giá thuê"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="house_id"
            label="Nhà trọ"
            rules={[{ required: true, message: 'Vui lòng chọn nhà trọ!' }]}
          >
            <Select placeholder="Chọn nhà trọ" disabled={!!houseId}>
              {houses.map(house => (
                <Option key={house.house_id} value={house.house_id}>
                  {house.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
          >
            <TextArea
              rows={3}
              placeholder="Mô tả phòng trọ"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingRoom ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={`Tài sản phòng ${selectedRoom?.name}`}
        open={assetModalVisible}
        onCancel={() => setAssetModalVisible(false)}
        footer={null}
        width={800}
      >
        <div style={{ marginBottom: 16 }}>
          <Form
            form={assetForm}
            layout="inline"
            onFinish={handleAddAsset}
            style={{ marginBottom: 16 }}
          >
            <Form.Item
              name="name"
              rules={[{ required: true, message: 'Vui lòng nhập tên tài sản!' }]}
            >
              <Input placeholder="Tên tài sản" style={{ width: 200 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit">
                Thêm tài sản
              </Button>
            </Form.Item>
          </Form>
        </div>

        <Table
          columns={[
            { title: 'Tên tài sản', dataIndex: 'name', key: 'name' },
            {
              title: 'Hành động',
              key: 'action',
              render: (_, record) => (
                <Popconfirm
                  title="Xóa tài sản này?"
                  onConfirm={() => handleDeleteAsset(record.asset_id)}
                  okText="Có"
                  cancelText="Không"
                >
                  <Button type="link" danger size="small">
                    Xóa
                  </Button>
                </Popconfirm>
              ),
            },
          ]}
          dataSource={assets}
          rowKey="asset_id"
          size="small"
          pagination={false}
        />
      </Modal>
    </div>
  );
};

export default Rooms;
