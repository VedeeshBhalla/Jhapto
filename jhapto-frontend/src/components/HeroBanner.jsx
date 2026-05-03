import React from 'react';
import './HeroBanner.css';

const HeroBanner = () => {
  return (
    <div className="hero-banner">
      <div className="banner-content">
        <h2 className="banner-title">
          Late Night Cravings?<br />
          <span className="text-gradient">Delivered in Minutes.</span>
        </h2>
        <p className="banner-subtitle" style={{ marginBottom: 0 }}>
          From your peers in Kailash Hostel, straight to your room.
        </p>
      </div>
      
      <div className="banner-visuals">
        <div className="floating-item item-1">🍜</div>
        <div className="floating-item item-2">🥤</div>
        <div className="floating-item item-3">🍫</div>
      </div>
    </div>
  );
};

export default HeroBanner;
