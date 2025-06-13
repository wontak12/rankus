import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FaUserCheck } from "react-icons/fa";
import "../styles/Sidebar.css";

export default function Sidebar() {
  const navigate = useNavigate();
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul>
          <li>
            <a className="sidebar-link" onClick={() => navigate("/my-lab")}>
              <FaUserCheck className="icon" />내 랩실
            </a>
          </li>
          <li>
            <a className="sidebar-link" onClick={() => navigate("/promo")}>
              <FaUserCheck className="icon" />
              랩실 홍보
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
}
