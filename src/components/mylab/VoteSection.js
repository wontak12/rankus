import React from 'react';
import '../../styles/MyLab.css';

function VoteSection({ labId }) {
  // TODO: labId로 투표 데이터 fetch
  return (
    <div className="mylab-card">
      <div className="mylab-card-title">투표</div>
      <div className="mylab-card-content">투표 기능 준비 중<br/>랩실 ID: {labId}</div>
    </div>
  );
}

export default VoteSection;
