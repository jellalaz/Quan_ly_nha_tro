import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, Button, Dropdown, Avatar } from 'antd';
import { 
  HomeOutlined, 
  UserOutlined, 
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BankOutlined,
  ShopOutlined,
  FileTextOutlined,
  DollarOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { authService } from '../services/authService';

const { Header, Sider, Content } = AntLayout;

const Layout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const user = await authService.getCurrentUser();
        setUserInfo(user);
      } catch (error) {
        console.error('Failed to fetch user info:', error);
      }
    };
    fetchUserInfo();
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const isAdmin = authService.isAdmin();
  const isOwner = authService.isOwner();

  // Menu items for admin
  const adminMenuItems = [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/owners',
      icon: <TeamOutlined />,
      label: 'Quản lý chủ trọ',
    },
    {
      key: '/admin/houses',
      icon: <BankOutlined />,
      label: 'Toàn bộ nhà trọ',
    },
    {
      key: '/admin/reports',
      icon: <FileTextOutlined />,
      label: 'Báo cáo & Phân tích',
    },
  ];

  // Menu items for owner
  const ownerMenuItems = [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/houses',
      icon: <BankOutlined />,
      label: 'Quản lý nhà trọ',
    },
    {
      key: '/rooms',
      icon: <ShopOutlined />,
      label: 'Quản lý phòng trọ',
    },
    {
      key: '/contracts',
      icon: <FileTextOutlined />,
      label: 'Hợp đồng thuê',
    },
    {
      key: '/invoices',
      icon: <DollarOutlined />,
      label: 'Hóa đơn',
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: 'Báo cáo & AI',
    },
  ];

  // Select menu items based on role
  const menuItems = isAdmin ? adminMenuItems : ownerMenuItems;

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ 
          height: 32, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>
          {collapsed ? 'RT' : 'Room Management'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header style={{ 
          padding: 0, 
          background: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <Dropdown
            menu={{ items: userMenuItems }}
            placement="bottomRight"
            arrow
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8, 
              padding: '0 16px',
              cursor: 'pointer'
            }}>
              <Avatar icon={<UserOutlined />} />
              <span>{userInfo?.fullname || 'User'}</span>
              {userInfo?.role && (
                <span style={{ 
                  fontSize: '12px', 
                  color: '#999',
                  marginLeft: '4px'
                }}>
                  ({userInfo.role.authority})
                </span>
              )}
            </div>
          </Dropdown>
        </Header>
        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          background: '#fff',
          borderRadius: 8,
          minHeight: 'calc(100vh - 112px)'
        }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
