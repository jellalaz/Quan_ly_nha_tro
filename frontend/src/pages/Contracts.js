import React, { useState, useEffect, useMemo } from 'react';
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
  const [pageSize, setPageSize] = useState(10);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const roomId = searchParams.get('room');
  const [roomsAll, setRoomsAll] = useState([]);

  // Filter states
  const [filters, setFilters] = useState({
    houseId: null,
    roomId: null,
    status: null,
    tenantName: '',
    startDate: null,
    endDate: null,
  });

  useEffect(() => {
    fetchHouses();
    if (roomId) {
      fetchContractsByRoom(roomId);
    } else {
      fetchAllContracts();
    }
  }, [roomId]);

  useEffect(() => {
    // Load all rooms for name mapping
    (async () => {
      try {
        const allRooms = await roomService.getAll();
        setRoomsAll(allRooms);
      } catch (_) {}
    })();
  }, []);

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

  const handleFilterChange = (changedFields) => {
    setFilters({ ...filters, ...changedFields });
  };

  const handleClearFilters = () => {
    setFilters({
      houseId: null,
      roomId: null,
      status: null,
      tenantName: '',
      startDate: null,
      endDate: null,
    });
    setSearchParams({});
    fetchAllContracts();
  };

  const roomsMap = useMemo(() => {
    const m = {};
    roomsAll.forEach(r => { m[r.room_id] = r; });
    rooms.forEach(r => { m[r.room_id] = r; }); // prefer freshly selected list
    return m;
  }, [roomsAll, rooms]);

  // Filter contracts based on filter state
  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      // Filter by house
      if (filters.houseId) {
        const contractRoom = contract.room || roomsMap[contract.room_id];
        if (!contractRoom || contractRoom.house_id !== filters.houseId) {
          return false;
        }
      }

      // Filter by room
      if (filters.roomId && contract.room_id !== filters.roomId) {
        return false;
      }

      // Filter by status
      if (filters.status !== null && filters.status !== undefined) {
        if (filters.status === 'active' && !contract.is_active) return false;
        if (filters.status === 'inactive' && contract.is_active) return false;
      }

      // Filter by tenant name
      if (filters.tenantName && !contract.tenant_name?.toLowerCase().includes(filters.tenantName.toLowerCase())) {
        return false;
      }

      // Filter by start date
      if (filters.startDate) {
        const contractStart = dayjs(contract.start_date);
        if (contractStart.isBefore(filters.startDate, 'day')) {
          return false;
        }
      }

      // Filter by end date
      if (filters.endDate) {
        const contractEnd = dayjs(contract.end_date);
        if (contractEnd.isAfter(filters.endDate, 'day')) {
          return false;
        }
      }

      return true;
    });
  }, [contracts, filters, roomsMap]);

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
      render: (_, record) => record.room?.name || roomsMap[record.room_id]?.name || 'N/A',
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
      align: 'center',
      width: 260,
      render: (_, record) => (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
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
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card
        title={`Quản lý hợp đồng thuê${roomId ? ` - ${rooms.find(r => r.room_id === parseInt(roomId))?.name}` : ''}`}
        extra={
          <Space>
            <Select
              placeholder="Chọn nhà trọ"
              style={{ width: 200 }}
              allowClear
              onChange={(value) => {
                if (value) {
                  fetchRooms(value);
                  handleFilterChange({ houseId: value });
                } else {
                  setRooms([]);
                  handleFilterChange({ houseId: null });
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
                  handleFilterChange({ roomId: value });
                } else {
                  setSearchParams({});
                  handleFilterChange({ roomId: null });
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
        <Form layout="inline" style={{ marginBottom: 16 }}>
          <Form.Item label="Tên khách thuê">
            <Input
              placeholder="Nhập tên khách thuê"
              value={filters.tenantName}
              onChange={(e) => handleFilterChange({ tenantName: e.target.value })}
            />
          </Form.Item>
          <Form.Item label="Ngày bắt đầu">
            <DatePicker
              style={{ width: 200 }}
              value={filters.startDate}
              onChange={(date) => handleFilterChange({ startDate: date })}
            />
          </Form.Item>
          <Form.Item label="Ngày kết thúc">
            <DatePicker
              style={{ width: 200 }}
              value={filters.endDate}
              onChange={(date) => handleFilterChange({ endDate: date })}
            />
          </Form.Item>
          <Form.Item label="Trạng thái">
            <Select
              placeholder="Chọn trạng thái"
              style={{ width: 200 }}
              allowClear
              value={filters.status}
              onChange={(value) => handleFilterChange({ status: value })}
            >
              <Option value="active">Đang thuê</Option>
              <Option value="inactive">Đã kết thúc</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              onClick={() => {
                setFilters({
                  houseId: null,
                  roomId: null,
                  status: null,
                  tenantName: '',
                  startDate: null,
                  endDate: null,
                });
                setSearchParams({});
              }}
            >
              Xóa bộ lọc
            </Button>
          </Form.Item>
        </Form>

        <Table
          columns={columns}
          dataSource={filteredContracts}
          rowKey="rr_id"
          loading={loading}
          pagination={{
            pageSize: pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onShowSizeChange: (current, size) => setPageSize(size),
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
