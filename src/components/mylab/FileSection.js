import React from 'react';
import '../../styles/MyLab.css';

function FileSection({ labId }) {
  // TODO: labId로 파일 데이터 fetch
  return (
    <div className="mylab-card">
      <div className="mylab-card-title">파일 공유</div>
      <div className="mylab-card-content">파일 공유 기능 준비 중<br/>랩실 ID: {labId}</div>
    </div>
  );
}

export default FileSection;
