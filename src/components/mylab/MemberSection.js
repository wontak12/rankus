import React from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/MyLab.css";

const initialMembers = [
  { id: 1, name: "김랩장", email: "leader@lab.com", role: "leader" },
  { id: 2, name: "이부랩", email: "sub@lab.com", role: "sub" },
  { id: 3, name: "박멤버", email: "user@lab.com", role: "member" },
];

function MemberSection({ labId }) {
  const navigate = useNavigate();

  // 최대 3명만 간략히 보여주고, 전체보기 버튼 제공
  const previewMembers = initialMembers.slice(0, 3);

  return (
    <div className="mainlab-card">
      <div className="mylab-card-title">멤버 목록</div>
      <div className="mylab-card-content">
        <ul className="member-list" style={{ padding: 0, margin: 0 }}>
          {previewMembers.map((m) => (
            <li
              key={m.id}
              style={{
                display: "flex",
                gap: "1.2rem",
                alignItems: "center",
                padding: "0.4rem 0",
              }}
            >
              <span style={{ fontWeight: 500 }}>{m.name}</span>
              <span style={{ color: "#888", fontSize: "1.2rem" }}>
                {m.role === "leader"
                  ? "랩장"
                  : m.role === "sub"
                  ? "부랩장"
                  : "랩원"}
              </span>
            </li>
          ))}
        </ul>
        <div
          className="see-more"
          style={{
            color: "#67509C",
            cursor: "pointer",
            fontWeight: 700,
            marginTop: "0.7rem",
          }}
          onClick={() => navigate("/members")}
        >
          ➕ 전체 보기
        </div>
      </div>
    </div>
  );
}

export default MemberSection;
