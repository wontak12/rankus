import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 🚧 TODO: 실제 공지 목록 데이터는 API 연동 필요
const allNotices = [
  { id: 1, title: '6월 전체 랩 회의 일정 안내', date: '2025-06-10' },
  { id: 2, title: 'MT 신청 마감일 안내', date: '2025-06-08' },
  { id: 3, title: '랩실 청소 당번 배정표 (6월)', date: '2025-06-05' },
];

function NoticePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCreate = () => {
    navigate('/notice/create');
  };

  return (
    <div className="notice-page" style={{maxWidth: 700, margin: '2.5rem auto'}}>
      <h2 style={{marginBottom: '1.2rem'}}>📋 전체 공지사항</h2>
      {user?.role === 'admin' && (
        <button onClick={handleCreate} className="create-button" style={{marginBottom: '1rem'}}>📌 새 공지 작성</button>
      )}
      <ul className="notice-list" style={{padding: 0, listStyle: 'none'}}>
        {allNotices.map((notice) => (
          <li key={notice.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '0.7rem'}} onClick={() => navigate(`/notice/${notice.id}`)}>
            <span style={{fontWeight: 600}}>{notice.title}</span>
            <span style={{color: '#b6c6e3', fontSize: '0.97rem'}}>{notice.date}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default NoticePage;
