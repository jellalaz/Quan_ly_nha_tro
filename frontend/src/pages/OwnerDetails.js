import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Descriptions, 
  Table, 
  Button, 
  Tag, 
  message, 
  Spin,
  Row,
  Col,
  Statistic
} from 'antd';
import { 
  ArrowLeftOutlined, 
  BankOutlined,
  ShopOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { ownerService } from '../services/ownerService';

const OwnerDetails = () => {
  const { ownerId } = useParams();
  const navigate = useNavigate();
  const [owner, setOwner] = useState(null);
  const [houses, setHouses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOwnerDetails();
  }, [ownerId]);

  const fetchOwnerDetails = async () => {
    setLoading(true);
    try {
      const [ownerData, housesData] = await Promise.all([
        ownerService.getById(ownerId),
        ownerService.getHouses(ownerId)
      ]);
      
      setOwner(ownerData);
      setHouses(housesData);
    } catch (error) {
      message.error('Lỗi khi tải thông tin chủ trọ!');
      navigate('/owners');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const totalHouses = houses.length;
    const totalRooms = houses.reduce((sum, house) => {
      // Count rooms from the house if available
      return sum + (house.rooms?.length || 0);
    }, 0);

    return { totalHouses, totalRooms };
  };

  const houseColumns = [
    {
      title: 'ID',
      dataIndex: 'house_id',
      key: 'house_id',
      width: 80,
    },
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
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '-',
    },
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!owner) {
    return null;
  }

  const stats = calculateStats();

  return (
    <div>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/owners')}
        style={{ marginBottom: 16 }}
      >
        Quay lại danh sách chủ trọ
      </Button>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Thông tin chủ trọ">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="ID">
                {owner.owner_id}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={owner.is_active ? 'green' : 'red'}>
                  {owner.is_active ? 'Hoạt động' : 'Không hoạt động'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Họ tên">
                {owner.fullname}
              </Descriptions.Item>
              <Descriptions.Item label="Số điện thoại">
                {owner.phone}
              </Descriptions.Item>
              <Descriptions.Item label="Email" span={2}>
                {owner.email}
              </Descriptions.Item>
              <Descriptions.Item label="Vai trò">
                <Tag color="blue">{owner.role?.authority?.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Ngày tạo">
                {owner.created_at ? new Date(owner.created_at).toLocaleString('vi-VN') : '-'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="Tổng số nhà trọ"
              value={stats.totalHouses}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="Tổng số phòng"
              value={stats.totalRooms}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Danh sách nhà trọ">
        <Table
          columns={houseColumns}
          dataSource={houses}
          rowKey="house_id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Tổng cộng ${total} nhà trọ`,
          }}
        />
      </Card>
    </div>
  );
};

export default OwnerDetails;
