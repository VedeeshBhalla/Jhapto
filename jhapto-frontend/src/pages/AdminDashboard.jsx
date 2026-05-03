import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../utils/api';

const AdminDashboard = () => {
  const [report, setReport] = useState([]);
  const [listings, setListings] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('report');
  
  const { admin, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'report') {
        const res = await api.get('/admin/report');
        setReport(res.data);
      } else if (activeTab === 'listings') {
        const res = await api.get('/admin/listings');
        setListings(res.data);
      } else if (activeTab === 'students') {
        const res = await api.get('/admin/students');
        setStudents(res.data);
      }
    } catch (err) {
      console.error('Error fetching admin data', err);
    }
  };

  const handleRemoveListing = async (id) => {
    try {
      console.log('Removing listing:', id);
      await api.delete(`/admin/listings/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error removing listing');
    }
  };

  const handleToggleBan = async (student) => {
    const action = student.is_banned ? 'unban' : 'ban';
    try {
      console.log(`Toggling ban for student ${student.student_id}, action: ${action}`);
      await api.patch(`/admin/students/${student.student_id}/${action}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(`Error trying to ${action} student`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-color)', color: 'white' }}>
      <header className="glass-panel" style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 0, borderTop: 0, borderLeft: 0, borderRight: 0 }}>
        <h1 className="text-gradient" style={{ background: 'linear-gradient(90deg, #ff9a9e, #fecfef)' }}>JHAPTO ADMIN</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold' }}>{admin?.email}</span>
          <button onClick={handleLogout} className="auth-btn" style={{ padding: '0.5rem 1rem', marginTop: 0, background: 'transparent', border: '1px solid var(--secondary-color)', color: 'var(--secondary-color)' }}>Logout</button>
        </div>
      </header>

      <div style={{ display: 'flex', padding: '2rem', gap: '2rem' }}>
        <div className="glass-panel" style={{ width: '250px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'flex-start' }}>
          <button onClick={() => setActiveTab('report')} style={{ padding: '1rem', background: activeTab==='report' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', borderRadius: '8px' }}>Financial Report</button>
          <button onClick={() => setActiveTab('listings')} style={{ padding: '1rem', background: activeTab==='listings' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', borderRadius: '8px' }}>Manage Listings</button>
          <button onClick={() => setActiveTab('students')} style={{ padding: '1rem', background: activeTab==='students' ? 'rgba(255,255,255,0.1)' : 'transparent', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', borderRadius: '8px' }}>Manage Students</button>
        </div>

        <div className="glass-panel" style={{ flex: 1, padding: '2rem', overflowX: 'auto' }}>
          {activeTab === 'report' && (
            <div>
              <h2 style={{ marginBottom: '1rem' }}>Seller Revenue Report</h2>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem' }}>Student</th>
                    <th style={{ padding: '1rem' }}>Floor</th>
                    <th style={{ padding: '1rem' }}>Listings</th>
                    <th style={{ padding: '1rem' }}>Orders Bought</th>
                    <th style={{ padding: '1rem' }}>Total Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map(r => (
                    <tr key={r.student_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>{r.student_name}</td>
                      <td style={{ padding: '1rem' }}>{r.floor_number}</td>
                      <td style={{ padding: '1rem' }}>{r.total_listings}</td>
                      <td style={{ padding: '1rem' }}>{r.total_orders}</td>
                      <td style={{ padding: '1rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>₹{r.total_revenue}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'listings' && (
            <div>
              <h2 style={{ marginBottom: '1rem' }}>Platform Listings</h2>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem' }}>Item</th>
                    <th style={{ padding: '1rem' }}>Seller</th>
                    <th style={{ padding: '1rem' }}>Price</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {listings.map(l => (
                    <tr key={l.listing_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>{l.item_name}</td>
                      <td style={{ padding: '1rem' }}>{l.seller_name}</td>
                      <td style={{ padding: '1rem' }}>
                        ₹{l.selling_price}
                        {!l.price_is_valid && <span style={{ color: 'var(--secondary-color)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>(Invalid)</span>}
                      </td>
                      <td style={{ padding: '1rem' }}>{l.listing_status}</td>
                      <td style={{ padding: '1rem' }}>
                        {l.listing_status !== 'Removed' && (
                          <button onClick={() => handleRemoveListing(l.listing_id)} style={{ padding: '0.4rem 0.8rem', background: 'var(--secondary-color)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Remove</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'students' && (
            <div>
              <h2 style={{ marginBottom: '1rem' }}>Registered Students</h2>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <th style={{ padding: '1rem' }}>Name</th>
                    <th style={{ padding: '1rem' }}>Email</th>
                    <th style={{ padding: '1rem' }}>Phone</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                    <th style={{ padding: '1rem' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.student_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '1rem' }}>{s.name}</td>
                      <td style={{ padding: '1rem' }}>{s.email}</td>
                      <td style={{ padding: '1rem' }}>{s.phone_no}</td>
                      <td style={{ padding: '1rem', color: s.is_banned ? 'var(--secondary-color)' : '#96c93d' }}>
                        {s.is_banned ? 'Banned' : 'Active'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <button 
                          onClick={() => handleToggleBan(s)} 
                          style={{ padding: '0.4rem 0.8rem', background: s.is_banned ? '#96c93d' : 'var(--secondary-color)', border: 'none', color: 'white', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          {s.is_banned ? 'Unban' : 'Ban'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
