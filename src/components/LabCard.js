import React from 'react';
import '../styles/LabCard.css';

function LabCard({ title, description, image, professor, createdAt, likes }) {
  return (
    <div className="labcard-root">
      <div className="labcard-thumb">
        {image ? (
          <img src={image} alt={title} />
        ) : (
          <div className="labcard-thumb-placeholder">No Image</div>
        )}
      </div>
      <div className="labcard-body">
        <div className="labcard-title">{title}</div>
        <div className="labcard-desc">{description}</div>
        <div className="labcard-meta">
          <span className="labcard-prof">{professor} 교수</span>
          <span className="labcard-date">{createdAt}</span>
        </div>
        <div className="labcard-likes">♥ {likes}</div>
      </div>
    </div>
  );
}

export default LabCard;
