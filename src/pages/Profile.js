import React, { useEffect, useState } from "react";
import api from "../api"; // Axios 인스턴스가 설정된 파일
import "../styles/Profile.css"; // 아래에 제공된 CSS 파일

// ENROLLED -> 재학중 과 같이 영문 상태를 한글로 변환하는 함수
const getEnrollmentStatusText = (status) => {
  const statusMap = {
    ENROLLED: "재학중",
    LEAVE_OF_ABSENCE: "휴학",
    GRADUATED: "졸업",
    // 필요에 따라 다른 상태 추가
  };
  return statusMap[status] || "알 수 없음";
};

function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        if (!token) {
          throw new Error("인증 토큰이 없습니다.");
        }

        // 1. API 엔드포인트를 명세에 맞게 '/api/users/me'로 변경
        const res = await api.get("/api/users/me", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        console.log("✅ 실제 서버 응답:", res.data); // 👈 이 줄을 추가하세요!
        // 2. API 응답 구조에 맞춰 res.data.data 에서 프로필 정보를 가져옴
        if (res.data && res.data.data) {
          setProfile(res.data.data);
        } else {
          // 서버가 success: false 를 응답했을 경우
          throw new Error(res.data.message || "프로필 정보를 가져오지 못했습니다.");
        }
      } catch (err) {
        console.error("프로필 불러오기 실패:", err);
        setError(err.response ? err.response.data.message : err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []); // 컴포넌트 마운트 시 한 번만 실행

  // 3. 로딩 상태 처리
  if (loading) {
    return <div className="profile-status">로딩 중...</div>;
  }

  // 4. 에러 상태 처리
  if (error) {
    return <div className="profile-status error">오류: {error}</div>;
  }

  // 데이터가 정상적으로 로드되지 않은 경우
  if (!profile) {
    return <div className="profile-status">프로필 정보를 표시할 수 없습니다.</div>;
  }

  return (
    <div className="profile-container">
      <h1 className="profile-title">내 정보</h1>
      <div className="profile-card">
        <div className="profile-item">
          <span className="profile-label">이름</span>
          <span className="profile-value">{profile.name}</span>
        </div>
        <div className="profile-item">
          <span className="profile-label">이메일</span>
          <span className="profile-value">{profile.email}</span>
        </div>
        <div className="profile-item">
          <span className="profile-label">학번</span>
          <span className="profile-value">{profile.studentNumber}</span>
        </div>
        <div className="profile-item">
          <span className="profile-label">연락처</span>
          <span className="profile-value">{profile.phoneNumber}</span>
        </div>
        <div className="profile-item">
          <span className="profile-label">학년</span>
          <span className="profile-value">{profile.grade}학년</span>
        </div>
        <div className="profile-item">
          <span className="profile-label">재학 상태</span>
          <span className="profile-value">
            {getEnrollmentStatusText(profile.enrollmentStatus)}
          </span>
        </div>
        <div className="profile-item">
          <span className="profile-label">가입일</span>
          <span className="profile-value">
            {new Date(profile.createdAt).toLocaleDateString("ko-KR")}
          </span>
        </div>
        {profile.labId && (
          <div className="profile-item">
            <span className="profile-label">연구실 ID</span>
            <span className="profile-value">{profile.labId}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;