import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table,
  Tag,
  Progress,
  message
} from 'antd';
import { 
  BankOutlined, 
  ShopOutlined, 
  UserOutlined, 
  DollarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons';
import { adminService } from '../services/adminService';
import { ownerService } from '../services/ownerService';

const AdminReports = () => {
  const [statistics, setStatistics] = useState(null);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [stats, ownersData] = await Promise.all([
        adminService.getStatistics(),
        ownerService.getAll()
      ]);
      
      setStatistics(stats);
      setOwners(ownersData);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu báo cáo!');
    } finally {
      setLoading(false);
    }
  };

  const ownerColumns = [
    {
      title: 'Chủ trọ',
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
        <Tag color={isActive ? 'green' : 'red'} icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
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
  ];

  if (loading || !statistics) {
    return <div>Đang tải...</div>;
  }

  return (
    <div>
      <h2 style={{ marginBottom: 24 }}>Báo cáo & Phân tích hệ thống</h2>

      {/* Overall Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng số chủ trọ"
              value={statistics.total_owners}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng số nhà trọ"
              value={statistics.total_houses}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng số phòng"
              value={statistics.total_rooms}
              prefix={<ShopOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Phòng đang thuê"
              value={statistics.total_rented_rooms}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Revenue Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Tổng doanh thu"
              value={statistics.total_revenue}
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
              value={statistics.pending_revenue}
              prefix={<DollarOutlined />}
              suffix="VNĐ"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Hóa đơn chưa thanh toán"
              value={statistics.pending_invoices}
              suffix={`/ ${statistics.total_invoices}`}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Occupancy Rate */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="Tỷ lệ lấp đầy phòng">
            <Progress
              type="circle"
              percent={statistics.occupancy_rate}
              format={(percent) => `${percent}%`}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
              style={{ display: 'flex', justifyContent: 'center' }}
            />
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <p>
                <strong>{statistics.total_rented_rooms}</strong> phòng đang thuê / 
                <strong> {statistics.total_rooms}</strong> tổng số phòng
              </p>
              <p>
                <strong>{statistics.available_rooms}</strong> phòng còn trống
              </p>
            </div>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="Thống kê hóa đơn">
            <div style={{ padding: '20px 0' }}>
              <Row gutter={16}>
                <Col span={12}>
                  <Statistic
                    title="Tổng số hóa đơn"
                    value={statistics.total_invoices}
                    valueStyle={{ fontSize: 32 }}
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="Chưa thanh toán"
                    value={statistics.pending_invoices}
                    valueStyle={{ fontSize: 32, color: '#cf1322' }}
                  />
                </Col>
              </Row>
              <div style={{ marginTop: 20 }}>
                <Progress
                  percent={((statistics.total_invoices - statistics.pending_invoices) / statistics.total_invoices * 100).toFixed(1)}
                  status="active"
                  strokeColor="#52c41a"
                />
                <p style={{ marginTop: 8, textAlign: 'center' }}>
                  Tỷ lệ thanh toán: <strong>
                    {((statistics.total_invoices - statistics.pending_invoices) / statistics.total_invoices * 100).toFixed(1)}%
                  </strong>
                </p>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Owners List */}
      <Row gutter={16}>
        <Col span={24}>
          <Card title="Danh sách chủ trọ">
            <Table
              columns={ownerColumns}
              dataSource={owners}
              rowKey="owner_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Tổng cộng ${total} chủ trọ`,
              }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default AdminReports;
