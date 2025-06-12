import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LabCard from '../components/LabCard.js';
import '../styles/LabPromo.css';

function LabPromo() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // TODO: 실제 API 연동 (GET /api/labs)
    // 임시 더미 데이터
    setTimeout(() => {
      setLabs([
        {
          id: 1,
          title: 'AI 연구실',
          description: '인공지능 및 데이터 분석 연구',
          image: '',
          professor: '홍길동',
          createdAt: '2024-06-01',
          likes: 12,
        },
        {
          id: 2,
          title: 'IoT 랩',
          description: '사물인터넷 기반 융합 연구',
          image: '',
          professor: '이순신',
          createdAt: '2024-05-20',
          likes: 8,
        },
      ]);
      setLoading(false);
    }, 600);
  }, []);

  return (
    <div className="labpromo-root">
      <div className="labpromo-title">한신대학교 랩실을 소개합니다.</div>
      <div className="labpromo-topbar">
        <button className="labpromo-create-btn" onClick={() => navigate('/create-lab')}>
          랩실을 개설하시겠습니까?
        </button>
      </div>
      {loading ? (
        <div className="labpromo-empty">랩실 목록을 불러오는 중...</div>
      ) : labs.length === 0 ? (
        <div className="labpromo-empty">등록된 랩실이 없습니다.</div>
      ) : (
        <div className="labpromo-grid">
          {labs.map(lab => (
            <div key={lab.id} onClick={() => navigate(`/lab/${lab.id}`)} style={{ cursor: 'pointer' }}>
              <LabCard {...lab} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LabPromo;
