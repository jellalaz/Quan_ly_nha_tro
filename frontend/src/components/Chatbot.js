import React, { useState, useRef, useEffect } from 'react';
import { Card, Input, Button, List, Avatar, Typography, Spin, Space, Divider } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, ClearOutlined } from '@ant-design/icons';
import { aiService } from '../services/aiService';

const { TextArea } = Input;
const { Text } = Typography;

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      content: 'Xin chào! Tôi là trợ lý AI của hệ thống quản lý nhà trọ. Tôi có thể giúp bạn:',
      timestamp: new Date()
    },
    {
      type: 'bot',
      content: '• Tư vấn về quản lý nhà trọ\n• Gợi ý phòng phù hợp\n• Phân tích báo cáo doanh thu\n• Trả lời các câu hỏi về hệ thống',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // Gửi tin nhắn đến AI
      const response = await aiService.chat({
        question: inputMessage,
        include_stats: true,
        include_available_rooms: true,
        include_pending_invoices: true
      });

      const botMessage = {
        type: 'bot',
        content: response.answer,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        type: 'bot',
        content: 'Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn. Vui lòng thử lại sau.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        type: 'bot',
        content: 'Cuộc trò chuyện đã được xóa. Tôi có thể giúp gì cho bạn?',
        timestamp: new Date()
      }
    ]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Card
      title={
        <Space>
          <RobotOutlined style={{ color: '#1890ff' }} />
          <Text strong>Trợ lý AI - Quản lý nhà trọ</Text>
        </Space>
      }
      extra={
        <Button 
          type="text" 
          icon={<ClearOutlined />} 
          onClick={handleClearChat}
          size="small"
        >
          Xóa chat
        </Button>
      }
      style={{ height: '600px', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px' }}
    >
      <div style={{ 
        flex: 1, 
        overflowY: 'auto', 
        marginBottom: '16px',
        padding: '8px',
        border: '1px solid #f0f0f0',
        borderRadius: '6px',
        backgroundColor: '#fafafa'
      }}>
        <List
          dataSource={messages}
          renderItem={(message, index) => (
            <List.Item style={{ 
              border: 'none', 
              padding: '8px 0',
              justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start'
            }}>
              <div style={{
                display: 'flex',
                flexDirection: message.type === 'user' ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: '8px',
                maxWidth: '80%'
              }}>
                <Avatar 
                  icon={message.type === 'user' ? <UserOutlined /> : <RobotOutlined />}
                  style={{ 
                    backgroundColor: message.type === 'user' ? '#1890ff' : '#52c41a',
                    flexShrink: 0
                  }}
                />
                <div style={{
                  backgroundColor: message.type === 'user' ? '#1890ff' : '#fff',
                  color: message.type === 'user' ? '#fff' : '#000',
                  padding: '12px 16px',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  wordBreak: 'break-word',
                  maxWidth: '100%'
                }}>
                  {message.type === 'user' ? (
                    <Text style={{ color: '#fff' }}>
                      {message.content}
                    </Text>
                  ) : (
                    <div style={{ lineHeight: '1.6' }}>
                      {message.content.split('\n').map((line, idx) => {
                        // Check if line is a header
                        if (line.trim().startsWith('##')) {
                          return (
                            <h4 key={idx} style={{ 
                              color: '#1890ff', 
                              marginTop: idx === 0 ? '0' : '12px',
                              marginBottom: '6px',
                              fontSize: '15px',
                              fontWeight: 'bold'
                            }}>
                              {line.replace(/^#+\s*/, '')}
                            </h4>
                          );
                        }
                        // Check if line is a bullet point
                        else if (line.trim().startsWith('-') || line.trim().startsWith('*') || line.trim().startsWith('\u2022')) {
                          const content = line.replace(/^[-*\u2022]\s*/, '');
                          const parts = content.split(/\*\*|__/);
                          return (
                            <div key={idx} style={{ 
                              marginLeft: '12px',
                              marginBottom: '4px',
                              display: 'flex',
                              alignItems: 'flex-start'
                            }}>
                              <span style={{ color: '#52c41a', marginRight: '6px', fontWeight: 'bold' }}>•</span>
                              <span>{parts.map((part, i) => i % 2 === 1 ? <strong key={i} style={{ color: '#1890ff' }}>{part}</strong> : part)}</span>
                            </div>
                          );
                        }
                        // Check if line contains bold text
                        else if (line.includes('**') || line.includes('__')) {
                          const parts = line.split(/\*\*|__/);
                          return (
                            <p key={idx} style={{ marginBottom: '6px', margin: '4px 0' }}>
                              {parts.map((part, i) => 
                                i % 2 === 1 ? <strong key={i} style={{ color: '#1890ff' }}>{part}</strong> : part
                              )}
                            </p>
                          );
                        }
                        // Regular text
                        else if (line.trim()) {
                          return (
                            <p key={idx} style={{ margin: '4px 0' }}>
                              {line}
                            </p>
                          );
                        }
                        // Empty line
                        return <div key={idx} style={{ height: '6px' }} />;
                      })}
                    </div>
                  )}
                  <div style={{ 
                    fontSize: '10px', 
                    opacity: 0.7, 
                    marginTop: '6px',
                    color: message.type === 'user' ? '#fff' : '#999'
                  }}>
                    {message.timestamp.toLocaleTimeString('vi-VN', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </div>
                </div>
              </div>
            </List.Item>
          )}
        />
        {loading && (
          <div style={{ textAlign: 'center', padding: '16px' }}>
            <Spin size="small" />
            <Text style={{ marginLeft: '8px', color: '#666' }}>
              AI đang suy nghĩ...
            </Text>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <div style={{ display: 'flex', gap: '8px' }}>
        <TextArea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nhập câu hỏi của bạn về quản lý nhà trọ..."
          autoSize={{ minRows: 1, maxRows: 3 }}
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSendMessage}
          loading={loading}
          disabled={!inputMessage.trim()}
          style={{ alignSelf: 'flex-end' }}
        >
          Gửi
        </Button>
      </div>

      <div style={{ marginTop: '8px' }}>
        <Text type="secondary" style={{ fontSize: '12px' }}>
          💡 Mẹo: Hỏi về "phòng trống", "doanh thu", "hợp đồng sắp hết hạn" để được tư vấn cụ thể
        </Text>
      </div>
    </Card>
  );
};

export default Chatbot;
