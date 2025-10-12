import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  message,
  Input,
  Select,
  Space,
  Button
} from 'antd';
import { 
  SearchOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { adminService } from '../services/adminService';
import { ownerService } from '../services/ownerService';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;
const { Option } = Select;

const AdminHouses = () => {
  const [houses, setHouses] = useState([]);
  const [filteredHouses, setFilteredHouses] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedOwner, setSelectedOwner] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [housesData, ownersData] = await Promise.all([
        adminService.getAllHouses(),
        ownerService.getAll()
      ]);
      
      setHouses(housesData);
      setFilteredHouses(housesData);
      setOwners(ownersData);
    } catch (error) {
      message.error('Lỗi khi tải dữ liệu!');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value) => {
    setSearchText(value);
    filterHouses(value, selectedOwner);
  };

  const handleOwnerFilter = (ownerId) => {
    setSelectedOwner(ownerId);
    filterHouses(searchText, ownerId);
  };

  const filterHouses = (search, ownerId) => {
    let filtered = houses;

    if (search) {
      filtered = filtered.filter(house =>
        house.name.toLowerCase().includes(search.toLowerCase()) ||
        house.address_line.toLowerCase().includes(search.toLowerCase()) ||
        house.district.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (ownerId) {
      filtered = filtered.filter(house => house.owner_id === ownerId);
    }

    setFilteredHouses(filtered);
  };

  const getOwnerName = (ownerId) => {
    const owner = owners.find(o => o.owner_id === ownerId);
    return owner ? owner.fullname : 'N/A';
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'house_id',
      key: 'house_id',
      width: 80,
      sorter: (a, b) => a.house_id - b.house_id,
    },
    {
      title: 'Tên nhà trọ',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Chủ trọ',
      dataIndex: 'owner_id',
      key: 'owner_id',
      render: (ownerId) => (
        <Tag color="blue" style={{ cursor: 'pointer' }} onClick={() => navigate(`/owners/${ownerId}`)}>
          {getOwnerName(ownerId)}
        </Tag>
      ),
    },
    {
      title: 'Số tầng',
      dataIndex: 'floor_count',
      key: 'floor_count',
      width: 100,
      render: (value) => `${value} tầng`,
    },
    {
      title: 'Quận/Huyện',
      dataIndex: 'district',
      key: 'district',
    },
    {
      title: 'Phường/Xã',
      dataIndex: 'ward',
      key: 'ward',
    },
    {
      title: 'Địa chỉ',
      dataIndex: 'address_line',
      key: 'address_line',
      ellipsis: true,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : '-',
      sorter: (a, b) => new Date(a.created_at) - new Date(b.created_at),
    },
  ];

  return (
    <div>
      <Card
        title="Quản lý toàn bộ nhà trọ"
        extra={
          <Space>
            <Search
              placeholder="Tìm kiếm nhà trọ..."
              allowClear
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ width: 250 }}
              prefix={<SearchOutlined />}
            />
            <Select
              placeholder="Lọc theo chủ trọ"
              allowClear
              style={{ width: 200 }}
              onChange={handleOwnerFilter}
            >
              {owners.map(owner => (
                <Option key={owner.owner_id} value={owner.owner_id}>
                  {owner.fullname}
                </Option>
              ))}
            </Select>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredHouses}
          rowKey="house_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `Tổng cộng ${total} nhà trọ`,
          }}
        />
      </Card>
    </div>
  );
};

export default AdminHouses;
