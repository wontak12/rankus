import React, { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../styles/MyLab.css';
import HeaderSection from '../components/mylab/HeaderSection';
import CalendarSection from '../components/mylab/CalendarSection';
import VoteSection from '../components/mylab/VoteSection';
import NoticeSection from '../components/mylab/NoticeSection';
import FileSection from '../components/mylab/FileSection';
import MemberSection from '../components/mylab/MemberSection';

function MyLab() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // 랩실 미가입 시 안내 및 이동
  useEffect(() => {
    if (user && !user.joinedLab) {
      navigate('/my-lab/no-lab', { replace: true });
    }
  }, [user, navigate]);

  // 랩실 정보 추출
  const lab = user?.joinedLab;
  if (!lab) return null;

  return (
    <div className="mylab-container">
      {/* 랩실 소개 및 헤더 */}
      <HeaderSection lab={lab} />

      {/* 기능 섹션들 */}
      <div className="mylab-grid">
        <CalendarSection labId={lab.id} />
        <VoteSection labId={lab.id} />
        <NoticeSection labId={lab.id} />
        <FileSection labId={lab.id} />
        <MemberSection labId={lab.id} />
      </div>
    </div>
  );
}

export default MyLab;
