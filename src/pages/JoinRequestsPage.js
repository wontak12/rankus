// JoinRequestsPage.js
// ✅ 목적: 랩실 가입 요청자 목록을 확인하고, 관리자가 승인/거절 처리 가능
// 📦 기능:
// - 이름, 이메일, 요청일 표시
// - 승인 / 거절 버튼
// - 리더, 부랩장만 접근 가능

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const initialRequests = [
  { id: 4, name: '최신청', email: 'join@lab.com', requestedAt: '2025-06-10' },
];


function JoinRequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState(initialRequests);

  const handleApprove = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    alert('승인되었습니다.');
  };

  const handleReject = (id) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
    alert('거절되었습니다.');
  };

  // test2 계정은 모든 권한(관리자)으로 간주
  const isAdmin = user?.role === 'admin' || user?.role === 'leader' || user?.role === 'sub' || user?.email === 'test2@hs.ac.kr';

  if (!isAdmin) {
    return <p>⚠️ 이 페이지는 관리자만 접근할 수 있습니다.</p>;
  }

  return (
    <div className="page">
      <h2>📨 가입 요청 승인</h2>
      <ul className="request-list">
        {requests.map((r) => (
          <li key={r.id}>
            <span>{r.name}</span>
            <span>{r.email}</span>
            <span>{r.requestedAt}</span>
            <button onClick={() => handleApprove(r.id)}>✅ 승인</button>
            <button onClick={() => handleReject(r.id)}>❌ 거절</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default JoinRequestsPage;
