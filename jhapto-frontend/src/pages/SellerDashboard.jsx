import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { AuthContext } from '../contexts/AuthContext';
import api from '../utils/api';

const SellerDashboard = () => {
  const [listings, setListings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [activeOrderTab, setActiveOrderTab] = useState('active'); // 'active' or 'history'
  const [reportModal, setReportModal] = useState({ show: false, order: null });
  const [reportReason, setReportReason] = useState('');
  const [reportProof, setReportProof] = useState('');
  const [newListing, setNewListing] = useState({ item_id: '', mrp: '', selling_price: '', quantity_available: '', description: '', room_number: '' });
  
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [notification, setNotification] = useState({ message: '', type: '' });

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [listRes, ordRes, itemsRes] = await Promise.all([
        api.get('/listings/my'),
        api.get('/orders/selling'),
        api.get('/listings/items')
      ]);
      setListings(listRes.data);
      setOrders(ordRes.data);
      setItems(itemsRes.data);
      if (itemsRes.data.length > 0) {
        setNewListing(prev => ({ ...prev, item_id: itemsRes.data[0].item_id }));
      }
    } catch (err) {
      console.error('Error fetching seller data', err);
    }
  };

  const handleAddListing = async (e) => {
    e.preventDefault();
    try {
      await api.post('/listings', newListing);
      showNotification('Listing created successfully!');
      setNewListing({ item_id: items[0]?.item_id || '', mrp: '', selling_price: '', quantity_available: '', description: '', photo_url: '', room_number: '' });
      fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error creating listing', 'error');
    }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm('Remove listing?')) return;
    try {
      await api.delete(`/listings/${id}`);
      showNotification('Listing removed');
      fetchData();
    } catch (err) {
      showNotification('Error removing listing', 'error');
    }
  };

  const handleUpdateOrder = async (order_id, action) => {
    try {
      await api.patch(`/orders/${order_id}/${action}`);
      showNotification(`Order ${action}ed!`);
      fetchData();
    } catch (err) {
      showNotification(err.response?.data?.message || `Error updating order`, 'error');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewListing({...newListing, photo_url: reader.result});
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReportFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setReportProof(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const submitReport = async (e) => {
    e.preventDefault();
    if (!reportReason) return alert('Reason is required');
    try {
      await api.post('/reports', {
        order_id: reportModal.order.order_id,
        reported_user_id: reportModal.order.buyer_id,
        reason: reportReason,
        proof_url: reportProof
      });
      alert('Report submitted successfully!');
      setReportModal({ show: false, order: null });
      setReportReason('');
      setReportProof('');
    } catch (err) {
      alert(err.response?.data?.message || 'Error submitting report');
    }
  };

  return (
    <>
      <Header cartCount={0} user={user} onLogout={logout} onOrdersClick={() => navigate('/orders')} onSellerClick={() => navigate('/seller')} />
      
      {notification.message && (
        <div style={{
          position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
          background: notification.type === 'error' ? 'var(--secondary-color)' : 'var(--primary-color)',
          color: notification.type === 'error' ? 'white' : 'black',
          padding: '1rem 2rem', borderRadius: '30px', fontWeight: 'bold', boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
          animation: 'slideDown 0.3s ease-out'
        }}>
          {notification.message}
        </div>
      )}
      
      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        
        {/* LEFT COLUMN: Manage Listings */}
        <div>
          <h2 className="text-gradient" style={{ marginBottom: '1.5rem' }}>Seller Dashboard</h2>
          
          <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Add New Listing</h3>
            <form onSubmit={handleAddListing} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <select 
                value={newListing.item_id} 
                onChange={(e) => setNewListing({...newListing, item_id: e.target.value})}
                style={{ padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)' }}
              >
                {items.map(item => <option key={item.item_id} value={item.item_id}>{item.item_name} ({item.brand})</option>)}
              </select>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <input type="number" placeholder="MRP" required value={newListing.mrp} onChange={(e) => setNewListing({...newListing, mrp: e.target.value})} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)' }} />
                <input type="number" placeholder="Selling Price" required value={newListing.selling_price} onChange={(e) => setNewListing({...newListing, selling_price: e.target.value})} style={{ flex: 1, padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)' }} />
              </div>
              <input type="number" placeholder="Quantity Available" required value={newListing.quantity_available} onChange={(e) => setNewListing({...newListing, quantity_available: e.target.value})} style={{ padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)' }} />
              <input type="text" placeholder="Room Number (e.g., K-204)" required value={newListing.room_number} onChange={(e) => setNewListing({...newListing, room_number: e.target.value})} style={{ padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)' }} />
              <input type="text" placeholder="Description (Optional)" value={newListing.description} onChange={(e) => setNewListing({...newListing, description: e.target.value})} style={{ padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)' }} />
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Product Photo (Take a picture or upload)</label>
                <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ padding: '0.8rem', borderRadius: '8px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)' }} />
              </div>

              <button type="submit" className="auth-btn" style={{ marginTop: 0 }}>Add Listing</button>
            </form>
          </div>

          <h3>My Active Listings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {listings.map(l => (
              <div key={l.listing_id} className="glass-panel" style={{ padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4>{l.item_name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Price: ₹{l.selling_price} | Stock: {l.quantity_available} | Status: {l.listing_status}</p>
                </div>
                {l.listing_status === 'Active' && (
                  <button onClick={() => handleDeleteListing(l.listing_id)} style={{ background: 'transparent', color: 'var(--secondary-color)', border: 'none', cursor: 'pointer' }}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Received Orders */}
        <div>
          <h2 style={{ marginBottom: '1.5rem' }}>Received Orders</h2>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
            <button 
              onClick={() => setActiveOrderTab('active')}
              className="auth-btn" 
              style={{ marginTop: 0, padding: '0.6rem 1rem', flex: 0, whiteSpace: 'nowrap', background: activeOrderTab === 'active' ? 'var(--primary-color)' : 'rgba(0,0,0,0.3)', color: activeOrderTab === 'active' ? '#000' : 'white', border: activeOrderTab === 'active' ? 'none' : '1px solid var(--border-color)' }}
            >
              Active Orders
            </button>
            <button 
              onClick={() => setActiveOrderTab('history')}
              className="auth-btn" 
              style={{ marginTop: 0, padding: '0.6rem 1rem', flex: 0, whiteSpace: 'nowrap', background: activeOrderTab === 'history' ? 'var(--primary-color)' : 'rgba(0,0,0,0.3)', color: activeOrderTab === 'history' ? '#000' : 'white', border: activeOrderTab === 'history' ? 'none' : '1px solid var(--border-color)' }}
            >
              Order History
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {orders
              .filter(o => activeOrderTab === 'active' ? ['Placed', 'Confirmed'].includes(o.order_status) : ['Delivered', 'Cancelled'].includes(o.order_status))
              .map(o => (
              <div key={o.order_id} className="glass-panel" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <h4 style={{ color: 'var(--primary-color)' }}>Order #{o.order_id}</h4>
                  <span style={{ fontWeight: 'bold' }}>{o.order_status}</span>
                </div>
                <p style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
                  Buyer: {o.buyer_name} ({o.buyer_phone})<br />
                  Item: {o.item_name} x{o.quantity}<br />
                  Total: ₹{o.total_amount}
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  {o.order_status === 'Placed' && <button onClick={() => handleUpdateOrder(o.order_id, 'confirm')} className="auth-btn" style={{ flex: 1, marginTop: 0, padding: '0.5rem' }}>Confirm</button>}
                  {o.order_status === 'Confirmed' && <button onClick={() => handleUpdateOrder(o.order_id, 'deliver')} className="auth-btn" style={{ flex: 1, marginTop: 0, padding: '0.5rem', background: 'linear-gradient(90deg, #00b09b, #96c93d)' }}>Mark Delivered</button>}
                  <button onClick={() => navigate(`/chat/${o.order_id}`)} className="auth-btn" style={{ flex: 1, marginTop: 0, padding: '0.5rem', background: 'transparent', border: '1px solid var(--primary-color)' }}>Chat</button>
                  {activeOrderTab === 'history' && (
                    <button onClick={() => setReportModal({ show: true, order: o })} className="auth-btn" style={{ flex: 1, marginTop: 0, padding: '0.5rem', background: 'var(--secondary-color)', color: 'white' }}>Report</button>
                  )}
                </div>
              </div>
            ))}
            {orders.filter(o => activeOrderTab === 'active' ? ['Placed', 'Confirmed'].includes(o.order_status) : ['Delivered', 'Cancelled'].includes(o.order_status)).length === 0 && (
              <p>No {activeOrderTab} orders found.</p>
            )}
          </div>
        </div>

      </div>

      {reportModal.show && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '90%', maxWidth: '500px' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--secondary-color)' }}>Report Order #{reportModal.order.order_id}</h3>
            <p style={{ fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--text-secondary)' }}>Report Buyer: {reportModal.order.buyer_name}</p>
            <form onSubmit={submitReport} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <textarea 
                placeholder="Why are you reporting this? Please provide details." 
                required 
                value={reportReason} 
                onChange={e => setReportReason(e.target.value)}
                style={{ padding: '1rem', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)', minHeight: '100px', resize: 'vertical' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Attach Proof (Image)</label>
                <input type="file" accept="image/*" onChange={handleReportFileChange} style={{ padding: '0.8rem', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid var(--border-color)' }} />
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="submit" className="auth-btn" style={{ flex: 1, marginTop: 0, background: 'var(--secondary-color)' }}>Submit Report</button>
                <button type="button" onClick={() => { setReportModal({ show: false, order: null }); setReportReason(''); setReportProof(''); }} className="auth-btn" style={{ flex: 1, marginTop: 0, background: 'transparent', border: '1px solid var(--text-secondary)' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SellerDashboard;
