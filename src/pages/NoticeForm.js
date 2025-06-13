import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function NoticeForm() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // 🚧 TODO: API POST 요청 또는 DB 저장
    console.log('공지사항 제출됨:', { title, content });
    navigate('/notice');
  };

  if (!user || user.role !== 'admin') {
    return <p>⚠️ 이 페이지는 관리자만 접근할 수 있습니다.</p>;
  }

  return (
    <div className="page" style={{maxWidth: 700, margin: '2.5rem auto'}}>
      <h2 style={{marginBottom: '1.2rem'}}>📌 공지사항 작성</h2>
      <form onSubmit={handleSubmit} className="notice-form" style={{display: 'flex', flexDirection: 'column', gap: '1.2rem'}}>
        <label style={{fontWeight: 600}}>
          제목:
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            style={{width: '100%', marginTop: '0.5rem', padding: '0.7rem', borderRadius: '0.7rem', border: '1.5px solid #b6c6e3'}}
          />
        </label>
        <label style={{fontWeight: 600}}>
          내용:
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={10}
            style={{width: '100%', marginTop: '0.5rem', padding: '0.7rem', borderRadius: '0.7rem', border: '1.5px solid #b6c6e3'}}
          />
        </label>
        <button type="submit" style={{background: '#67509C', color: '#fff', border: 'none', borderRadius: '1.2rem', padding: '0.7rem 1.5rem', fontWeight: 700, fontSize: '1.05rem', cursor: 'pointer'}}>✅ 저장</button>
      </form>
    </div>
  );
}

export default NoticeForm;
