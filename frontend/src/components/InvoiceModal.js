import React from 'react';
import { Modal, Form, Select, InputNumber, DatePicker, Button, Space, Row, Col, Divider } from 'antd';

const { Option } = Select;

const InvoiceModal = ({
  visible,
  onCancel,
  onSubmit,
  form,
  editingInvoice,
  contracts,
  contractId,
  roomsMap,
  previousElectricityNum,
  onContractChange,
  onPreviousElectricityChange,
  onElectricityChange
}) => {
  return (
    <Modal
      title={editingInvoice ? 'Sửa hóa đơn' : 'Tạo hóa đơn mới'}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <Form.Item
          name="rr_id"
          label="Hợp đồng"
          rules={[{ required: true, message: 'Vui lòng chọn hợp đồng!' }]}
        >
          <Select
            placeholder="Chọn hợp đồng"
            disabled={!!contractId}
            onChange={onContractChange}
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
            <Form.Item name="price" label="Tiền thuê phòng (VNĐ)" rules={[{ required: true, message: 'Vui lòng nhập tiền thuê!' }]}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Tiền thuê" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="water_price" label="Tiền nước (VNĐ)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Tiền nước" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="internet_price" label="Tiền internet (VNĐ)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Tiền internet" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
          </Col>
        </Row>

        <Divider>Chi phí điện nước</Divider>

        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="previous_electricity_num" label="Số điện kỳ trước (kWh)">
              <InputNumber style={{ width: '100%' }} placeholder="Số điện kỳ trước" onChange={onPreviousElectricityChange} disabled />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="current_electricity_num" label="Số điện hiện tại (kWh)" rules={[{ required: true, message: 'Vui lòng nhập số điện hiện tại!' }]}>
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Nhập số điện hiện tại" onChange={onElectricityChange} />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="electricity_price" label="Tiền điện (VNĐ)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Tiền điện" disabled formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="electricity_num" hidden>
          <InputNumber />
        </Form.Item>

        <Divider>Chi phí khác</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="general_price" label="Phí dịch vụ chung (VNĐ)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="Phí dịch vụ" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="due_date" label="Ngày đến hạn" rules={[{ required: true, message: 'Vui lòng chọn ngày đến hạn!' }]}>
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>

        {editingInvoice && (
          <>
            <Divider>Thanh toán</Divider>
            <Form.Item name="payment_date" label="Ngày thanh toán">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </>
        )}

        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
          <Space>
            <Button onClick={onCancel}>Hủy</Button>
            <Button type="primary" htmlType="submit">
              {editingInvoice ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default InvoiceModal;

