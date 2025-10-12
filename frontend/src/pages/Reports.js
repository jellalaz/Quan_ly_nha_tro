import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  DatePicker, 
  Button, 
  Select, 
  Input, 
  message,
  Space,
  Divider,
  Typography,
  Spin
} from 'antd';
import { 
  DollarOutlined, 
  HomeOutlined, 
  UserOutlined, 
  FileTextOutlined,
  SearchOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { reportsService } from '../services/reportsService';
import { aiService } from '../services/aiService';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title } = Typography;

const Reports = () => {
  const [systemOverview, setSystemOverview] = useState({});
  const [revenueStats, setRevenueStats] = useState({});
  const [availableRooms, setAvailableRooms] = useState([]);
  const [expiringContracts, setExpiringContracts] = useState([]);
  const [aiReport, setAiReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Search filters
  const [searchFilters, setSearchFilters] = useState({
    minPrice: 1000000,
    maxPrice: 5000000,
    minCapacity: 1,
    maxCapacity: 4,
    district: ''
  });

  // Date range for reports
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);

  useEffect(() => {
    fetchSystemOverview();
    fetchRevenueStats();
    fetchAvailableRooms();
    fetchExpiringContracts();
  }, []);

  const fetchSystemOverview = async () => {
    try {
      const data = await reportsService.getSystemOverview();
      setSystemOverview(data);
    } catch (error) {
      message.error('Lỗi khi tải tổng quan hệ thống!');
    }
  };

  const fetchRevenueStats = async () => {
    try {
      const data = await reportsService.getRevenueStats(
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD')
      );
      setRevenueStats(data);
    } catch (error) {
      message.error('Lỗi khi tải thống kê doanh thu!');
    }
  };

  const fetchAvailableRooms = async () => {
    try {
      setLoading(true);
      const data = await reportsService.searchAvailableRooms(searchFilters);
      setAvailableRooms(data.rooms || []);
    } catch (error) {
      message.error('Lỗi khi tìm phòng trống!');
    } finally {
      setLoading(false);
    }
  };

  const fetchExpiringContracts = async () => {
    try {
      const data = await reportsService.getExpiringContracts();
      setExpiringContracts(data.expiring_contracts || []);
    } catch (error) {
      message.error('Lỗi khi tải hợp đồng sắp hết hạn!');
    }
  };

  const generateAIReport = async () => {
    try {
      setAiLoading(true);
      const data = await aiService.generateRevenueReport(
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD')
      );
      setAiReport(data.report);
    } catch (error) {
      message.error('Lỗi khi tạo báo cáo AI!');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSearchRooms = () => {
    fetchAvailableRooms();
  };

  const handleCreateMonthlyInvoices = async () => {
    try {
      await reportsService.createMonthlyInvoices();
      message.success('Đã tạo hóa đơn hàng tháng thành công!');
      fetchRevenueStats();
    } catch (error) {
      message.error('Lỗi khi tạo hóa đơn hàng tháng!');
    }
  };

  const availableRoomsColumns = [
    {
      title: 'Phòng',
      dataIndex: 'room_name',
      key: 'room_name',
    },
    {
      title: 'Nhà trọ',
      dataIndex: 'house_name',
      key: 'house_name',
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
      title: 'Khu vực',
      dataIndex: 'district',
      key: 'district',
    },
    {
      title: 'Tài sản',
      dataIndex: 'asset_count',
      key: 'asset_count',
      render: (count) => `${count} tài sản`,
    },
  ];

  const expiringContractsColumns = [
    {
      title: 'Khách thuê',
      dataIndex: 'tenant_name',
      key: 'tenant_name',
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'tenant_phone',
      key: 'tenant_phone',
    },
    {
      title: 'Phòng',
      dataIndex: 'room_name',
      key: 'room_name',
    },
    {
      title: 'Ngày hết hạn',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Còn lại',
      dataIndex: 'days_remaining',
      key: 'days_remaining',
      render: (days) => (
        <span style={{ color: days <= 7 ? 'red' : days <= 15 ? 'orange' : 'green' }}>
          {days} ngày
        </span>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Báo cáo & Phân tích</Title>
      
      {/* System Overview */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tổng nhà trọ"
              value={systemOverview.total_houses}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tỷ lệ lấp đầy"
              value={systemOverview.occupancy_rate}
              suffix="%"
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Hợp đồng đang hoạt động"
              value={systemOverview.active_contracts}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Doanh thu tháng này"
              value={systemOverview.current_month_revenue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#cf1322' }}
              formatter={(value) => `${value.toLocaleString()} VNĐ`}
            />
          </Card>
        </Col>
      </Row>

      {/* Revenue Statistics */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="Thống kê doanh thu" extra={
            <Space>
              <RangePicker 
                value={dateRange}
                onChange={setDateRange}
                format="DD/MM/YYYY"
              />
              <Button onClick={fetchRevenueStats}>Cập nhật</Button>
            </Space>
          }>
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Tổng doanh thu"
                  value={revenueStats.total_revenue}
                  formatter={(value) => `${value.toLocaleString()} VNĐ`}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Hóa đơn đã thanh toán"
                  value={revenueStats.paid_invoices}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Statistic
                  title="Hóa đơn chưa thanh toán"
                  value={revenueStats.pending_invoices}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Doanh thu TB/tháng"
                  value={revenueStats.avg_monthly_revenue}
                  formatter={(value) => `${value.toLocaleString()} VNĐ`}
                  valueStyle={{ color: '#722ed1' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="AI Phân tích doanh thu" extra={
            <Button 
              type="primary" 
              icon={<RobotOutlined />}
              loading={aiLoading}
              onClick={generateAIReport}
            >
              Phân tích AI
            </Button>
          }>
            {aiReport ? (
              <div style={{ 
                fontSize: '14px',
                lineHeight: '1.8',
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '12px',
                backgroundColor: '#f9f9f9',
                borderRadius: '8px',
                border: '1px solid #e8e8e8'
              }}>
                {aiReport.split('\n').map((line, index) => {
                  // Check if line is a header (starts with ##, ###, or bold markers)
                  if (line.trim().startsWith('##')) {
                    return (
                      <h3 key={index} style={{ 
                        color: '#1890ff', 
                        marginTop: index === 0 ? '0' : '16px',
                        marginBottom: '8px',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        {line.replace(/^#+\s*/, '')}
                      </h3>
                    );
                  }
                  // Check if line is a bullet point
                  else if (line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().startsWith('•')) {
                    return (
                      <div key={index} style={{ 
                        marginLeft: '16px',
                        marginBottom: '6px',
                        display: 'flex',
                        alignItems: 'flex-start'
                      }}>
                        <span style={{ color: '#1890ff', marginRight: '8px', fontWeight: 'bold' }}>•</span>
                        <span>{line.replace(/^[-*•]\s*/, '')}</span>
                      </div>
                    );
                  }
                  // Check if line contains bold text (wrapped in ** or __)
                  else if (line.includes('**') || line.includes('__')) {
                    const parts = line.split(/\*\*|__/);
                    return (
                      <p key={index} style={{ marginBottom: '8px' }}>
                        {parts.map((part, i) => 
                          i % 2 === 1 ? <strong key={i} style={{ color: '#1890ff' }}>{part}</strong> : part
                        )}
                      </p>
                    );
                  }
                  // Regular paragraph
                  else if (line.trim()) {
                    return (
                      <p key={index} style={{ marginBottom: '8px', color: '#333' }}>
                        {line}
                      </p>
                    );
                  }
                  // Empty line for spacing
                  return <div key={index} style={{ height: '8px' }} />;
                })}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                <RobotOutlined style={{ fontSize: '48px', marginBottom: '16px', color: '#d9d9d9' }} />
                <p>Nhấn "Phân tích AI" để xem báo cáo thông minh</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Search Available Rooms */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={24}>
          <Card title="Tìm phòng trống phù hợp" extra={
            <Button 
              type="primary" 
              icon={<SearchOutlined />}
              loading={loading}
              onClick={handleSearchRooms}
            >
              Tìm kiếm
            </Button>
          }>
            <Space wrap style={{ marginBottom: 16 }}>
              <Input
                placeholder="Giá tối thiểu"
                type="number"
                value={searchFilters.minPrice}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, minPrice: parseInt(e.target.value) || 0 }))}
                style={{ width: 120 }}
              />
              <Input
                placeholder="Giá tối đa"
                type="number"
                value={searchFilters.maxPrice}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, maxPrice: parseInt(e.target.value) || 0 }))}
                style={{ width: 120 }}
              />
              <Input
                placeholder="Sức chứa tối thiểu"
                type="number"
                value={searchFilters.minCapacity}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, minCapacity: parseInt(e.target.value) || 1 }))}
                style={{ width: 120 }}
              />
              <Input
                placeholder="Sức chứa tối đa"
                type="number"
                value={searchFilters.maxCapacity}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) || 1 }))}
                style={{ width: 120 }}
              />
              <Input
                placeholder="Quận/Huyện"
                value={searchFilters.district}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, district: e.target.value }))}
                style={{ width: 150 }}
              />
            </Space>
            <Table
              columns={availableRoomsColumns}
              dataSource={availableRooms}
              rowKey="room_id"
              loading={loading}
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>

      {/* Expiring Contracts */}
      <Row gutter={16}>
        <Col span={24}>
          <Card title="Hợp đồng sắp hết hạn" extra={
            <Button onClick={fetchExpiringContracts}>Làm mới</Button>
          }>
            <Table
              columns={expiringContractsColumns}
              dataSource={expiringContracts}
              rowKey="rr_id"
              pagination={{ pageSize: 5 }}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Reports;
