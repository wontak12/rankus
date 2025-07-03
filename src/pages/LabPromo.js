import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LabCard from '../components/LabCard.js';
import '../styles/LabPromo.css';

function LabPromo() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('http://3.34.229.56:8080/api/labs')
      .then(res => res.json())
      .then(data => {
        // data.data가 배열이 아닐 수도 있으니 배열로 변환
        if (data.status === 200 && data.data) {
          if (Array.isArray(data.data)) {
            setLabs(data.data);
          } else {
            setLabs([data.data]);
          }
        } else {
          setLabs([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setLabs([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="labpromo-root">
      <div className="labpromo-title">한신대학교 랩실을 소개합니다.</div>
      <div className="labpromo-topbar">
        <button className="labpromo-create-btn" onClick={() => navigate('/create-lab')}>
          랩실을 개설하시겠습니까?
        </button>
      </div>
      {loading ? (
        <div className="labpromo-empty">랩실 목록을 불러오는 중...</div>
      ) : labs.length === 0 ? (
        <div className="labpromo-empty">등록된 랩실이 없습니다.</div>
      ) : (
        <div className="labpromo-grid">
          {labs.map(lab => (
            <div key={lab.id} onClick={() => navigate(`/lab/${lab.id}`)} style={{ cursor: 'pointer' }}>
              <LabCard
                id={lab.id}
                title={lab.name}
                description={lab.description}
                image={lab.image} // image 필드가 없으면 imageUrl 등 실제 필드명으로 수정
                professor={lab.professor}
                createdAt={lab.timestamp}
                likes={lab.ranking}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LabPromo;