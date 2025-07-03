// src/pages/Login.js
import React from 'react';
import AuthForm from '../components/AuthForm';

function Login() {
  return (
    <div className="login-page">
      <AuthForm mode="login" />
    </div>
  );
}

export default Login;