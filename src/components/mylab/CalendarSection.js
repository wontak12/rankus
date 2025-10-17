import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/MyLab.css';

function CalendarSection({ labId }) {
  const navigate = useNavigate();
  const [todayTasks, setTodayTasks] = useState([]);
  
  // 오늘 날짜
  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  });

  // TODO: 실제 API에서 오늘의 일정을 가져오는 로직
  useEffect(() => {
    // 임시 데이터 - 추후 실제 API 연동
    const mockTasks = [
      { id: 1, title: '정기 세미나', time: '14:00', type: 'meeting' },
      { id: 2, title: '프로젝트 발표 준비', time: '16:00', type: 'task' },
      { id: 3, title: '논문 리뷰', time: '19:00', type: 'study' }
    ];
    setTodayTasks(mockTasks);
  }, [labId]);

  const handleViewFullCalendar = () => {
    navigate(`/lab/${labId}/calendar`);
  };

  return (
    <div className="mainlab-card">
      <div className="mylab-card-header">
        <div className="mylab-card-title">📅 오늘의 일정</div>
        <div className="mylab-card-date">{today}</div>
      </div>
      
      <div className="mylab-card-content">
        {todayTasks.length > 0 ? (
          <div className="calendar-tasks-list">
            {todayTasks.map(task => (
              <div key={task.id} className="calendar-task-item">
                <div className="calendar-task-time">{task.time}</div>
                <div className="calendar-task-content">
                  <div className="calendar-task-title">{task.title}</div>
                  <div className={`calendar-task-type calendar-task-type-${task.type}`}>
                    {task.type === 'meeting' ? '회의' : 
                     task.type === 'task' ? '업무' : '스터디'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="calendar-empty-state">
            <div className="calendar-empty-icon">📋</div>
            <div className="calendar-empty-message">오늘 예정된 일정이 없습니다</div>
          </div>
        )}
        
        <div
          className="see-more"
          style={{
            color: "#67509C",
            cursor: "pointer",
            fontWeight: 700,
            marginTop: "0.7rem",
          }}
          onClick={handleViewFullCalendar}
        >
          ➕ 전체 보기
        </div>

    
        
      </div>
    </div>
  );
}

export default CalendarSection;
