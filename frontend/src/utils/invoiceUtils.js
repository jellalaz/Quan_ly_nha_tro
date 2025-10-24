// Invoice utility functions

export const calculateTotal = (invoice) => (
  (invoice.price || 0) +
  (invoice.water_price || 0) +
  (invoice.internet_price || 0) +
  (invoice.general_price || 0) +
  (invoice.electricity_price || 0)
);

export const generatePDFHTML = (invoice, roomName, houseName, calculateTotal) => {
  const total = calculateTotal(invoice);

  return `
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
          <span><span class="info-label">Phòng:</span> ${roomName}</span>
        </div>
        <div class="info-row">
          <span><span class="info-label">Nhà trọ:</span> ${houseName}</span>
          <span><span class="info-label">Ngày đến hạn:</span> ${new Date(invoice.due_date).toLocaleDateString('vi-VN')}</span>
        </div>
        <div class="info-row">
          <span><span class="info-label">Trạng thái:</span> ${invoice.is_paid ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
          ${invoice.payment_date ? `<span><span class="info-label">Ngày thanh toán:</span> ${new Date(invoice.payment_date).toLocaleDateString('vi-VN')}</span>` : ''}
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Dịch vụ</th>
            <th>Đơn giá (VNĐ)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Tiền thuê phòng</td>
            <td>${(invoice.price || 0).toLocaleString()}</td>
          </tr>
          ${invoice.water_price ? `<tr>
            <td>Tiền nước</td>
            <td>${(invoice.water_price || 0).toLocaleString()}</td>
          </tr>` : ''}
          ${invoice.internet_price ? `<tr>
            <td>Tiền internet</td>
            <td>${(invoice.internet_price || 0).toLocaleString()}</td>
          </tr>` : ''}
          ${invoice.electricity_price ? `<tr>
            <td>Tiền điện (${invoice.electricity_num || '-'} kWh)</td>
            <td>${(invoice.electricity_price || 0).toLocaleString()}</td>
          </tr>` : ''}
          ${invoice.general_price ? `<tr>
            <td>Phí dịch vụ chung</td>
            <td>${(invoice.general_price || 0).toLocaleString()}</td>
          </tr>` : ''}
          <tr class="total-row">
            <td>TỔNG CỘNG</td>
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
  `;
};

export const getInvoiceColumns = (
  calculateTotal,
  handleViewInvoice,
  handleExportPDF,
  handleEdit,
  handlePay,
  handleDelete,
  roomsMap,
  housesMap,
  contractsMap
) => [
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
    title: 'Nhà trọ',
    dataIndex: 'rented_room',
    key: 'house_name',
    render: (rentedRoom, record) => {
      const room = rentedRoom?.room || roomsMap[contractsMap[record.rr_id]?.room_id] || {};
      if (room?.house_id) return housesMap[room.house_id]?.name || 'N/A';
      return 'N/A';
    }
  },
  {
    title: 'Tổng tiền',
    dataIndex: 'price',
    key: 'price',
    render: (price, record) => `${calculateTotal(record).toLocaleString()} VNĐ`,
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
    render: (isPaid) => {
      const { Tag } = require('antd');
      return (
        <Tag color={isPaid ? 'green' : 'red'}>
          {isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}
        </Tag>
      );
    },
  },
  {
    title: 'Hành động',
    key: 'action',
    align: 'center',
    width: 300,
    render: (_, record) => {
      const { Button, Popconfirm } = require('antd');
      const { EyeOutlined, FilePdfOutlined, EditOutlined, CheckOutlined, DeleteOutlined } = require('@ant-design/icons');

      return (
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8 }}>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewInvoice(record)}>
            Xem
          </Button>
          <Button type="link" icon={<FilePdfOutlined />} onClick={() => handleExportPDF(record)}>
            PDF
          </Button>
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
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
          <Popconfirm
            title="Xác nhận xóa hóa đơn này?"
            onConfirm={() => handleDelete(record.invoice_id)}
            okText="Có"
            cancelText="Không"
          >
            <Button type="link" icon={<DeleteOutlined />} danger>
              Xóa
            </Button>
          </Popconfirm>
        </div>
      );
    },
  },
];

