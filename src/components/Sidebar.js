import React from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { FaUserCheck } from "react-icons/fa";
import "../styles/Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 현재 URL에서 labId 추출 또는 MyLab 페이지 처리
  const getLabId = () => {
    const pathParts = location.pathname.split('/');
    const labIndex = pathParts.indexOf('lab');
    
    // /lab/{id}/... 형태의 경로
    if (labIndex !== -1 && pathParts[labIndex + 1]) {
      return pathParts[labIndex + 1];
    }
    
    // /my-lab 페이지인 경우, MyLab에서 설정한 전역 변수 활용
    if (location.pathname.startsWith('/my-lab')) {
      // MyLab 페이지에서 설정한 디버그 정보 활용
      const mylabData = window.__mylab_lab__;
      if (mylabData?.labId) {
        return mylabData.labId;
      }
    }
    
    return null;
  };

  const labId = getLabId();
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul>
          
          <li>
            <a className="sidebar-link" onClick={() => navigate("/promo")}>
              <FaUserCheck className="icon" />
              랩실 홍보
            </a>
          </li>
          <li>
            <a className="sidebar-link" onClick={() => navigate("/my-lab")}>
              <FaUserCheck className="icon" />내 랩실
            </a>
          </li>
          {(labId || location.pathname.startsWith('/my-lab')) && (
            <li>
              <a className="sidebar-link" onClick={() => {
                if (labId) {
                  navigate(`/lab/${labId}/attendance`);
                } else {
                  // MyLab 페이지에서는 출석 페이지로 직접 이동
                  navigate('/attend');
                }
              }}>
                <FaUserCheck className="icon" />
                랩실 출석
              </a>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}
