import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Intro.css';

function Intro() {
  const navigate = useNavigate();
  return (
    <div className="intro-root">
      <h1 className="intro-logo">RANKUS</h1>
      <p className="intro-desc">한신대학교 랩실 관리 플랫폼</p>
      <div className="intro-btn-group">
        <button
          className="intro-btn"
          onClick={() => navigate('/login')}
        >
          로그인 하기
        </button>
        <button
          className="intro-btn signup"
          onClick={() => navigate('/signup')}
        >
          회원가입 하기
        </button>
      </div>
    </div>
  );
}

export default Intro;
