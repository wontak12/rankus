// MemberDetail.js
// ✅ 목적: 특정 멤버의 상세 정보(이름, 이메일, 역할, 가입일 등) 보기
// 📦 기능:
// - 멤버 정보 표시
// - 랩장만 권한 수정 가능
// - 개인정보는 클릭 전에는 목록에서 보이지 않음

import React from 'react';
import { useParams } from 'react-router-dom';

// 🚧 Mock 데이터
const mockData = {
  1: { name: '김랩장', email: 'leader@lab.com', role: 'leader', joined: '2023-03-01' },
  2: { name: '이부랩', email: 'sub@lab.com', role: 'sub', joined: '2023-04-15' },
  3: { name: '박멤버', email: 'user@lab.com', role: 'member', joined: '2024-01-20' },
};

function MemberDetail() {
  const { id } = useParams();
  const member = mockData[id];

  if (!member) return <p>🙁 멤버를 찾을 수 없습니다.</p>;

  return (
    <div className="page">
      <h2>{member.name} 님의 정보</h2>
      <p><strong>이메일:</strong> {member.email}</p>
      <p><strong>역할:</strong> {member.role}</p>
      <p><strong>가입일:</strong> {member.joined}</p>
    </div>
  );
}

export default MemberDetail;
