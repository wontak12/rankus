import React from 'react';
import { useNavigate } from 'react-router-dom';

const dummyFiles = [
  { id: 1, name: '세미나_발표자료.pdf', uploader: '김랩장', date: '2025-06-10' },
  { id: 2, name: '연구계획서_초안.docx', uploader: '홍길동', date: '2025-06-09' },
];

function FilePreview() {
  const navigate = useNavigate();

  return (
    <div className="mylab-card">
      <div className="mylab-card-title">📁 최근 자료</div>
      <ul style={{padding: 0, listStyle: 'none'}}>
        {dummyFiles.map((file) => (
          <li key={file.id} className="file-item" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
            <span style={{fontWeight: 600}}>{file.name}</span>
            <span style={{color: '#b6c6e3', fontSize: '0.97rem'}}>{file.date}</span>
          </li>
        ))}
      </ul>
      <div className="see-more" style={{color: '#67509C', cursor: 'pointer', fontWeight: 700, marginTop: '0.7rem'}} onClick={() => navigate('/file')}>
        ➕ 전체 보기
      </div>
    </div>
  );
}

export default FilePreview;
