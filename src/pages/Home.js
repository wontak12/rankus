import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!user) return;
    if (user.joinedLab) {
      navigate('/my-lab', { replace: true });
    } else {
      navigate('/promo', { replace: true });
    }
  }, [user, navigate]);

  return <div>이동 중...</div>;
}

export default Home;
