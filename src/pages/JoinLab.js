import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/JoinLab.css';

function JoinLab() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [fields, setFields] = useState({
    intro: '',
    major: '',
    studentId: '',
    motivation: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // TODO: 실제 API 연동 (POST /api/labs/:id/join)
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => navigate('/home'), 1800);
    }, 900);
  };

  if (success) {
    return (
      <div className="joinlab-root">
        <div className="joinlab-success">가입 신청이 완료되었습니다!<br/>승인 후 랩실에 참여하실 수 있습니다.<br/>잠시 후 홈으로 이동합니다.</div>
      </div>
    );
  }

  return (
    <div className="joinlab-root">
      <h2 className="joinlab-title">랩실 가입 신청</h2>
      <form className="joinlab-form" onSubmit={handleSubmit}>
        <div className="joinlab-field">
          <label htmlFor="intro">자기소개</label>
          <textarea id="intro" name="intro" value={fields.intro} onChange={handleChange} required disabled={loading} placeholder="간단한 자기소개를 입력하세요" />
        </div>
        <div className="joinlab-field">
          <label htmlFor="major">학과</label>
          <input id="major" name="major" value={fields.major} onChange={handleChange} required disabled={loading} placeholder="예: 컴퓨터공학과" />
        </div>
        <div className="joinlab-field">
          <label htmlFor="studentId">학번</label>
          <input id="studentId" name="studentId" value={fields.studentId} onChange={handleChange} required disabled={loading} placeholder="예: 20231234" />
        </div>
        <div className="joinlab-field">
          <label htmlFor="motivation">가입 동기</label>
          <textarea id="motivation" name="motivation" value={fields.motivation} onChange={handleChange} required disabled={loading} placeholder="랩실에 지원하게 된 동기를 입력하세요" />
        </div>
        {error && <div className="joinlab-error">{error}</div>}
        <button className="joinlab-btn" type="submit" disabled={loading}>가입 신청</button>
      </form>
    </div>
  );
}

export default JoinLab;
