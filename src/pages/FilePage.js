import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const allFiles = [
  { id: 1, name: '세미나_발표자료.pdf', uploader: '김랩장', date: '2025-06-10' },
  { id: 2, name: '랩 소개.pptx', uploader: '이선유', date: '2025-06-07' },
];

function FilePage() {
  const { user } = useAuth();

  const handleUpload = () => {
    alert('파일 업로드 기능은 추후 구현 예정입니다.');
  };

  return (
    <div className="page" style={{maxWidth: 700, margin: '2.5rem auto'}}>
      <h2 style={{marginBottom: '1.2rem'}}>📚 자료실</h2>
      {user?.role === 'admin' && (
        <button className="create-button" style={{marginBottom: '1rem'}} onClick={handleUpload}>📤 파일 업로드</button>
      )}
      <ul className="file-list" style={{padding: 0, listStyle: 'none'}}>
        {allFiles.map((file) => (
          <li key={file.id} style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.7rem'}}>
            <span style={{flex: 2}}>{file.name}</span>
            <span style={{flex: 1, color: '#67509C'}}>{file.uploader}</span>
            <span style={{flex: 1, color: '#b6c6e3'}}>{file.date}</span>
            <button style={{background: '#e3f0ff', color: '#67509C', borderRadius: '1.2rem', padding: '0.18rem 1.1rem', border: 'none', fontWeight: 700, cursor: 'pointer'}}>⬇ 다운로드</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default FilePage;
