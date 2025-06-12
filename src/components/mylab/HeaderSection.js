import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import '../../styles/MyLab.css';

function HeaderSection({ lab }) {
  if (!lab) return null;
  return (
    <div className="mylab-header-card">
      <div className="mylab-header-img">
        {lab.image ? <img src={lab.image} alt={lab.title} /> : <div className="mylab-header-img-placeholder">No Image</div>}
      </div>
      <div className="mylab-header-info">
        <div className="mylab-header-title">{lab.title}</div>
        <div className="mylab-header-prof">담당 교수: {lab.professor}</div>
        <div className="mylab-header-desc">{lab.description}</div>
        <div className="mylab-header-date">개설일: {lab.createdAt}</div>
      </div>
    </div>
  );
}

export default HeaderSection;
