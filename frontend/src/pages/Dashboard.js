import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Button, Tag } from 'antd';
import {
  BankOutlined, 
  ShopOutlined, 
  UserOutlined, 
  DollarOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { houseService } from '../services/houseService';
import { roomService } from '../services/roomService';
import { rentedRoomService } from '../services/rentedRoomService';
import { invoiceService } from '../services/invoiceService';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalHouses: 0,
    totalRooms: 0,
    totalRentedRooms: 0,
    totalPendingInvoices: 0,
  });
  const [recentData, setRecentData] = useState([]);
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
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
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

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
      align: 'center',
      width: 200,
      render: (_, record) => (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/rooms?house=${record.house_id}`)}
          >
            Xem chi tiết
          </Button>
        </div>
      ),
    },
  ];

  const calcTotal = (inv) => (
    Number(inv?.price || 0) +
    Number(inv?.water_price || 0) +
    Number(inv?.internet_price || 0) +
    Number(inv?.general_price || 0) +
    Number(inv?.electricity_price || 0)
  );

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
      render: (_, record) => `${calcTotal(record).toLocaleString()} VNĐ`,
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
        Dashboard - Chủ trọ
      </h2>
      
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
    </div>
  );
};

export default Dashboard;
