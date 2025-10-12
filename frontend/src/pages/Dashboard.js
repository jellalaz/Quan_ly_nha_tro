import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Tag, Button } from 'antd';
import { 
  BankOutlined, 
  ShopOutlined, 
  UserOutlined, 
  DollarOutlined,
  EyeOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { houseService } from '../services/houseService';
import { roomService } from '../services/roomService';
import { rentedRoomService } from '../services/rentedRoomService';
import { invoiceService } from '../services/invoiceService';
import { ownerService } from '../services/ownerService';
import { authService } from '../services/authService';
import { adminService } from '../services/adminService';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalHouses: 0,
    totalRooms: 0,
    totalRentedRooms: 0,
    totalPendingInvoices: 0,
    totalOwners: 0,
  });
  const [recentData, setRecentData] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isAdmin = authService.isAdmin();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      if (isAdmin) {
        // Admin dashboard - show full system statistics
        const [statistics, owners] = await Promise.all([
          adminService.getStatistics(),
          ownerService.getAll()
        ]);
        
        setStats({
          totalOwners: statistics.total_owners,
          totalHouses: statistics.total_houses,
          totalRooms: statistics.total_rooms,
          totalRentedRooms: statistics.total_rented_rooms,
          totalPendingInvoices: statistics.pending_invoices,
          availableRooms: statistics.available_rooms,
          totalRevenue: statistics.total_revenue,
          pendingRevenue: statistics.pending_revenue,
          occupancyRate: statistics.occupancy_rate,
        });
        
        setRecentData(owners.slice(0, 5));
      } else {
        // Owner dashboard - show houses and invoices
        const [houses, rooms, rentedRooms, invoices] = await Promise.all([
          houseService.getAll(),
          roomService.getAll(),
          rentedRoomService.getAll(),
          invoiceService.getPending(),
        ]);

        setStats({
          totalHouses: houses.length,
          totalRooms: rooms.length,
          totalRentedRooms: rentedRooms.length,
          totalPendingInvoices: invoices.length,
        });

        setRecentData(houses.slice(0, 5));
        setPendingInvoices(invoices.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const ownerColumns = [
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
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
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
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => navigate(`/owners/${record.owner_id}`)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  const houseColumns = [
    {
      title: 'Tên nhà trọ',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address_line',
      key: 'address_line',
      ellipsis: true,
    },
    {
      title: 'Số tầng',
      dataIndex: 'floor_count',
      key: 'floor_count',
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<EyeOutlined />}
          onClick={() => navigate(`/rooms?house=${record.house_id}`)}
        >
          Xem chi tiết
        </Button>
      ),
    },
  ];

  const invoiceColumns = [
    {
      title: 'Mã hóa đơn',
      dataIndex: 'invoice_id',
      key: 'invoice_id',
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'price',
      key: 'price',
      render: (price) => `${price.toLocaleString()} VNĐ`,
    },
    {
      title: 'Ngày đến hạn',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: () => <Tag color="red">Chưa thanh toán</Tag>,
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>
        {isAdmin ? 'Dashboard - Quản trị viên' : 'Dashboard - Chủ trọ'}
      </h2>
      
      {isAdmin ? (
        // Admin Dashboard
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Tổng số chủ trọ"
                  value={stats.totalOwners}
                  prefix={<TeamOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Tổng số nhà trọ"
                  value={stats.totalHouses}
                  prefix={<BankOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Tổng số phòng"
                  value={stats.totalRooms}
                  prefix={<ShopOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Phòng đang thuê"
                  value={stats.totalRentedRooms}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Tổng doanh thu"
                  value={stats.totalRevenue}
                  prefix={<DollarOutlined />}
                  suffix="VNĐ"
                  valueStyle={{ color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Doanh thu chờ thu"
                  value={stats.pendingRevenue}
                  prefix={<DollarOutlined />}
                  suffix="VNĐ"
                  valueStyle={{ color: '#faad14' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card>
                <Statistic
                  title="Tỷ lệ lấp đầy"
                  value={stats.occupancyRate}
                  suffix="%"
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Card title="Danh sách chủ trọ gần đây">
                <Table
                  columns={ownerColumns}
                  dataSource={recentData}
                  rowKey="owner_id"
                  pagination={false}
                  loading={loading}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </>
      ) : (
        // Owner Dashboard
        <>
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Tổng số nhà trọ"
                  value={stats.totalHouses}
                  prefix={<BankOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Tổng số phòng"
                  value={stats.totalRooms}
                  prefix={<ShopOutlined />}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Phòng đang thuê"
                  value={stats.totalRentedRooms}
                  prefix={<UserOutlined />}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Hóa đơn chưa thanh toán"
                  value={stats.totalPendingInvoices}
                  prefix={<DollarOutlined />}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Card title="Nhà trọ gần đây" style={{ height: 400 }}>
                <Table
                  columns={houseColumns}
                  dataSource={recentData}
                  rowKey="house_id"
                  pagination={false}
                  loading={loading}
                  size="small"
                />
              </Card>
            </Col>
            <Col span={12}>
              <Card title="Hóa đơn chưa thanh toán" style={{ height: 400 }}>
                <Table
                  columns={invoiceColumns}
                  dataSource={pendingInvoices}
                  rowKey="invoice_id"
                  pagination={false}
                  loading={loading}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;
