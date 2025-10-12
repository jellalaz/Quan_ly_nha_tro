import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  DatePicker, 
  InputNumber,
  message,
  Space,
  Popconfirm,
  Tag,
  Row,
  Col,
  Select
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { rentedRoomService } from '../services/rentedRoomService';
import { roomService } from '../services/roomService';
import { houseService } from '../services/houseService';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { Option } = Select;

const Contracts = () => {
  const [contracts, setContracts] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const roomId = searchParams.get('room');

  useEffect(() => {
    fetchHouses();
    if (roomId) {
      fetchContractsByRoom(roomId);
    } else {
      fetchAllContracts();
    }
  }, [roomId]);

  const fetchHouses = async () => {
    try {
      const data = await houseService.getAll();
      setHouses(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách nhà trọ!');
    }
  };

  const fetchRooms = async (houseId) => {
    try {
      const data = await roomService.getByHouse(houseId);
      setRooms(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách phòng!');
    }
  };

  const fetchContractsByRoom = async (roomId) => {
    setLoading(true);
    try {
      const data = await rentedRoomService.getByRoom(roomId);
      setContracts(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách hợp đồng!');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllContracts = async () => {
    setLoading(true);
    try {
      const data = await rentedRoomService.getAll();
      setContracts(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách hợp đồng!');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingContract(null);
    form.resetFields();
    if (roomId) {
      form.setFieldsValue({ room_id: parseInt(roomId) });
    }
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingContract(record);
    form.setFieldsValue({
      ...record,
      start_date: dayjs(record.start_date),
      end_date: dayjs(record.end_date),
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await rentedRoomService.terminate(id);
      message.success('Chấm dứt hợp đồng thành công!');
      if (roomId) {
        fetchContractsByRoom(roomId);
      } else {
        fetchAllContracts();
      }
    } catch (error) {
      message.error('Lỗi khi chấm dứt hợp đồng!');
    }
  };

  const handleSubmit = async (values) => {
    try {
      const submitData = {
        ...values,
        start_date: values.start_date.format('YYYY-MM-DD'),
        end_date: values.end_date.format('YYYY-MM-DD'),
      };

      if (editingContract) {
        await rentedRoomService.update(editingContract.rr_id, submitData);
        message.success('Cập nhật hợp đồng thành công!');
      } else {
        await rentedRoomService.create(submitData);
        message.success('Tạo hợp đồng thành công!');
      }
      setModalVisible(false);
      if (roomId) {
        fetchContractsByRoom(roomId);
      } else {
        fetchAllContracts();
      }
    } catch (error) {
      message.error('Lỗi khi lưu hợp đồng!');
    }
  };

  const columns = [
    {
      title: 'Tên khách thuê',
      dataIndex: 'tenant_name',
      key: 'tenant_name',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'tenant_phone',
      key: 'tenant_phone',
    },
    {
      title: 'Số người',
      dataIndex: 'number_of_tenants',
      key: 'number_of_tenants',
      render: (value) => `${value} người`,
    },
    {
      title: 'Phòng',
      dataIndex: 'room',
      key: 'room',
      render: (room) => room?.name || 'N/A',
    },
    {
      title: 'Tiền thuê/tháng',
      dataIndex: 'monthly_rent',
      key: 'monthly_rent',
      render: (price) => `${price.toLocaleString()} VNĐ`,
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'start_date',
      key: 'start_date',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Ngày kết thúc',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (active) => (
        <Tag color={active ? 'green' : 'red'}>
          {active ? 'Đang thuê' : 'Đã kết thúc'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Space size="small">
          <Button 
            type="link" 
            icon={<FileTextOutlined />}
            onClick={() => navigate(`/invoices?contract=${record.rr_id}`)}
          >
            Hóa đơn
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          {record.is_active && (
            <Popconfirm
              title="Bạn có chắc chắn muốn chấm dứt hợp đồng này?"
              onConfirm={() => handleDelete(record.rr_id)}
              okText="Có"
              cancelText="Không"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                Chấm dứt
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={`Quản lý hợp đồng thuê${roomId ? ` - ${rooms.find(r => r.room_id == roomId)?.name}` : ''}`}
        extra={
          <Space>
            <Select
              placeholder="Chọn nhà trọ"
              style={{ width: 200 }}
              allowClear
              onChange={(value) => {
                if (value) {
                  fetchRooms(value);
                } else {
                  setRooms([]);
                }
              }}
            >
              {houses.map(house => (
                <Option key={house.house_id} value={house.house_id}>
                  {house.name}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="Chọn phòng"
              style={{ width: 200 }}
              allowClear
              disabled={!rooms.length}
              onChange={(value) => {
                if (value) {
                  setSearchParams({ room: value });
                } else {
                  setSearchParams({});
                }
              }}
            >
              {rooms.map(room => (
                <Option key={room.room_id} value={room.room_id}>
                  {room.name}
                </Option>
              ))}
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Tạo hợp đồng mới
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={contracts}
          rowKey="rr_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Tổng cộng ${total} hợp đồng`,
          }}
        />
      </Card>

      <Modal
        title={editingContract ? 'Sửa hợp đồng' : 'Tạo hợp đồng mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="tenant_name"
                label="Tên khách thuê"
                rules={[{ required: true, message: 'Vui lòng nhập tên khách thuê!' }]}
              >
                <Input placeholder="Nhập tên khách thuê" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="tenant_phone"
                label="Số điện thoại"
                rules={[{ required: true, message: 'Vui lòng nhập số điện thoại!' }]}
              >
                <Input placeholder="Nhập số điện thoại" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="number_of_tenants"
                label="Số người thuê"
                rules={[{ required: true, message: 'Vui lòng nhập số người thuê!' }]}
              >
                <InputNumber 
                  min={1} 
                  max={10} 
                  style={{ width: '100%' }}
                  placeholder="Số người"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="monthly_rent"
                label="Tiền thuê/tháng (VNĐ)"
                rules={[{ required: true, message: 'Vui lòng nhập tiền thuê!' }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  placeholder="Tiền thuê"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="deposit"
                label="Tiền cọc (VNĐ)"
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  placeholder="Tiền cọc"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="water_price"
                label="Giá tiền nước (VNĐ)"
                rules={[{ required: true, message: 'Vui lòng nhập giá tiền nước!' }]}
                initialValue={80000}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  placeholder="Giá tiền nước"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="internet_price"
                label="Giá tiền wifi (VNĐ)"
                rules={[{ required: true, message: 'Vui lòng nhập giá tiền wifi!' }]}
                initialValue={100000}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  placeholder="Giá tiền wifi"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="general_price"
                label="Giá dịch vụ chung (VNĐ)"
                rules={[{ required: true, message: 'Vui lòng nhập giá dịch vụ!' }]}
                initialValue={100000}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  placeholder="Giá dịch vụ"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="initial_electricity_num"
                label="Số điện ban đầu (kWh)"
                rules={[{ required: true, message: 'Vui lòng nhập số điện ban đầu!' }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  placeholder="Số điện ban đầu"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="electricity_unit_price"
                label="Đơn giá điện (VNĐ/kWh)"
                rules={[{ required: true, message: 'Vui lòng nhập đơn giá điện!' }]}
                initialValue={3500}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  placeholder="Đơn giá điện"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="start_date"
                label="Ngày bắt đầu"
                rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu!' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="end_date"
                label="Ngày kết thúc"
                rules={[{ required: true, message: 'Vui lòng chọn ngày kết thúc!' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="room_id"
            label="Phòng"
            rules={[{ required: true, message: 'Vui lòng chọn phòng!' }]}
          >
            <Select placeholder="Chọn phòng" disabled={!!roomId}>
              {rooms.map(room => (
                <Option key={room.room_id} value={room.room_id}>
                  {room.name} - {room.house?.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="contract_url"
            label="Link hợp đồng"
          >
            <Input placeholder="Nhập link hợp đồng (nếu có)" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingContract ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Contracts;
