import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Table, 
  DatePicker, 
  Button, 
  Input,
  message,
  Space,
  Typography,
  Spin,
  Form,
  InputNumber
} from 'antd';
import { 
  DollarOutlined, 
  HomeOutlined, 
  UserOutlined, 
  FileTextOutlined,
  SearchOutlined,
  RobotOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { reportsService } from '../services/reportsService';
import { aiService } from '../services/aiService';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const Reports = () => {
  const [systemOverview, setSystemOverview] = useState({});
  const [revenueStats, setRevenueStats] = useState({});
  const [availableRooms, setAvailableRooms] = useState([]);
  const [expiringContracts, setExpiringContracts] = useState([]);
  const [aiReport, setAiReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [searchForm] = Form.useForm();

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
    // Initialize form with default filters
    searchForm.setFieldsValue(searchFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const start = dateRange?.[0]?.format('YYYY-MM-DD');
      const end = dateRange?.[1]?.format('YYYY-MM-DD');
      if (!start || !end) return;
      const data = await reportsService.getRevenueStats(start, end);
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
      const start = dateRange?.[0]?.format('YYYY-MM-DD');
      const end = dateRange?.[1]?.format('YYYY-MM-DD');
      if (!start || !end) {
        message.warning('Vui lòng chọn khoảng thời gian hợp lệ.');
        return;
      }
      const data = await aiService.generateRevenueReport(start, end);
      setAiReport(data?.report || '');
    } catch (error) {
      message.error('Lỗi khi tạo báo cáo AI!');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSearchRooms = () => {
    fetchAvailableRooms();
  };

  const handleResetFilters = () => {
    const defaults = {
      minPrice: 1000000,
      maxPrice: 5000000,
      minCapacity: 1,
      maxCapacity: 4,
      district: ''
    };
    setSearchFilters(defaults);
    searchForm.setFieldsValue(defaults);
    fetchAvailableRooms();
  };

  const availableRoomsColumns = [
    {
      title: 'Phòng',
      dataIndex: 'room_name',
      key: 'room_name',
      render: (val) => val || '-'
    },
    {
      title: 'Nhà trọ',
      dataIndex: 'house_name',
      key: 'house_name',
      render: (val) => val || '-'
    },
    {
      title: 'Sức chứa',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (value) => (typeof value === 'number' ? `${value} người` : '-')
    },
    {
      title: 'Giá thuê',
      dataIndex: 'price',
      key: 'price',
      render: (price) => (typeof price === 'number' ? `${price.toLocaleString()} VNĐ` : '-')
    },
    {
      title: 'Khu vực',
      dataIndex: 'district',
      key: 'district',
      render: (val) => val || '-'
    },
    {
      title: 'Tài sản',
      dataIndex: 'asset_count',
      key: 'asset_count',
      render: (count) => (typeof count === 'number' ? `${count} tài sản` : '0 tài sản')
    },
  ];

  const expiringContractsColumns = [
    {
      title: 'Khách thuê',
      dataIndex: 'tenant_name',
      key: 'tenant_name',
      render: (val) => val || '-'
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'tenant_phone',
      key: 'tenant_phone',
      render: (val) => val || '-'
    },
    {
      title: 'Phòng',
      dataIndex: 'room_name',
      key: 'room_name',
      render: (val) => val || '-'
    },
    {
      title: 'Ngày hết hạn',
      dataIndex: 'end_date',
      key: 'end_date',
      render: (date) => (date ? new Date(date).toLocaleDateString('vi-VN') : '-')
    },
    {
      title: 'Còn lại',
      dataIndex: 'days_remaining',
      key: 'days_remaining',
      render: (days) => (
        typeof days === 'number' ? (
          <span style={{ color: days <= 7 ? 'red' : days <= 15 ? 'orange' : 'green' }}>
            {days} ngày
          </span>
        ) : '-'
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
              value={systemOverview.total_houses ?? 0}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Tỷ lệ lấp đầy"
              value={systemOverview.occupancy_rate ?? 0}
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
              value={systemOverview.active_contracts ?? 0}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Doanh thu tháng này"
              value={systemOverview.current_month_revenue ?? 0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#cf1322' }}
              formatter={(value) => `${(Number(value) || 0).toLocaleString()} VNĐ`}
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
                  value={revenueStats.total_revenue ?? 0}
                  formatter={(value) => `${(Number(value) || 0).toLocaleString()} VNĐ`}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Hóa đơn đã thanh toán"
                  value={revenueStats.paid_invoices ?? 0}
                  valueStyle={{ color: '#1890ff' }}
                />
              </Col>
            </Row>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <Statistic
                  title="Hóa đơn chưa thanh toán"
                  value={revenueStats.pending_invoices ?? 0}
                  valueStyle={{ color: '#cf1322' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Doanh thu TB/tháng"
                  value={revenueStats.avg_monthly_revenue ?? 0}
                  formatter={(value) => `${(Number(value) || 0).toLocaleString()} VNĐ`}
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
            <Space>
              <Button
                type="default"
                icon={<ReloadOutlined />}
                onClick={handleResetFilters}
              >
                Đặt lại
              </Button>
              <Button
                type="primary"
                icon={<SearchOutlined />}
                loading={loading}
                onClick={handleSearchRooms}
              >
                Tìm kiếm
              </Button>
            </Space>
          }>
            <Form
              form={searchForm}
              layout="inline"
              onValuesChange={(_, allValues) => {
                setSearchFilters({
                  minPrice: allValues.minPrice ?? 0,
                  maxPrice: allValues.maxPrice ?? 0,
                  minCapacity: allValues.minCapacity ?? 1,
                  maxCapacity: allValues.maxCapacity ?? 1,
                  district: allValues.district ?? ''
                });
              }}
              style={{ marginBottom: 16 }}
            >
              <Form.Item label="Giá tối thiểu" name="minPrice">
                <InputNumber
                  style={{ width: 160 }}
                  min={0}
                  step={50000}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value ? Number(value.replace(/,/g, '')) : 0}
                  placeholder="VD: 1,000,000"
                  onPressEnter={handleSearchRooms}
                />
              </Form.Item>
              <Form.Item label="Giá tối đa" name="maxPrice">
                <InputNumber
                  style={{ width: 160 }}
                  min={0}
                  step={50000}
                  formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(value) => value ? Number(value.replace(/,/g, '')) : 0}
                  placeholder="VD: 5,000,000"
                  onPressEnter={handleSearchRooms}
                />
              </Form.Item>
              <Form.Item label="Sức chứa từ" name="minCapacity">
                <InputNumber style={{ width: 120 }} min={1} max={20} onPressEnter={handleSearchRooms} />
              </Form.Item>
              <Form.Item label="đến" name="maxCapacity">
                <InputNumber style={{ width: 120 }} min={1} max={20} onPressEnter={handleSearchRooms} />
              </Form.Item>
              <Form.Item label="Khu vực" name="district">
                <Input style={{ width: 180 }} placeholder="Quận/Huyện" onPressEnter={handleSearchRooms} />
              </Form.Item>
            </Form>

            {loading ? (
              <div style={{ padding: '24px 0', textAlign: 'center' }}>
                <Spin />
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 8, color: '#666' }}>
                  Tổng kết quả: <strong>{availableRooms?.length || 0}</strong> phòng
                </div>
                <Table
                  columns={availableRoomsColumns}
                  dataSource={availableRooms}
                  rowKey="room_id"
                  pagination={{ pageSize: 5 }}
                  size="small"
                />
              </>
            )}
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
