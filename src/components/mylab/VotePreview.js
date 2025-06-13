import React from 'react';
import { useNavigate } from 'react-router-dom';

const activePolls = [
  { id: 1, title: '다음 MT 날짜', deadline: '2025-06-15' },
  { id: 2, title: '랩 티셔츠 디자인 투표', deadline: '2025-06-20' },
];

function VotePreview() {
  const navigate = useNavigate();

  return (
    <div className="mylab-card">
      <div className="mylab-card-title">🗳️ 현재 투표</div>
      <ul style={{padding: 0, listStyle: 'none'}}>
        {activePolls.map((poll) => (
          <li key={poll.id} className="poll-item" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: '0.5rem'}} onClick={() => navigate(`/vote/${poll.id}`)}>
            <span style={{fontWeight: 600}}>{poll.title}</span>
            <span style={{color: '#b6c6e3', fontSize: '0.97rem'}}>{poll.deadline} 마감</span>
          </li>
        ))}
      </ul>
      <div className="see-more" style={{color: '#67509C', cursor: 'pointer', fontWeight: 700, marginTop: '0.7rem'}} onClick={() => navigate('/vote')}>
        ➕ 전체 보기
      </div>
    </div>
  );
}

export default VotePreview;
