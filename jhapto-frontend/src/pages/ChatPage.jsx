import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { AuthContext } from '../contexts/AuthContext';
import api from '../utils/api';

const ChatPage = () => {
  const { order_id } = useParams();
  const [messages, setMessages] = useState([]);
  const [orderStatus, setOrderStatus] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 1500); // Poll every 1.5s for dynamic chat
    return () => clearInterval(interval);
  }, [order_id]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/messages/${order_id}`);
      setMessages(res.data.messages || []);
      setOrderStatus(res.data.order_status);
    } catch (err) {
      console.error('Error fetching messages', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      await api.post(`/messages/${order_id}`, { message_text: newMessage });
      setNewMessage('');
      fetchMessages();
    } catch (err) {
      alert('Error sending message');
    }
  };

  return (
    <>
      <Header cartCount={0} user={user} onLogout={logout} onOrdersClick={() => navigate('/orders')} onSellerClick={() => navigate('/seller')} />
      <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
        <h2 className="text-gradient" style={{ marginBottom: '1rem' }}>Chat - Order #{order_id}</h2>
        
        <div className="glass-panel" style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
          {messages.length === 0 && <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No messages yet. Say hi!</p>}
          {messages.map(msg => {
            const isMe = Number(msg.sender_id) === Number(user.student_id);
            return (
              <div key={msg.message_id} style={{ 
                alignSelf: isMe ? 'flex-end' : 'flex-start',
                background: isMe ? 'linear-gradient(90deg, var(--primary-color), #00d2ff)' : 'rgba(255,255,255,0.1)',
                color: isMe ? '#000' : '#fff',
                padding: '0.8rem 1.2rem',
                borderRadius: '16px',
                borderBottomRightRadius: isMe ? '4px' : '16px',
                borderBottomLeftRadius: isMe ? '16px' : '4px',
                maxWidth: '70%'
              }}>
                {!isMe && <div style={{ fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '0.2rem', opacity: 0.7 }}>{msg.sender_name}</div>}
                <div>{msg.message_text}</div>
              </div>
            );
          })}
        </div>
        
        {orderStatus === 'Placed' ? (
          <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
            This chat is locked. You can only chat after the seller confirms this order.
          </div>
        ) : ['Delivered', 'Cancelled'].includes(orderStatus) ? (
          <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
            This chat is closed because the order is {orderStatus.toLowerCase()}.
          </div>
        ) : (
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              value={newMessage} 
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              style={{ flex: 1, padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)', outline: 'none' }}
            />
            <button type="submit" className="auth-btn" style={{ marginTop: 0, padding: '0 2rem' }}>Send</button>
          </form>
        )}
      </div>
    </>
  );
};

export default ChatPage;
