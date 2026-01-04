import React, { useState } from 'react';
import './QueueManager.css';

export default function QueueManager({ queue, songs, currentSongId, isHost, onRemove, onReorder }) {
  const [draggedIndex, setDraggedIndex] = useState(null);

  if (!queue || queue.length === 0) {
    return (
      <div className="queue-empty">
        <p>No songs in queue</p>
      </div>
    );
  }

  const getSongById = (songId) => {
    return songs.find(s => s.id === songId);
  };

  const handleDragStart = (index) => {
    if (!isHost) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    if (!isHost || draggedIndex === null) return;
    e.preventDefault();
    
    if (draggedIndex !== index) {
      const newQueue = [...queue];
      const draggedItem = newQueue[draggedIndex];
      newQueue.splice(draggedIndex, 1);
      newQueue.splice(index, 0, draggedItem);
      onReorder(newQueue);
      setDraggedIndex(index);
    }
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="queue-manager">
      <div className="queue-header">
        <h3>Queue ({queue.length})</h3>
      </div>
      <div className="queue-list">
        {queue.map((songId, index) => {
          const song = getSongById(songId);
          if (!song) return null;
          
          const isCurrent = songId === currentSongId;
          const isDragging = draggedIndex === index;

          return (
            <div
              key={`${songId}-${index}`}
              className={`queue-item ${isCurrent ? 'current' : ''} ${isDragging ? 'dragging' : ''}`}
              draggable={isHost && !isCurrent}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="queue-item-number">{index + 1}</div>
              <div className="queue-item-info">
                <div className="queue-item-title">{song.title}</div>
                {isCurrent && <span className="queue-current-badge">Now Playing</span>}
              </div>
              {isHost && !isCurrent && (
                <button
                  className="queue-remove-btn"
                  onClick={() => onRemove(index)}
                  aria-label="Remove from queue"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

