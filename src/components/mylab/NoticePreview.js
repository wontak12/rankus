import React from "react";
import { useNavigate } from "react-router-dom";

// 🚧 TODO: 실제 데이터 API 연동 필요. 현재는 mock 데이터 사용
const dummyNotices = [
  { id: 1, title: "6월 전체 랩 회의 일정 안내", date: "2025-06-10" },
  { id: 2, title: "MT 신청 마감일 안내", date: "2025-06-08" },
  { id: 3, title: "랩실 청소 당번 배정표 (6월)", date: "2025-06-05" },
];

function NoticePreview() {
  const navigate = useNavigate();

  return (
    <div className="mylab-card">
      <div className="mylab-card-title">📢 공지사항</div>
      <ul style={{ padding: 0, listStyle: "none" }}>
        {dummyNotices.map((notice) => (
          <li
            key={notice.id}
            className="notice-item"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
              marginBottom: "0.5rem",
            }}
            onClick={() => navigate(`/notice/${notice.id}`)}
          >
            <span style={{ fontWeight: 600 }}>{notice.title}</span>
            <span
              className="notice-date"
              style={{ color: "#b6c6e3", fontSize: "0.97rem" }}
            >
              {notice.date}
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
        onClick={() => navigate("/notice")}
      >
        ➕ 전체 보기
      </div>
    </div>
  );
}

export default NoticePreview;
