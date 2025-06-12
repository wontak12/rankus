import React from 'react';
import AuthForm from '../components/AuthForm.js';

function Signup() {
  return (
    <div className="signup-page">
      <AuthForm mode="signup" />
    </div>
  );
}

export default Signup;
