import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/LabDetail.css';
import CommentList from '../components/CommentList';
import LikeButton from '../components/LikeButton';

function LabDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  // TODO: 실제 API 연동 (GET /api/labs/:id)
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false); // 작성자 여부
  const [joined, setJoined] = useState(false); // 랩실 가입 여부
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    // 임시 더미 데이터
    setTimeout(() => {
      setLab({
        id,
        title: 'AI 연구실',
        content: '인공지능 및 데이터 분석을 연구하는 랩실입니다. 다양한 프로젝트와 논문 연구를 진행합니다.',
        image: '',
        author: '홍길동',
        createdAt: '2025-06-13',
        professor: '김한신',
        likes: 12,
      });
      setLikes(12);
      setIsOwner(false); // TODO: 실제 로그인 유저와 비교
      setJoined(false); // TODO: 실제 가입 여부 확인
      setComments([
        { id: 1, author: '이순신', content: '좋은 연구 기대합니다!', createdAt: '2025-06-13' },
        { id: 2, author: '유관순', content: '참여하고 싶어요!', createdAt: '2025-06-13' },
      ]);
      setLoading(false);
    }, 500);
  }, [id]);

  if (loading || !lab) return <div className="labdetail-root">로딩 중...</div>;

  return (
    <div className="labdetail-root">
      <div className="labdetail-title">{lab.title}</div>
      <div className="labdetail-meta">
        <span>작성자: {lab.author}</span>
        <span>교수: {lab.professor}</span>
        <span>작성일: {lab.createdAt}</span>
      </div>
      {lab.image ? (
        <img className="labdetail-image" src={lab.image} alt={lab.title} />
      ) : (
        <div className="labdetail-image" style={{ height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#67509C' }}>No Image</div>
      )}
      <div className="labdetail-content">{lab.content}</div>
      <div className="labdetail-actions">
        <LikeButton liked={liked} onClick={() => { setLiked(!liked); setLikes(likes + (liked ? -1 : 1)); }} />
        <span className="labdetail-likes">{likes}</span>
        {!joined && (
          <button className="labdetail-join-btn" onClick={() => navigate(`/lab/${lab.id}/join`)}>
            랩실 가입하기
          </button>
        )}
        {isOwner && (
          <>
            <button className="labdetail-edit-btn" onClick={() => navigate(`/create-lab?id=${lab.id}`)}>수정</button>
            <button className="labdetail-delete-btn" onClick={() => alert('삭제 기능 구현 필요')}>삭제</button>
          </>
        )}
      </div>
      <div className="labdetail-comments">
        <CommentList comments={comments} />
      </div>
    </div>
  );
}

export default LabDetail;
