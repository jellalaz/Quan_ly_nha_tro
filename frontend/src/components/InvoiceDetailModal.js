import React from 'react';
import { Modal, Card, Row, Col, Tag, Button } from 'antd';
import { FilePdfOutlined } from '@ant-design/icons';

const InvoiceDetailModal = ({ visible, onCancel, invoice, roomsMap, housesMap, contractsMap, onExportPDF, calculateTotal }) => {
  if (!invoice) return null;

  const roomFromInvoice = invoice.rented_room?.room;
  const roomName = roomFromInvoice?.name || roomsMap[contractsMap[invoice.rr_id]?.room_id]?.name || 'N/A';
  const houseName = (() => {
    if (roomFromInvoice && roomFromInvoice.house_id) {
      return housesMap[roomFromInvoice.house_id]?.name || 'N/A';
    }
    const fallbackRoom = roomsMap[contractsMap[invoice.rr_id]?.room_id] || {};
    return housesMap[fallbackRoom.house_id]?.name || 'N/A';
  })();

  return (
    <Modal
      title="Chi tiết hóa đơn"
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="pdf" type="primary" icon={<FilePdfOutlined />} onClick={() => onExportPDF(invoice)}>
          Xuất PDF
        </Button>,
        <Button key="close" onClick={onCancel}>Đóng</Button>
      ]}
      width={700}
    >
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div><strong>Mã hóa đơn:</strong> #{invoice.invoice_id}</div>
          </Col>
          <Col span={12}>
            <div><strong>Trạng thái:</strong> <Tag color={invoice.is_paid ? 'green' : 'red'}>{invoice.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán'}</Tag></div>
          </Col>
          <Col span={12}>
            <div><strong>Khách thuê:</strong> {invoice.rented_room?.tenant_name || 'N/A'}</div>
          </Col>
          <Col span={12}>
            <div><strong>Phòng:</strong> {roomName}</div>
          </Col>
          <Col span={12}>
            <div><strong>Nhà trọ:</strong> {houseName}</div>
          </Col>
          <Col span={12}>
            <div><strong>Ngày đến hạn:</strong> {new Date(invoice.due_date).toLocaleDateString('vi-VN')}</div>
          </Col>
          {invoice.payment_date && (
            <Col span={12}>
              <div><strong>Ngày thanh toán:</strong> {new Date(invoice.payment_date).toLocaleDateString('vi-VN')}</div>
            </Col>
          )}
        </Row>
      </Card>

      <Card title="Chi tiết chi phí">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f0f0f0' }}>
              <th style={{ padding: '12px', textAlign: 'left' }}>Dịch vụ</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>Đơn giá (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <td style={{ padding: '12px' }}>Tiền thuê phòng</td>
              <td style={{ padding: '12px', textAlign: 'right' }}>{(invoice.price || 0).toLocaleString()}</td>
            </tr>
            {invoice.water_price > 0 && (
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px' }}>Tiền nước</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{(invoice.water_price || 0).toLocaleString()}</td>
              </tr>
            )}
            {invoice.internet_price > 0 && (
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px' }}>Tiền internet</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{(invoice.internet_price || 0).toLocaleString()}</td>
              </tr>
            )}
            {invoice.electricity_price > 0 && (
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px' }}>Tiền điện ({invoice.electricity_num || '-'} kWh)</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{(invoice.electricity_price || 0).toLocaleString()}</td>
              </tr>
            )}
            {invoice.general_price > 0 && (
              <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
                <td style={{ padding: '12px' }}>Phí dịch vụ chung</td>
                <td style={{ padding: '12px', textAlign: 'right' }}>{(invoice.general_price || 0).toLocaleString()}</td>
              </tr>
            )}
            <tr style={{ backgroundColor: '#f0f0f0', fontWeight: 'bold' }}>
              <td style={{ padding: '12px' }}>TỔNG CỘNG</td>
              <td style={{ padding: '12px', textAlign: 'right', color: '#1890ff', fontSize: '16px' }}>
                {calculateTotal(invoice).toLocaleString()} VNĐ
              </td>
            </tr>
          </tbody>
        </table>
      </Card>
    </Modal>
  );
};

export default InvoiceDetailModal;

