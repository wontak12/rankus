import React from 'react';
import '../../styles/MyLab.css';

function CalendarSection({ labId }) {
  // TODO: labId로 일정 데이터 fetch
  return (
    <div className="mylab-card">
      <div className="mylab-card-title">캘린더</div>
      <div className="mylab-card-content">캘린더 기능(일정, 모임 등) 준비 중<br/>랩실 ID: {labId}</div>
    </div>
  );
}

export default CalendarSection;
