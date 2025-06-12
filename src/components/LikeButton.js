import React from 'react';

function LikeButton({ liked, onClick }) {
  // TODO: 좋아요 버튼 UI 구현
  return <button onClick={onClick}>{liked ? '♥' : '♡'}</button>;
}

export default LikeButton;
