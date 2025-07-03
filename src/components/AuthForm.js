// src/components/AuthForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import '../styles/AuthForm.css';

function AuthForm({ mode }) {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [fields, setFields] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setFields((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { email, password } = fields;
        if (!email || !password) {
          setError('이메일과 비밀번호를 입력하세요.');
          setLoading(false);
          return;
        }

        const response = await axios.post(
          'http://3.34.229.56:8080/api/auth/login',
          { email, password },
          { headers: { 'Content-Type': 'application/json' } }
        );

        console.log('로그인 응답 전체:', response.data);
        // 예: response.data = { token: '...', user: { name, email, ... } }
        // 또는 response.data = { token: '...', name: '홍길동', email: '...' }

        if (response.status === 200) {
          // 1) user가 response.data.user에 있는지
          const apiUser = response.data.data.user ?? {
            name: response.data.data.name,
            email: response.data.data.email,
          };

          console.log('저장할 user:', apiUser);
          setUser(apiUser);

          // 토큰 저장
          localStorage.setItem('token', response.data.token);
          navigate('/home');
        } else {
          setError(response.data.message || '로그인에 실패했습니다.');
        }
      } else {
        // 회원가입 로직 (생략 가능)
        const { name, email, password, confirm } = fields;
        if (!name || !email || !password || !confirm) {
          setError('모든 필드를 입력하세요.');
          setLoading(false);
          return;
        }
        if (password !== confirm) {
          setError('비밀번호가 일치하지 않습니다.');
          setLoading(false);
          return;
        }

        const response = await axios.post(
          'http://3.34.229.56:8080/api/auth/signup',
          { name, email, password },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if ([200, 201].includes(response.status)) {
          navigate('/login');
        } else {
          setError(response.data.message || '회원가입에 실패했습니다.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('서버 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form-root" onSubmit={handleSubmit}>
      <h2 className="auth-form-title">
        {mode === 'login' ? '로그인' : '회원가입'}
      </h2>

      {error && <div className="auth-form-error">{error}</div>}

      {mode === 'signup' && (
        <div className="auth-form-field">
          <label htmlFor="name">이름</label>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="이름을 입력하세요"
            value={fields.name}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      )}

      <div className="auth-form-field">
        <label htmlFor="email">이메일</label>
        <input
          id="email"
          name="email"
          type="email"
          placeholder="이메일을 입력하세요"
          value={fields.email}
          onChange={handleChange}
          disabled={loading}
        />
      </div>

      <div className="auth-form-field">
        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="비밀번호를 입력하세요"
          value={fields.password}
          onChange={handleChange}
          disabled={loading}
        />
      </div>

      {mode === 'signup' && (
        <div className="auth-form-field">
          <label htmlFor="confirm">비밀번호 확인</label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            placeholder="비밀번호를 다시 입력하세요"
            value={fields.confirm}
            onChange={handleChange}
            disabled={loading}
          />
        </div>
      )}

      <button
        className="auth-form-btn"
        type="submit"
        disabled={loading}
      >
        {mode === 'login' ? '로그인' : '회원가입'}
      </button>

      <div
        className="auth-form-link"
        onClick={() => navigate(mode === 'login' ? '/signup' : '/login')}
      >
        {mode === 'login'
          ? '회원가입이 필요하신가요?'
          : '이미 계정이 있으신가요? 로그인'}
      </div>
    </form>
  );
}

export default AuthForm;
