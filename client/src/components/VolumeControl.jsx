import React from 'react';
import './VolumeControl.css';

export default function VolumeControl({ volume, onChange, disabled = false }) {
  const handleChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    onChange(newVolume);
  };

  const isMuted = volume === 0;

  return (
    <div className="volume-control">
      <button
        className="volume-icon-btn"
        onClick={() => onChange(isMuted ? 50 : 0)}
        disabled={disabled}
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? '🔇' : volume < 50 ? '🔉' : '🔊'}
      </button>
      <input
        type="range"
        min="0"
        max="100"
        value={volume}
        onChange={handleChange}
        className="volume-slider"
        disabled={disabled}
        aria-label="Volume"
      />
      <span className="volume-value">{Math.round(volume)}%</span>
    </div>
  );
}

