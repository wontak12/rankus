import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MyLab.css';

function NoLab() {
  const navigate = useNavigate();
  return (
    <div className="mylab-root">
      <h2 className="mylab-title">내 랩실</h2>
      <div className="mylab-desc">가입된 랩실이 없습니다.</div>
      <button className="mylab-join-btn" onClick={() => navigate('/promo')}>랩실 가입하러 가기</button>
    </div>
  );
}

export default NoLab;
