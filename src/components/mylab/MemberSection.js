import React from 'react';
import '../../styles/MyLab.css';

function MemberSection({ labId }) {
  // TODO: labId로 멤버 데이터 fetch
  return (
    <div className="mylab-card">
      <div className="mylab-card-title">멤버 목록</div>
      <div className="mylab-card-content">멤버 목록 기능 준비 중<br/>랩실 ID: {labId}</div>
    </div>
  );
}

export default MemberSection;
