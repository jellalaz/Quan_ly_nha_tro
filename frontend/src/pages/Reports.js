import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  DatePicker,
  Button,
  message,
  Space,
  Typography
} from 'antd';
import {
  DollarOutlined,
  HomeOutlined,
  UserOutlined,
  FileTextOutlined,
  RobotOutlined
} from '@ant-design/icons';
import { reportsService } from '../services/reportsService';
import { aiService } from '../services/aiService';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const Reports = () => {
  const [systemOverview, setSystemOverview] = useState({});
  const [revenueStats, setRevenueStats] = useState({});
  const [aiReport, setAiReport] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Date range for reports
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);

  useEffect(() => {
    fetchSystemOverview();
    fetchRevenueStats();
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
                  else if (line.trim()) {
                    return (
                      <p key={index} style={{ marginBottom: '8px', color: '#333' }}>
                        {line}
                      </p>
                    );
                  }
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
    </div>
  );
};

export default Reports;