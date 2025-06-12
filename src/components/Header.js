import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Header.css';

// 실제로는 Context, Redux, 또는 props로 유저 정보를 받아야 함
function Header({ user }) {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const isMainOrAuth = location.pathname === '/' || location.pathname === '/login' || location.pathname === '/signup';
  const displayUser = user || auth.user;
  return (
    <header className="rankus-header">
      <div className="rankus-header-inner">
        <span
          className="rankus-header-logo-text"
          onClick={() => navigate('/home')}
        >
          RANKUS
        </span>
        <span className="rankus-header-desc"></span>
        {displayUser && !isMainOrAuth && (
          <div className="rankus-header-profile-group">
            <div className="rankus-header-profile" onClick={() => navigate('/profile')}>
              <span className="rankus-header-profile-name">{displayUser.name}</span>
            </div>
            <button
              className="rankus-header-logout-btn"
              onClick={() => {
                auth.setUser(null);
                navigate('/');
              }}
            >
              로그아웃
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
