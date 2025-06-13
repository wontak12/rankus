import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/MyLab.css';

function FileSection() {
  const { user } = useAuth();
  const [files, setFiles] = useState([
    { id: 1, name: '세미나_발표자료.pdf', uploader: '김랩장', date: '2025-06-10' },
    { id: 2, name: 'MT계획안.pptx', uploader: '홍길동', date: '2025-06-11' },
  ]);

  const handleUpload = () => {
    // TODO: 파일 선택 + 업로드 처리
    alert('파일 업로드 기능은 추후 구현됩니다.');
  };

  return (
    <div className="mylab-card">
      <div className="mylab-card-title">📁 자료실</div>
      {user?.role === 'admin' && (
        <button className="mylab-join-btn" style={{marginBottom: '1rem'}} onClick={handleUpload}>📤 파일 업로드</button>
      )}
      <ul style={{padding: 0, listStyle: 'none'}}>
        {files.map((file) => (
          <li key={file.id} className="file-item" style={{display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.7rem'}}>
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

export default FileSection;
