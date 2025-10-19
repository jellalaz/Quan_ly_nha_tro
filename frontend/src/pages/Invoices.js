import React, { useState, useEffect, useMemo } from 'react';
import {
  Card, 
  Table, 
  Button, 
  Modal, 
  Form, 
  DatePicker,
  InputNumber,
  message,
  Space,
  Popconfirm,
  Tag,
  Row,
  Col,
  Select,
  Divider
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  CheckOutlined,
  FilePdfOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import { invoiceService } from '../services/invoiceService';
import { rentedRoomService } from '../services/rentedRoomService';
import { roomService } from '../services/roomService';
import dayjs from 'dayjs';

const { Option } = Select;

const Invoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm();
  const [viewInvoiceModal, setViewInvoiceModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [electricityUnitPrice, setElectricityUnitPrice] = useState(3500); // Default price per kWh
  const [previousElectricityNum, setPreviousElectricityNum] = useState(0);
  const [roomsAll, setRoomsAll] = useState([]);

  const contractId = searchParams.get('contract');

  useEffect(() => {
    fetchContracts();
    if (contractId) {
      fetchInvoicesByContract(contractId);
    } else {
      fetchAllInvoices();
    }
  }, [contractId]);

  useEffect(() => {
    // Load rooms for UI labels
    (async () => {
      try {
        const allRooms = await roomService.getAll();
        setRoomsAll(allRooms);
      } catch (_) {}
    })();
  }, []);

  const roomsMap = useMemo(() => {
    const m = {};
    roomsAll.forEach(r => { m[r.room_id] = r; });
    return m;
  }, [roomsAll]);

  const contractsMap = useMemo(() => {
    const m = {};
    contracts.forEach(c => { m[c.rr_id] = c; });
    return m;
  }, [contracts]);

  const fetchContracts = async () => {
    try {
      const data = await rentedRoomService.getAll();
      setContracts(data.filter(contract => contract.is_active));
    } catch (error) {
      message.error('Lỗi khi tải danh sách hợp đồng!');
    }
  };

  const fetchInvoicesByContract = async (contractId) => {
    setLoading(true);
    try {
      const data = await invoiceService.getByRentedRoom(contractId);
      setInvoices(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách hóa đơn!');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllInvoices = async () => {
    setLoading(true);
    try {
      const data = await invoiceService.getAll();
      setInvoices(data);
    } catch (error) {
      message.error('Lỗi khi tải danh sách hóa đơn!');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setEditingInvoice(null);
    form.resetFields();
    
    if (contractId) {
      const cid = Number(contractId);
      form.setFieldsValue({ rr_id: cid });

      // Get contract details and previous invoices
      const contract = contracts.find(c => c.rr_id === cid);
      if (contract) {
        // Set prices from contract
        form.setFieldsValue({ 
          price: contract.monthly_rent,
          water_price: contract.water_price || 80000,
          internet_price: contract.internet_price || 100000,
          general_price: contract.general_price || 100000
        });

        // Set electricity unit price from contract
        setElectricityUnitPrice(contract.electricity_unit_price || 3500);

        // Get previous invoices to determine current previous meter reading
        try {
          const previousInvoices = await invoiceService.getByRentedRoom(cid);
          let prevReading = Number(contract.initial_electricity_num || 0);

          if (previousInvoices && previousInvoices.length > 0) {
            const totalUsage = previousInvoices.reduce((sum, inv) => sum + Number(inv.electricity_num || 0), 0);
            prevReading += totalUsage;
          }

          setPreviousElectricityNum(prevReading);
          form.setFieldsValue({
            previous_electricity_num: prevReading
          });
        } catch (error) {
          console.error('Error fetching previous invoices:', error);
        }
      }
    }
    setModalVisible(true);
  };

  const handleEdit = (record) => {
    setEditingInvoice(record);
    // Set unit price from the related contract if available
    const contract = contracts.find(c => c.rr_id === record.rr_id);
    if (contract) {
      setElectricityUnitPrice(contract.electricity_unit_price || 3500);
    }
    // In edit mode, we only know the used kWh (electricity_num). Treat previous as 0 and current as usage for UI.
    setPreviousElectricityNum(0);
    form.setFieldsValue({
      ...record,
      previous_electricity_num: 0,
      current_electricity_num: record.electricity_num || 0,
      electricity_price: record.electricity_price || 0,
      due_date: dayjs(record.due_date),
      payment_date: record.payment_date ? dayjs(record.payment_date) : null,
    });
    setModalVisible(true);
  };

  const handlePay = async (id) => {
    try {
      await invoiceService.pay(id);
      message.success('Thanh toán thành công!');
      if (contractId) {
        fetchInvoicesByContract(contractId);
      } else {
        fetchAllInvoices();
      }
    } catch (error) {
      message.error('Lỗi khi thanh toán!');
    }
  };

  const handleSubmit = async (values) => {
    try {
      // Derive electricity usage (kWh) and ensure only backend-allowed fields are sent
      const prevNum = Number(values.previous_electricity_num || 0);
      const currNum = Number(values.current_electricity_num || 0);
      const usage = currNum >= prevNum ? (currNum - prevNum) : Number(values.electricity_num || 0);

      const basePayload = {
        price: Number(values.price || 0),
        water_price: Number(values.water_price || 0),
        internet_price: Number(values.internet_price || 0),
        general_price: Number(values.general_price || 0),
        electricity_price: Number(values.electricity_price || 0),
        electricity_num: Number(usage || 0),
        water_num: Number(values.water_num || 0),
        due_date: values.due_date ? values.due_date.format('YYYY-MM-DDTHH:mm:ss') : undefined,
        payment_date: values.payment_date ? values.payment_date.format('YYYY-MM-DDTHH:mm:ss') : undefined,
      };

      if (editingInvoice) {
        await invoiceService.update(editingInvoice.invoice_id, basePayload);
        message.success('Cập nhật hóa đơn thành công!');
      } else {
        const createPayload = { rr_id: values.rr_id, ...basePayload };
        const created = await invoiceService.create(createPayload);
        message.success('Tạo hóa đơn thành công!');
        // Show the created invoice (use result which already includes details)
        setSelectedInvoice(created);
        setViewInvoiceModal(true);
      }
      setModalVisible(false);
      if (contractId) {
        fetchInvoicesByContract(Number(contractId));
      } else {
        fetchAllInvoices();
      }
    } catch (error) {
      message.error('Lỗi khi lưu hóa đơn!');
    }
  };

  const calculateTotal = (values) => (
    (values.price || 0) +
    (values.water_price || 0) +
    (values.internet_price || 0) +
    (values.general_price || 0) +
    (values.electricity_price || 0)
  );

  const handleElectricityChange = (currentNum) => {
    if (currentNum === null || currentNum === undefined) return;
    if (currentNum >= previousElectricityNum) {
      const usage = currentNum - previousElectricityNum;
      const price = usage * electricityUnitPrice;
      form.setFieldsValue({
        electricity_price: Math.round(price),
        electricity_num: usage,
        current_electricity_num: currentNum,
      });
    } else if (currentNum < previousElectricityNum) {
      message.warning('Số điện hiện tại phải lớn hơn hoặc bằng số điện kỳ trước!');
    }
  };

  const handlePreviousElectricityChange = (prevNum) => {
    if (prevNum === null || prevNum === undefined) return;
    setPreviousElectricityNum(Number(prevNum));
    const currentNum = Number(form.getFieldValue('current_electricity_num') || 0);
    if (currentNum >= prevNum) {
      const usage = currentNum - prevNum;
      const price = usage * electricityUnitPrice;
      form.setFieldsValue({
        electricity_price: Math.round(price),
        electricity_num: usage,
      });
    } else if (currentNum) {
      message.warning('Số điện hiện tại phải lớn hơn hoặc bằng số điện kỳ trước!');
      form.setFieldsValue({ electricity_price: 0, electricity_num: 0 });
    }
  };

  const handleContractChange = async (rrId) => {
    const contract = contracts.find(c => c.rr_id === rrId);
    if (contract) {
      // Set prices from contract
      form.setFieldsValue({
        price: contract.monthly_rent,
        water_price: contract.water_price || 80000,
        internet_price: contract.internet_price || 100000,
        general_price: contract.general_price || 100000
      });

      // Set electricity unit price from contract
      setElectricityUnitPrice(contract.electricity_unit_price || 3500);

      // Compute previous meter reading: initial + sum(previous usages)
      try {
        const previousInvoices = await invoiceService.getByRentedRoom(rrId);
        let prevReading = Number(contract.initial_electricity_num || 0);

        if (previousInvoices && previousInvoices.length > 0) {
          const totalUsage = previousInvoices.reduce((sum, inv) => sum + Number(inv.electricity_num || 0), 0);
          prevReading += totalUsage;
        }

        setPreviousElectricityNum(prevReading);
        form.setFieldsValue({
          previous_electricity_num: prevReading
        });
      } catch (error) {
        console.error('Error fetching previous invoices:', error);
      }
    }
  };

  const handleViewInvoice = (record) => {
    setSelectedInvoice(record);
    setViewInvoiceModal(true);
  };

  const handleExportPDF = (invoice) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    const total = calculateTotal(invoice);
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="vi">
      <head>
        <title>Hóa đơn #${invoice.invoice_id}</title>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 30px; }
          .header h1 { color: #1890ff; margin: 0; }
          .info { margin-bottom: 20px; }
          .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .info-label { font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #1890ff; color: white; }
          .total-row { font-weight: bold; background-color: #f0f0f0; }
          .footer { margin-top: 40px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>HÓA ĐƠN THANH TOÁN</h1>
          <p>Mã hóa đơn: #${invoice.invoice_id}</p>
        </div>
        
        <div class="info">
          <div class="info-row">
            <span><span class="info-label">Khách thuê:</span> ${invoice.rented_room?.tenant_name || 'N/A'}</span>
            <span><span class="info-label">Phòng:</span> ${invoice.rented_room?.room?.name || 'N/A'}</span>
          </div>
          <div class="info-row">
            <span><span class="info-label">Ngày đến hạn:</span> ${new Date(invoice.due_date).toLocaleDateString('vi-VN')}</span>
            <span><span class="info-label">Trạng thái:</span> ${invoice.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
          </div>
          ${invoice.payment_date ? `<div class="info-row"><span><span class="info-label">Ngày thanh toán:</span> ${new Date(invoice.payment_date).toLocaleDateString('vi-VN')}</span></div>` : ''}
        </div>
        
        <table>
          <thead>
            <tr>
              <th>Dịch vụ</th>
              <th>Số lượng</th>
              <th>Đơn giá (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tiền thuê phòng</td>
              <td>1</td>
              <td>${(invoice.price || 0).toLocaleString()}</td>
            </tr>
            ${invoice.water_price ? `<tr>
              <td>Tiền nước</td>
              <td>-</td>
              <td>${(invoice.water_price || 0).toLocaleString()}</td>
            </tr>` : ''}
            ${invoice.internet_price ? `<tr>
              <td>Tiền internet</td>
              <td>-</td>
              <td>${(invoice.internet_price || 0).toLocaleString()}</td>
            </tr>` : ''}
            ${invoice.electricity_price ? `<tr>
              <td>Tiền điện</td>
              <td>${invoice.electricity_num || '-'} kWh</td>
              <td>${(invoice.electricity_price || 0).toLocaleString()}</td>
            </tr>` : ''}
            ${invoice.general_price ? `<tr>
              <td>Phí dịch vụ chung</td>
              <td>-</td>
              <td>${(invoice.general_price || 0).toLocaleString()}</td>
            </tr>` : ''}
            <tr class="total-row">
              <td colspan="2">TỔNG CỘNG</td>
              <td>${total.toLocaleString()} VNĐ</td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p>Cảm ơn quý khách đã sử dụng dịch vụ!</p>
          <p>Ngày in: ${new Date().toLocaleDateString('vi-VN')}</p>
        </div>
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const columns = [
    {
      title: 'Mã hóa đơn',
      dataIndex: 'invoice_id',
      key: 'invoice_id',
    },
    {
      title: 'Khách thuê',
      dataIndex: 'rented_room',
      key: 'tenant_name',
      render: (rentedRoom, record) => rentedRoom?.tenant_name || contractsMap[record.rr_id]?.tenant_name || 'N/A',
    },
    {
      title: 'Phòng',
      dataIndex: 'rented_room',
      key: 'room_name',
      render: (rentedRoom, record) => rentedRoom?.room?.name || roomsMap[contractsMap[record.rr_id]?.room_id]?.name || 'N/A',
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'price',
      key: 'price',
      render: (price, record) => {
        const total = calculateTotal(record);
        return `${total.toLocaleString()} VNĐ`;
      },
    },
    {
      title: 'Ngày đến hạn',
      dataIndex: 'due_date',
      key: 'due_date',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'is_paid',
      key: 'is_paid',
      render: (isPaid) => (
        <Tag color={isPaid ? 'green' : 'red'}>
          {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
        </Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'action',
      align: 'center',
      width: 300,
      render: (_, record) => (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Button
            type="link" 
            icon={<EyeOutlined />}
            onClick={() => handleViewInvoice(record)}
          >
            Xem
          </Button>
          <Button 
            type="link" 
            icon={<FilePdfOutlined />}
            onClick={() => handleExportPDF(record)}
          >
            PDF
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Sửa
          </Button>
          {!record.is_paid && (
            <Popconfirm
              title="Xác nhận thanh toán hóa đơn này?"
              onConfirm={() => handlePay(record.invoice_id)}
              okText="Có"
              cancelText="Không"
            >
              <Button type="link" icon={<CheckOutlined />}>
                Thanh toán
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
        title={`Quản lý hóa đơn${contractId ? ` - ${contracts.find(c => c.rr_id === Number(contractId))?.tenant_name}` : ''}`}
        extra={
          <Space>
            <Select
              placeholder="Chọn hợp đồng"
              style={{ width: 250 }}
              allowClear
              onChange={(value) => {
                if (value) {
                  setSearchParams({ contract: value });
                } else {
                  setSearchParams({});
                }
              }}
            >
              {contracts.map(contract => (
                <Option key={contract.rr_id} value={contract.rr_id}>
                  {contract.tenant_name} - {contract.room?.name || roomsMap[contract.room_id]?.name || 'N/A'}
                </Option>
              ))}
            </Select>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              Tạo hóa đơn mới
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={invoices}
          rowKey="invoice_id"
          loading={loading}
          pagination={{
            pageSize,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onShowSizeChange: (_, size) => setPageSize(size),
            showQuickJumper: true,
            showTotal: (total) => `Tổng cộng ${total} hóa đơn`,
          }}
        />
      </Card>

      <Modal
        title={editingInvoice ? 'Sửa hóa đơn' : 'Tạo hóa đơn mới'}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width={900}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="rr_id"
            label="Hợp đồng"
            rules={[{ required: true, message: 'Vui lòng chọn hợp đồng!' }]}
          >
            <Select 
              placeholder="Chọn hợp đồng" 
              disabled={!!contractId}
              onChange={handleContractChange}
            >
              {contracts.map(contract => (
                <Option key={contract.rr_id} value={contract.rr_id}>
                  {contract.tenant_name} - {contract.room?.name || roomsMap[contract.room_id]?.name || 'N/A'}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Divider>Chi phí cơ bản</Divider>
          
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="price"
                label="Tiền thuê phòng (VNĐ)"
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
                name="water_price"
                label="Tiền nước (VNĐ)"
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  placeholder="Tiền nước"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="internet_price"
                label="Tiền internet (VNĐ)"
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  placeholder="Tiền internet"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider>Chi phí điện nước</Divider>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="previous_electricity_num"
                label="Số điện kỳ trước (kWh)"
              >
                <InputNumber 
                  style={{ width: '100%' }}
                  placeholder="Số điện kỳ trước"
                  onChange={handlePreviousElectricityChange}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="current_electricity_num"
                label="Số điện hiện tại (kWh)"
                rules={[{ required: true, message: 'Vui lòng nhập so dien hien tai!' }]}
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  placeholder="Nhập số điện hiện tại"
                  onChange={handleElectricityChange}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="electricity_price"
                label="Tiền điện (VNĐ)"
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  placeholder="Tiền điện"
                  disabled
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="electricity_num"
            hidden
          >
            <InputNumber />
          </Form.Item>

          <Divider>Chi phí khác</Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="general_price"
                label="Phí dịch vụ chung (VNĐ)"
              >
                <InputNumber 
                  min={0} 
                  style={{ width: '100%' }}
                  placeholder="Phí dịch vụ"
                  formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="due_date"
                label="Ngày đến hạn"
                rules={[{ required: true, message: 'Vui lòng chọn ngày đến hạn!' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          {editingInvoice && (
            <>
              <Divider>Thanh toán</Divider>
              <Form.Item
                name="payment_date"
                label="Ngày thanh toán"
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingInvoice ? 'Cập nhật' : 'Tạo mới'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Chi tiết hóa đơn"
        open={viewInvoiceModal}
        onCancel={() => setViewInvoiceModal(false)}
        footer={[
          <Button key="pdf" type="primary" icon={<FilePdfOutlined />} onClick={() => handleExportPDF(selectedInvoice)}>
            Xuất PDF
          </Button>,
          <Button key="close" onClick={() => setViewInvoiceModal(false)}>
            Đóng
          </Button>
        ]}
        width={700}
      >
        {selectedInvoice && (
          <div>
            <Card style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div><strong>Mã hóa đơn:</strong> #{selectedInvoice.invoice_id}</div>
                </Col>
                <Col span={12}>
                  <div><strong>Trạng thái:</strong> <Tag color={selectedInvoice.is_paid ? 'green' : 'red'}>{selectedInvoice.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán'}</Tag></div>
                </Col>
                <Col span={12}>
                  <div><strong>Khách thuê:</strong> {selectedInvoice.rented_room?.tenant_name || 'N/A'}</div>
                </Col>
                <Col span={12}>
                  <div><strong>Phòng:</strong> {selectedInvoice.rented_room?.room?.name || 'N/A'}</div>
                </Col>
                <Col span={12}>
                  <div><strong>Ngày đến hạn:</strong> {new Date(selectedInvoice.due_date).toLocaleDateString('vi-VN')}</div>
                </Col>
                {selectedInvoice.payment_date && (
                  <Col span={12}>
                    <div><strong>Ngày thanh toán:</strong> {new Date(selectedInvoice.payment_date).toLocaleDateString('vi-VN')}</div>
                  </Col>
                )}
              </Row>
            </Card>

            <Card title="Chi tiết chi phí">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left' }}>Dịch vụ</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Số lượng</th>
                    <th style={{ padding: '12px', textAlign: 'right' }}>Đơn giá (VNĐ)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '12px' }}>Tiền thuê phòng</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>1</td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>{(selectedInvoice.price || 0).toLocaleString()}</td>
                  </tr>
                  {selectedInvoice.water_price > 0 && (
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px' }}>Tiền nước</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>-</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{(selectedInvoice.water_price || 0).toLocaleString()}</td>
                    </tr>
                  )}
                  {selectedInvoice.internet_price > 0 && (
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px' }}>Tiền internet</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>-</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{(selectedInvoice.internet_price || 0).toLocaleString()}</td>
                    </tr>
                  )}
                  {selectedInvoice.electricity_price > 0 && (
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px' }}>Tiền điện</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{selectedInvoice.electricity_num || '-'} kWh</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{(selectedInvoice.electricity_price || 0).toLocaleString()}</td>
                    </tr>
                  )}
                  {selectedInvoice.general_price > 0 && (
                    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px' }}>Phí dịch vụ chung</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>-</td>
                      <td style={{ padding: '12px', textAlign: 'right' }}>{(selectedInvoice.general_price || 0).toLocaleString()}</td>
                    </tr>
                  )}
                  <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
                    <td colSpan={2} style={{ padding: '12px' }}>TỔNG CỘNG</td>
                    <td style={{ padding: '12px', textAlign: 'right', color: '#1890ff', fontSize: '16px' }}>
                      {calculateTotal(selectedInvoice).toLocaleString()} VNĐ
                    </td>
                  </tr>
                </tbody>
              </table>
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Invoices;
