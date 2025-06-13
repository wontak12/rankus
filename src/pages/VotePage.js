import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const pollList = [
  {
    id: 1,
    title: '다음 MT 날짜',
    options: ['6/30', '7/7', '7/14'],
    votes: [4, 3, 5],
    deadline: '2025-06-15',
  },
];

function VotePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="page" style={{maxWidth: 700, margin: '2.5rem auto'}}>
      <h2 style={{marginBottom: '1.2rem'}}>🗳️ 전체 투표</h2>
      {user?.role === 'admin' && (
        <button className="create-button" style={{marginBottom: '1rem'}} onClick={() => navigate('/vote/create')}>
          ➕ 새 투표 생성
        </button>
      )}
      {pollList.map((poll) => (
        <div key={poll.id} className="poll-card" style={{background: '#f8f9fc', borderRadius: '1.1rem', boxShadow: '0 1px 4px rgba(26,35,126,0.04)', padding: '1.1rem 1rem 1rem 1rem', marginBottom: '1.2rem'}}>
          <h4 style={{marginBottom: '0.5rem'}}>{poll.title}</h4>
          <span style={{color: '#b6c6e3', fontSize: '0.97rem'}}>마감: {poll.deadline}</span>
          <ul style={{padding: 0, listStyle: 'none', marginTop: '0.7rem'}}>
            {poll.options.map((opt, idx) => (
              <li key={idx} style={{marginBottom: '0.3rem'}}>
                {opt} — {poll.votes[idx]}표
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default VotePage;
