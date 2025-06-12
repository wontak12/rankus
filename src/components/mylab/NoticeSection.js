import React from 'react';
import '../../styles/MyLab.css';

function NoticeSection({ labId }) {
  // TODO: labId로 공지사항 데이터 fetch
  return (
    <div className="mylab-card">
      <div className="mylab-card-title">공지사항</div>
      <div className="mylab-card-content">공지사항 기능 준비 중<br/>랩실 ID: {labId}</div>
    </div>
  );
}

export default NoticeSection;
