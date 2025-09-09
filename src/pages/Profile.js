import React, { useEffect, useState } from "react";
import api from "../api";
import { useAuth } from "../contexts/AuthContext";
import "../styles/Profile.css";

function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await api.get("/api/profile", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        setProfile(res.data);
      } catch (err) {
        console.error("프로필 불러오기 실패:", err);
      }
    }
    fetchProfile();
  }, []);

  if (!profile) return <div>로딩 중...</div>;

  return (
    <div className="profile-root">
      <h2 className="profile-title">내 정보</h2>
      <div className="profile-info">
        <div>
          <b>이름:</b> {profile.name}
        </div>
        <div>
          <b>이메일:</b> {profile.email}
        </div>
        <div>
          <b>가입일:</b> {profile.joinedAt}
        </div>
      </div>
    </div>
  );
}

export default Profile;
