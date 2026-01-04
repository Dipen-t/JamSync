import React, { useState } from 'react';
import './UserList.css';

export default function UserList({ users, isHost }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!users || users.length === 0) return null;

  const getInitials = (socketId) => {
    return `U${socketId.slice(-2).toUpperCase()}`;
  };

  return (
    <div className="user-list-container">
      <button
        className="user-list-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="Toggle user list"
      >
        <span className="user-count-badge">{users.length}</span>
        <span className="user-list-icon">👥</span>
      </button>
      
      {isExpanded && (
        <div className="user-list">
          <div className="user-list-header">
            <h3>Users in Room</h3>
            <button onClick={() => setIsExpanded(false)} className="close-btn">✕</button>
          </div>
          <div className="user-list-items">
            {users.map((user) => (
              <div key={user.socketId} className="user-item">
                <div className="user-avatar">
                  {getInitials(user.socketId)}
                </div>
                <div className="user-info">
                  <div className="user-name">User {user.socketId.slice(-4)}</div>
                  {user.socketId === isHost && (
                    <span className="host-badge-small">👑 Host</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

