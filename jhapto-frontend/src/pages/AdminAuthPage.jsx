import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import api from '../utils/api';
import '../pages/AuthPage.css';

const AdminAuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const { loginAdmin } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (isLogin) {
      try {
        await loginAdmin(formData.email, formData.password);
        navigate('/admin/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred during login.');
      }
    } else {
      try {
        const res = await api.post('/admin/register', formData);
        setSuccess(res.data.message);
        setIsLogin(true); // switch back to login after successful registration
        setFormData({ name: '', email: '', password: '' });
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred during registration.');
      }
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel" style={{ border: '1px solid var(--secondary-color)' }}>
        <h2 className="text-gradient auth-title">JHAPTO ADMIN</h2>
        <h3 className="auth-subtitle">{isLogin ? 'Restricted Access' : 'Create Admin Account'}</h3>
        
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-error" style={{ background: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71', border: '1px solid #2ecc71' }}>{success}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <input type="text" name="name" placeholder="Admin Name" required onChange={handleChange} value={formData.name} />
          )}
          <input type="email" name="email" placeholder="Admin Email" required onChange={handleChange} value={formData.email} />
          <input type="password" name="password" placeholder="Password" required onChange={handleChange} value={formData.password} />
          
          <button type="submit" className="auth-btn" style={{ background: 'linear-gradient(90deg, var(--secondary-color), #ff9a9e)' }}>
            {isLogin ? 'Admin Login' : 'Register Admin'}
          </button>
        </form>
        
        <p className="auth-switch">
          {isLogin ? "Need admin access? " : "Already an admin? "}
          <span onClick={() => { setIsLogin(!isLogin); setError(''); setSuccess(''); }} className="text-gradient" style={{cursor: 'pointer'}}>
            {isLogin ? 'Register here' : 'Login here'}
          </span>
        </p>

        <p className="auth-switch" style={{ marginTop: '1rem' }}>
          <span onClick={() => navigate('/login')} className="text-gradient" style={{cursor: 'pointer'}}>
            Back to Student Portal
          </span>
        </p>
      </div>
    </div>
  );
};

export default AdminAuthPage;
