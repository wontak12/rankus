import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../styles/CreateLab.css';

function CreateLab() {
  const navigate = useNavigate();
  const { id } = useParams(); // 수정 모드 지원
  const [fields, setFields] = useState({
    name: '',
    description: '',
    professor: '',
    image: '',
    isPublic: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFields({
      ...fields,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    // TODO: 실제 API 연동 (POST /api/labs 또는 PUT /api/labs/:id)
    setTimeout(() => {
      setSuccess(true);
      setLoading(false);
      setTimeout(() => navigate('/my-lab'), 1500);
    }, 900);
  };

  if (success) {
    return (
      <div className="createlab-root">
        <div className="createlab-success">랩실이 성공적으로 {id ? '수정' : '개설'}되었습니다!<br/>잠시 후 내 랩실로 이동합니다.</div>
      </div>
    );
  }

  return (
    <div className="createlab-root">
      <h2 className="createlab-title">{id ? '랩실 정보 수정' : '랩실 개설'}</h2>
      <form className="createlab-form" onSubmit={handleSubmit}>
        <div className="createlab-field">
          <label htmlFor="name">랩실 이름 *</label>
          <input id="name" name="name" value={fields.name} onChange={handleChange} required disabled={loading} placeholder="랩실명을 입력하세요" />
        </div>
        <div className="createlab-field">
          <label htmlFor="description">랩실 소개</label>
          <textarea id="description" name="description" value={fields.description} onChange={handleChange} disabled={loading} placeholder="연구실 소개를 입력하세요" />
        </div>
        <div className="createlab-field">
          <label htmlFor="professor">담당 교수</label>
          <input id="professor" name="professor" value={fields.professor} onChange={handleChange} disabled={loading} placeholder="교수명을 입력하세요" />
        </div>
        <div className="createlab-field">
          <label htmlFor="image">대표 이미지 (URL)</label>
          <input id="image" name="image" value={fields.image} onChange={handleChange} disabled={loading} placeholder="이미지 URL을 입력하세요 (선택)" />
        </div>
        <div className="createlab-field-checkbox">
          <input type="checkbox" id="isPublic" name="isPublic" checked={fields.isPublic} onChange={handleChange} disabled={loading} />
          <label htmlFor="isPublic">공개 랩실로 등록</label>
        </div>
        {error && <div className="createlab-error">{error}</div>}
        <button className="createlab-btn" type="submit" disabled={loading}>{id ? '수정' : '개설'} 신청</button>
      </form>
    </div>
  );
}

export default CreateLab;
