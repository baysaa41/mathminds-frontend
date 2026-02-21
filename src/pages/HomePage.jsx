// src/pages/HomePage.jsx

import React from 'react';
import { Link } from 'react-router-dom';
import authService from '../services/authService';

function HomePage() {
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();

  return (
    <div
      style={{
        maxWidth: '800px',
        margin: '50px auto',
        padding: '20px',
        textAlign: 'center',
      }}
    >
      <h1>🧮 MathMinds.Club</h1>
      <p>Математикийн сургалтын платформ</p>

      {isAuthenticated && user ? (
        <div>
          <p>
            Сайн байна уу, <strong>{user.name}</strong>!
          </p>
          <Link to="/dashboard">
            <button
              style={{
                padding: '12px 24px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
                marginRight: '10px',
              }}
            >
              Dashboard руу орох
            </button>
          </Link>
          <button
            onClick={() => {
              authService.logout();
              window.location.reload();
            }}
            style={{
              padding: '12px 24px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Гарах
          </button>
        </div>
      ) : (
        <div>
          <p>Эхлэхийн тулд нэвтэрнэ үү</p>
          <Link to="/login">
            <button
              style={{
                padding: '12px 24px',
                backgroundColor: '#2196F3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '16px',
              }}
            >
              Нэвтрэх
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}

export default HomePage;
