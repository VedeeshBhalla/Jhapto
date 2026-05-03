import React from 'react';
import './CategoryList.css';

const categories = [
  { id: 1, name: 'Snacks', icon: '🍿' },
  { id: 2, name: 'Beverages', icon: '🧃' },
  { id: 3, name: 'Noodles', icon: '🍜' },
  { id: 4, name: 'Chocolates', icon: '🍫' },
  { id: 5, name: 'Essentials', icon: '🪥' },
  { id: 6, name: 'Stationery', icon: '🖊️' },
];

const CategoryList = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="category-section">
      <h3 className="section-title">Shop by Category</h3>
      <div className="category-list">
        {categories.map(category => (
          <div 
            key={category.id} 
            className={`category-card glass-panel ${selectedCategory === category.name ? 'active' : ''}`}
            onClick={() => onSelectCategory(selectedCategory === category.name ? null : category.name)}
            style={selectedCategory === category.name ? { borderColor: 'var(--primary-color)', background: 'rgba(69, 243, 255, 0.1)', transform: 'translateY(-5px)', boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)' } : {}}
          >
            <div className="category-icon">{category.icon}</div>
            <span className="category-name">{category.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryList;
