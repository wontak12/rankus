import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/AuthForm.css';

function AuthForm({ mode, setUser }) {
  const navigate = useNavigate();
  const [fields, setFields] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 로그인/회원가입 폼 제출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        if (!fields.email || !fields.password) {
          setError('이메일과 비밀번호를 입력하세요.');
          setLoading(false);
          return;
        }
        // TODO: 실제 로그인 API 연동
        // 예시: const res = await fetch('/api/auth/login', ...)
        // 성공 시 랩실 가입 여부 확인 후 라우팅
        // 임시 로직 (실제 API 연동 필요)
        if (fields.email === 'test2@hs.ac.kr' && fields.password === '1234') {
          // AI 연구실 가입된 계정
          if (setUser) setUser({ name: '신현재', email: 'test2@hs.ac.kr', joinedLab: {
            id: 1,
            title: 'AI 연구실',
            professor: '김한신',
            description: '인공지능 및 데이터 분석을 연구하는 랩실입니다. 다양한 프로젝트와 논문 연구를 진행합니다.',
            image: '',
            createdAt: '2025-06-13',
          }});
          if (navigate) navigate('/home');
        } else if (fields.email === 'test@hs.ac.kr' && fields.password === '1234') {
          // 랩실 미가입 계정
          if (setUser) setUser({ name: '홍길동', email: 'test@hs.ac.kr' });
          if (navigate) navigate('/home');
        } else {
          setError('이메일 또는 비밀번호가 올바르지 않습니다.');
        }
      } else {
        // 회원가입
        if (!fields.name || !fields.email || !fields.password || !fields.confirm) {
          setError('모든 필드를 입력하세요.');
          setLoading(false);
          return;
        }
        if (fields.password !== fields.confirm) {
          setError('비밀번호가 일치하지 않습니다.');
          setLoading(false);
          return;
        }
        // TODO: 실제 회원가입 API 연동
        // 임시 성공 처리
        if (navigate) navigate('/login');
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다.');
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFields({ ...fields, [e.target.name]: e.target.value });
  };

  return (
    <form className="auth-form-root" onSubmit={handleSubmit}>
      <div className="auth-form-title">{mode === 'login' ? '로그인' : '회원가입'}</div>
      {error && <div className="auth-form-error">{error}</div>}
      {mode === 'signup' && (
        <div className="auth-form-field">
          <label htmlFor="name">이름</label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={fields.name}
            onChange={handleChange}
            disabled={loading}
            placeholder="이름을 입력하세요"
          />
        </div>
      )}
      <div className="auth-form-field">
        <label htmlFor="email">이메일</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={fields.email}
          onChange={handleChange}
          disabled={loading}
          placeholder="이메일을 입력하세요"
        />
      </div>
      <div className="auth-form-field">
        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          value={fields.password}
          onChange={handleChange}
          disabled={loading}
          placeholder="비밀번호를 입력하세요"
        />
      </div>
      {mode === 'signup' && (
        <div className="auth-form-field">
          <label htmlFor="confirm">비밀번호 확인</label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={fields.confirm}
            onChange={handleChange}
            disabled={loading}
            placeholder="비밀번호를 다시 입력하세요"
          />
        </div>
      )}
      <button className="auth-form-btn" type="submit" disabled={loading}>
        {mode === 'login' ? '로그인' : '회원가입'}
      </button>
      {mode === 'login' ? (
        <div className="auth-form-link" onClick={() => {
          console.log('navigate:', navigate);
          if (navigate) navigate('/signup');
        }}>
          회원가입이 필요하신가요?
        </div>
      ) : (
        <div className="auth-form-link" onClick={() => {
          console.log('navigate:', navigate);
          if (navigate) navigate('/login');
        }}>
          이미 계정이 있으신가요? 로그인
        </div>
      )}
    </form>
  );
}

export default AuthForm;
