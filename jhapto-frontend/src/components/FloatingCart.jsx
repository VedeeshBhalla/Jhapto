import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import './FloatingCart.css';

const FloatingCart = ({ cartItems, onCheckout }) => {
  if (cartItems.length === 0) return null;

  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const totalAmount = cartItems.reduce((total, item) => total + (item.selling_price * item.quantity), 0);

  return (
    <div className="floating-cart-wrapper">
      <div className="floating-cart glass-panel">
        <div className="cart-info">
          <div className="cart-icon-wrapper">
            <ShoppingBag size={24} />
            <span className="item-count">{itemCount}</span>
          </div>
          <div className="cart-text">
            <span className="cart-label">Items in Cart</span>
            <span className="cart-total">₹{totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <button className="checkout-btn" onClick={onCheckout}>
          Checkout <ArrowRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default FloatingCart;
