import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

// 🚧 TODO: 임시 mock 데이터 사용
const mockNotices = [
  {
    id: 1,
    title: '6월 전체 회의 일정 안내',
    content: '안녕하세요! 6월 전체 랩 회의는 6월 20일 금요일 오후 2시에 열립니다.',
    date: '2025-06-10',
    author: '김랩장',
  },
];

function NoticeDetail() {
  const { id } = useParams();
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    // 🚧 TODO: 실제 서버에서 fetch 예정
    const found = mockNotices.find((n) => n.id === parseInt(id));
    setNotice(found);
  }, [id]);

  if (!notice) {
    return <p>📭 해당 공지사항을 찾을 수 없습니다.</p>;
  }

  return (
    <div className="page" style={{maxWidth: 700, margin: '2.5rem auto'}}>
      <h2 style={{marginBottom: '0.7rem'}}>{notice.title}</h2>
      <p><strong>작성자:</strong> {notice.author}</p>
      <p><strong>작성일:</strong> {notice.date}</p>
      <div className="notice-content" style={{marginTop: '1.2rem', whiteSpace: 'pre-line'}}>
        {notice.content}
      </div>
    </div>
  );
}

export default NoticeDetail;
