import React from 'react';
import AuthForm from '../components/AuthForm.js';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Login() {
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = React.useState({ email: '', password: '' });

  const handleLogin = async (e) => {
    e.preventDefault();
    // test2@hs.ac.kr: AI 연구실 가입, test@hs.ac.kr: 랩실 미가입
    if (fields.email === 'test2@hs.ac.kr' && fields.password === '1234') {
      setUser({ name: '신현재', email: 'test2@hs.ac.kr', joinedLab: {
        id: 1,
        title: 'AI 연구실',
        professor: '김한신',
        description: '인공지능 및 데이터 분석을 연구하는 랩실입니다. 다양한 프로젝트와 논문 연구를 진행합니다.',
        image: '',
        createdAt: '2025-06-13',
      }});
      navigate('/home');
    } else if (fields.email === 'test@hs.ac.kr' && fields.password === '1234') {
      setUser({ name: '홍길동', email: 'test@hs.ac.kr' });
      navigate('/home');
    } else {
      // 로그인 실패 처리(선택)
      alert('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div className="login-page">
      <AuthForm mode="login" setUser={setUser} navigate={navigate} />
    </div>
  );
}

export default Login;
