import React from 'react';
import '../styles/Profile.css';

function Profile() {
  // TODO: 실제 사용자 정보 API 연동
  return (
    <div className="profile-root">
      <h2 className="profile-title">내 정보</h2>
      <div className="profile-info">
        <div><b>이름:</b> 홍길동</div>
        <div><b>이메일:</b> test@hanshin.ac.kr</div>
        <div><b>가입일:</b> 2024-06-13</div>
      </div>
    </div>
  );
}

export default Profile;
