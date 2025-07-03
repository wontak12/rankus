import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/LabDetail.css';
import CommentList from '../components/CommentList';
import LikeButton from '../components/LikeButton';

function LabDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lab, setLab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [joined, setJoined] = useState(false);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    fetch(`http://3.34.229.56:8080/api/labs/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === 200 && data.data) {
          setLab({
            id: data.data.id,
            title: data.data.name,
            content: data.data.description,
            image: '', // API에 이미지 필드가 없으므로 빈 값
            author: '', // API에 작성자 정보가 없으므로 빈 값
            createdAt: new Date(data.timestamp).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
            }),
            professor: '', // API에 교수 정보가 없으므로 빈 값
            likes: data.data.ranking ?? 0,
          });
          setLikes(data.data.ranking ?? 0);
        } else {
          setLab(null);
        }
        setIsOwner(false);
        setJoined(false);
        setComments([]);
        setLoading(false);
      })
      .catch(() => {
        setLab(null);
        setLoading(false);
      });
  }, [id]);

  if (loading || !lab) return <div className="labdetail-root">로딩 중...</div>;

  return (
    <div className="labdetail-root">
      <div className="labdetail-title">{lab.title}</div>
      <div className="labdetail-meta">
        <span>작성자: {lab.author || '정보 없음'}</span>
        <span>교수: {lab.professor || '정보 없음'}</span>
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