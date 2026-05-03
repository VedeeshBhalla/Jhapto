import React, { useState, useEffect } from 'react';
import { Search, MapPin, ShoppingBag, User, Bell } from 'lucide-react';
import api from '../utils/api';
import './Header.css';

const Header = ({ cartCount, user, onLogout, onOrdersClick, onSellerClick, searchQuery, onSearchChange }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      try {
        const res = await api.get('/messages/unread');
        setUnreadCount(res.data.unread_count);
      } catch (err) {
        // silently ignore polling errors
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 5000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <header className="header glass-panel">
      <div className="header-container">
        <div className="logo-section">
          <h1 className="logo text-gradient" onClick={() => window.location.href='/'} style={{cursor: 'pointer'}}>JHAPTO</h1>
        </div>
        
        <div className="location-section">
          <div className="location-badge">
            <MapPin size={16} className="location-icon" />
            <div className="location-text">
              <span className="location-title">Delivery to</span>
              <span className="location-value">{user ? `Hostel ${user.hostel_id}, F-${user.floor_id}` : 'Login to view'}</span>
            </div>
          </div>
        </div>
        
        <div className="search-section">
          <div className="search-bar">
            <Search size={20} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search for snacks, drinks, essentials..." 
              className="search-input"
              value={searchQuery || ''}
              onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            />
          </div>
        </div>
        
        <div className="actions-section">
          {user && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Hi, {user.name.split(' ')[0]}</span>
              <button className="icon-btn" onClick={() => window.location.href='/orders'} title="Notifications" style={{ position: 'relative' }}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="cart-badge" style={{ background: 'var(--secondary-color)' }}>{unreadCount}</span>}
              </button>
              <button className="icon-btn" onClick={onOrdersClick} title="My Orders" style={{ fontSize: '0.8rem', width: 'auto', padding: '0 10px', borderRadius: '12px' }}>Orders</button>
              <button className="icon-btn" onClick={onSellerClick} title="Seller Dashboard" style={{ fontSize: '0.8rem', width: 'auto', padding: '0 10px', borderRadius: '12px' }}>Sell</button>
              <button className="icon-btn" onClick={onLogout} title="Logout" style={{ fontSize: '0.8rem', width: 'auto', padding: '0 10px', borderRadius: '12px', color: 'var(--secondary-color)' }}>Logout</button>
            </div>
          )}
          {!user && (
            <button className="icon-btn" onClick={() => window.location.href='/login'}>
              <User size={22} />
            </button>
          )}
          <button className="icon-btn cart-btn">
            <ShoppingBag size={22} />
            {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
