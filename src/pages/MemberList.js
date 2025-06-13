

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './MemberList.css';

const initialMembers = [
  { id: 1, name: '김랩장', email: 'leader@lab.com', role: 'leader', status: '활성', joined: '2023-03-01', lastLogin: '2025-06-10 10:08:07' },
  { id: 2, name: '이부랩', email: 'sub@lab.com', role: 'sub', status: '이메일 인증 전', joined: '2023-04-15', lastLogin: '' },
  { id: 3, name: '박멤버', email: 'user@lab.com', role: 'member', status: '비활성', joined: '2024-01-20', lastLogin: '2025-06-01 09:00:00' },
];

function MemberList() {
  const { user } = useAuth();
  const [members, setMembers] = useState(initialMembers);
  const navigate = useNavigate();

  const handleRoleChange = (id, newRole) => {
    setMembers(prev =>
      prev.map((m) => (m.id === id ? { ...m, role: newRole } : m))
    );
  };

  const isAdmin = user?.role === 'leader' || user?.role === 'sub' || user?.role === 'admin' || user?.email === 'test2@hs.ac.kr';

  return (
    <div className="member-manage-root">
      <div className="member-manage-tabs">
        <button className="tab active">멤버 관리</button>
        <button className="tab" onClick={() => navigate('/join-requests')}>가입 요청 관리</button>
      </div>
      <div className="member-manage-table-wrap">
        <table className="member-manage-table">
          <thead>
            <tr>
              <th>이메일</th>
              <th>이름</th>
              <th>역할</th>
              <th>상태</th>
              <th>가입일</th>
              <th>마지막 로그인</th>
              <th>상세</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} className="member-row">
                <td>{m.email}</td>
                <td>{m.name}</td>
                <td>
                  {isAdmin ? (
                    <select
                      value={m.role}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                    >
                      <option value="leader">랩장</option>
                      <option value="sub">부랩장</option>
                      <option value="member">랩원</option>
                    </select>
                  ) : (
                    m.role === 'leader' ? '랩장' : m.role === 'sub' ? '부랩장' : '랩원'
                  )}
                </td>
                <td>{m.status}</td>
                <td>{m.joined}</td>
                <td>{m.lastLogin || '-'}</td>
                <td>
                  <button className="detail-btn" onClick={() => navigate(`/member/${m.id}`)}>상세</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default MemberList;
