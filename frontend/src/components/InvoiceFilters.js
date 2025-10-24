import React from 'react';
import { Row, Col, DatePicker, Select, Button } from 'antd';

const { Option } = Select;

const InvoiceFilters = ({ filters, onFilterChange, onClearFilters, housesAll, contracts, roomsMap }) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <Row gutter={[16, 16]}>
        <Col span={6}>
          <DatePicker
            placeholder="Chọn tháng"
            style={{ width: '100%' }}
            picker="month"
            allowClear
            value={filters.month}
            onChange={(date) => onFilterChange({ month: date })}
          />
        </Col>
        <Col span={6}>
          <Select
            placeholder="Chọn nhà trọ"
            style={{ width: '100%' }}
            allowClear
            value={filters.houseId}
            onChange={(value) => onFilterChange({ houseId: value })}
          >
            {housesAll.map(house => (
              <Option key={house.house_id} value={house.house_id}>
                {house.name}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Select
            placeholder="Chọn hợp đồng"
            style={{ width: '100%' }}
            allowClear
            value={filters.contractId}
            onChange={(value) => onFilterChange({ contractId: value })}
          >
            {contracts.map(contract => (
              <Option key={contract.rr_id} value={contract.rr_id}>
                {contract.tenant_name} - {contract.room?.name || roomsMap[contract.room_id]?.name || 'N/A'}
              </Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Select
            placeholder="Chọn trạng thái"
            style={{ width: '100%' }}
            allowClear
            value={filters.status}
            onChange={(value) => onFilterChange({ status: value })}
          >
            <Option value="1">Đã thanh toán</Option>
            <Option value="0">Chưa thanh toán</Option>
          </Select>
        </Col>
      </Row>
      <Row style={{ marginTop: 16 }}>
        <Col span={24}>
          <Button type="primary" onClick={onClearFilters}>
            Xóa bộ lọc
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default InvoiceFilters;

