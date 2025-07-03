// src/pages/Signup.js
import React from 'react';
import AuthForm from '../components/AuthForm';

function Signup() {
  return (
    <div className="signup-page">
      <AuthForm mode="signup" />
    </div>
  );
}

export default Signup;
