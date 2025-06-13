import React, { useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import "../../styles/VoteSection.css";

function VoteSection() {
  const { user } = useAuth();
  const [polls, setPolls] = useState([
    {
      id: 1,
      title: "다음 MT 날짜 선택",
      options: ["6월 30일", "7월 6일", "7월 13일"],
      votes: [3, 5, 2],
      votedIndex: null,
      deadline: "2025-06-30",
    },
  ]);
  const [newPoll, setNewPoll] = useState({
    title: "",
    options: "",
    deadline: "",
  });
  const [showNewPoll, setShowNewPoll] = useState(false);

  const handleVote = (pollId, optionIndex) => {
    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p;
        if (p.votedIndex !== null) return p; // 이미 투표한 경우 차단
        return {
          ...p,
          votes: p.votes.map((v, i) => (i === optionIndex ? v + 1 : v)),
          votedIndex: optionIndex,
        };
      })
    );
  };

  const handleNewPoll = () => {
    if (!newPoll.title || !newPoll.options) return;
    setPolls((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        title: newPoll.title,
        options: newPoll.options.split(",").map((opt) => opt.trim()),
        votes: newPoll.options.split(",").map(() => 0),
        votedIndex: null,
        deadline: newPoll.deadline,
      },
    ]);
    setNewPoll({ title: "", options: "", deadline: "" });
    setShowNewPoll(false);
  };

  return (
    <div className="vote-section-container">
      <h3 className="vote-title">📊 투표</h3>
      {user?.role === "admin" && (
        <div className="vote-admin-area">
          <button
            onClick={() => setShowNewPoll((v) => !v)}
            className="vote-new-btn"
          >
            새 투표 만들기
          </button>
          {showNewPoll && (
            <div className="vote-new-form">
              <input
                type="text"
                placeholder="투표 제목"
                value={newPoll.title}
                onChange={(e) =>
                  setNewPoll({ ...newPoll, title: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="선택지(쉼표로 구분)"
                value={newPoll.options}
                onChange={(e) =>
                  setNewPoll({ ...newPoll, options: e.target.value })
                }
              />
              <input
                type="date"
                value={newPoll.deadline}
                onChange={(e) =>
                  setNewPoll({ ...newPoll, deadline: e.target.value })
                }
              />
              <button onClick={handleNewPoll}>추가</button>
            </div>
          )}
        </div>
      )}
      <div className="vote-poll-list">
        {polls.map((poll) => {
          const totalVotes = poll.votes.reduce((a, b) => a + b, 0);
          return (
            <div key={poll.id} className="vote-poll-card">
              <div className="vote-poll-header">
                <h4>{poll.title}</h4>
                {poll.deadline && (
                  <span className="vote-deadline">마감: {poll.deadline}</span>
                )}
              </div>
              <div className="vote-options">
                {poll.options.map((opt, idx) => {
                  const percent = totalVotes
                    ? Math.round((poll.votes[idx] / totalVotes) * 100)
                    : 0;
                  return (
                    <div
                      key={idx}
                      className={`vote-option-row${
                        poll.votedIndex === idx ? " selected" : ""
                      }`}
                    >
                      <button
                        onClick={() => handleVote(poll.id, idx)}
                        disabled={poll.votedIndex !== null}
                        className="vote-option-btn"
                      >
                        {opt}
                      </button>
                      <div className="vote-progress-bar">
                        <div
                          className="vote-progress"
                          style={{ width: percent + "%" }}
                        />
                      </div>
                      <span className="vote-percent">
                        {percent}% ({poll.votes[idx]}표)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default VoteSection;
