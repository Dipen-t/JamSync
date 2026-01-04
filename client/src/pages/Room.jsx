import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { socket, SOCKET_URL } from "@/socket";
import { useSwipe } from "@/hooks/useSwipe";
import { useHaptic } from "@/hooks/useHaptic";
import VolumeControl from "@/components/VolumeControl";
import UserList from "@/components/UserList";
import ShareModal from "@/components/ShareModal";
import QueueManager from "@/components/QueueManager";
import ToastContainer from "@/components/ToastContainer";
import BottomSheet from "@/components/BottomSheet";
import "./Room.css";

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const playerRef = useRef(null);
  const haptic = useHaptic();

  const [songs, setSongs] = useState([]);
  const [_room, setRoom] = useState(null);
  const [selectedSong, setSelectedSong] = useState(null);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [users, setUsers] = useState([]);
  const [queue, setQueue] = useState([]);
  const [queuePosition, setQueuePosition] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showQueueSheet, setShowQueueSheet] = useState(false);
  const [toasts, setToasts] = useState([]);
  const fileInputRef = useRef(null);
  const hasJoinedRoom = useRef(false);
  const userInteractedRef = useRef(false);
  const safePlayRef = useRef(null);
  const addToastRef = useRef(null);

  // Toast management
  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Swipe gestures for player
  const swipeHandlers = useSwipe(
    () => {
      // Swipe left - next
      if (isHost) {
        handleNext();
        haptic.medium();
      }
    },
    () => {
      // Swipe right - previous
      if (isHost) {
        handlePrev();
        haptic.medium();
      }
    },
    () => {
      // Swipe up - show queue
      setShowQueueSheet(true);
      haptic.light();
    },
    () => {
      // Swipe down - dismiss
      setShowQueueSheet(false);
    },
    50
  );

  // Format time helper
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Safe play function
  const safePlay = useCallback(async () => {
    if (!userInteracted || !audioRef.current) return;
    try {
      audioRef.current.volume = volume / 100;
      audioRef.current.muted = false;
      await audioRef.current.play();
      setIsPlaying(true);
      haptic.light();
    } catch (err) {
      console.warn("Playback blocked until user interacts", err);
    }
  }, [userInteracted, volume, haptic]);

  // Keep refs in sync - must be after safePlay and addToast are defined
  useEffect(() => {
    userInteractedRef.current = userInteracted;
    safePlayRef.current = safePlay;
    addToastRef.current = addToast;
  }, [userInteracted, safePlay, addToast]);

  // Upload a song
  const uploadSong = async (file) => {
    if (!file) return;
    
    setIsUploading(true);
    setError("");
    
    try {
      const formData = new FormData();
      formData.append("song", file);

      const res = await fetch(`${SOCKET_URL}/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Upload failed");
      }

      const song = await res.json();
      socket.emit("ADD_SONG", song);
      
      if (isHost) {
        socket.emit("ADD_TO_QUEUE", { roomId, songId: song.id });
        setTimeout(() => {
          socket.emit("CHANGE_SONG", { roomId, songId: song.id });
        }, 100);
      }
      
      addToast("Song uploaded successfully!", "success");
      haptic.success();
      
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError("Failed to upload song. Please try again.");
      addToast("Upload failed. Please try again.", "error");
      console.error("Upload error:", err);
    } finally {
      setIsUploading(false);
    }
  };

  // Change current song
  const changeSong = (song) => {
    if (!isHost) return;
    setSelectedSong(song);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    socket.emit("CHANGE_SONG", { roomId, songId: song.id });
    haptic.medium();
  };

  // Add to queue
  const addToQueue = (song) => {
    socket.emit("ADD_TO_QUEUE", { roomId, songId: song.id });
    addToast("Added to queue", "success");
    haptic.light();
  };

  // Remove from queue
  const removeFromQueue = (index) => {
    if (!isHost) return;
    const newQueue = [...queue];
    newQueue.splice(index, 1);
    socket.emit("REORDER_QUEUE", { roomId, newQueue });
    haptic.light();
  };

  // Reorder queue
  const reorderQueue = (newQueue) => {
    if (!isHost) return;
    socket.emit("REORDER_QUEUE", { roomId, newQueue });
    haptic.light();
  };

  // Next/Previous handlers
  const handleNext = useCallback(() => {
    if (!isHost) return;
    socket.emit("NEXT_SONG", { roomId });
    haptic.medium();
  }, [isHost, roomId, haptic]);

  const handlePrev = useCallback(() => {
    if (!isHost) return;
    socket.emit("PREV_SONG", { roomId });
    haptic.medium();
  }, [isHost, roomId, haptic]);

  // Play / Pause buttons
  const play = () => {
    if (!isHost || !selectedSong || !audioRef.current?.src) return;
    const time = audioRef.current.currentTime;
    socket.emit("HOST_PLAY", { roomId, time });
    safePlay();
  };

  const pause = () => {
    if (!isHost || !audioRef.current?.src) return;
    const time = audioRef.current.currentTime;
    socket.emit("HOST_PAUSE", { roomId, time });
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
    haptic.light();
  };

  // Volume change
  const handleVolumeChange = (newVolume) => {
    if (!isHost) return;
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
    socket.emit("HOST_VOLUME", { roomId, volume: newVolume });
    haptic.light();
  };

  // Update progress
  useEffect(() => {
    if (!audioRef.current) return;

    const updateProgress = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
        setDuration(audioRef.current.duration || 0);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      // Auto-play next if available
      if (queue.length > 0 && queuePosition < queue.length - 1 && isHost) {
        socket.emit("NEXT_SONG", { roomId });
      }
    };

    const audio = audioRef.current;
    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("loadedmetadata", updateProgress);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("loadedmetadata", updateProgress);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [selectedSong, queue, queuePosition, isHost, roomId]);

  // Socket listeners
  useEffect(() => {
    if (!roomId) return;

    // Prevent multiple JOIN_ROOM emissions
    if (hasJoinedRoom.current) return;
    hasJoinedRoom.current = true;

    socket.emit("JOIN_ROOM", { roomId });

    const handleRoomSync = (roomState) => {
      setRoom(roomState);
      setIsHost(roomState.hostId === socket.id);
      setVolume(roomState.volume || 100);
      setQueue(roomState.queue || []);
      setQueuePosition(roomState.queuePosition || 0);
      setUsers(roomState.users || []);

      // Update selected song based on room state
      // This will be handled after songs are loaded via SONG_LIST
      setSongs((prevSongs) => {
        if (roomState.songId && prevSongs.length > 0) {
          const songObj = prevSongs.find((s) => s.id === roomState.songId);
          if (songObj) {
            setSelectedSong(songObj);
          } else if (prevSongs.length > 0 && roomState.hostId === socket.id) {
            const firstSong = prevSongs[0];
            setSelectedSong(firstSong);
            // Use setTimeout to avoid emitting during handler execution
            setTimeout(() => {
              socket.emit("CHANGE_SONG", { roomId, songId: firstSong.id });
            }, 0);
          }
        }
        return prevSongs;
      });
    };

    const handleSongList = (list) => {
      // Replace entire song list with server's authoritative list
      setSongs((prevSongs) => {
        // Check if songs actually changed (by comparing IDs)
        const prevIds = prevSongs.map(s => s.id).sort().join(',');
        const newIds = list.map(s => s.id).sort().join(',');
        if (prevIds === newIds && prevSongs.length === list.length) {
          return prevSongs;
        }
        return list;
      });
      
      // Update selected song if room state has a songId
      setRoom((currentRoom) => {
        if (currentRoom?.songId && list.length > 0) {
          const songObj = list.find((s) => s.id === currentRoom.songId);
          if (songObj) {
            setSelectedSong(songObj);
          }
        }
        return currentRoom;
      });
    };

    const handleAddSong = (song) => {
      setSongs((prev) => {
        // Check if song already exists to prevent duplicates
        const exists = prev.some(s => s.id === song.id || s.url === song.url);
        if (exists) return prev;
        return [...prev, song];
      });
    };

    const handlePlay = (roomState) => {
      setRoom(roomState);
      setIsPlaying(true);
      setVolume(roomState.volume || 100);
      if (audioRef.current?.src) {
        audioRef.current.currentTime = roomState.currentTime;
        audioRef.current.volume = (roomState.volume || 100) / 100;
        if (userInteractedRef.current && safePlayRef.current) {
          safePlayRef.current();
        }
      }
    };

    const handlePause = (roomState) => {
      setRoom(roomState);
      setIsPlaying(false);
      if (audioRef.current?.src) {
        audioRef.current.currentTime = roomState.currentTime;
        audioRef.current.pause();
      }
    };

    const handleSongChanged = (roomState) => {
      setRoom(roomState);
      setQueue(roomState.queue || []);
      setQueuePosition(roomState.queuePosition || 0);
      setSongs((prevSongs) => {
        const songObj = prevSongs.find((s) => s.id === roomState.songId);
        if (songObj) {
          setSelectedSong(songObj);
        }
        return prevSongs;
      });
    };

    const handleVolumeChanged = (roomState) => {
      setVolume(roomState.volume || 100);
      if (audioRef.current) {
        audioRef.current.volume = (roomState.volume || 100) / 100;
      }
    };

    const handleUpdateQueue = (roomState) => {
      setQueue(roomState.queue || []);
      setQueuePosition(roomState.queuePosition || 0);
    };

    const handleUserJoined = ({ socketId, joinTime }) => {
      setUsers(prev => {
        const exists = prev.some(u => u.socketId === socketId);
        if (!exists) {
          if (addToastRef.current) {
            addToastRef.current("User joined", "info");
          }
          return [...prev, { socketId, joinTime }];
        }
        return prev;
      });
    };

    const handleUserLeft = ({ socketId }) => {
      setUsers(prev => {
        const filtered = prev.filter(u => u.socketId !== socketId);
        if (filtered.length !== prev.length) {
          if (addToastRef.current) {
            addToastRef.current("User left", "info");
          }
        }
        return filtered;
      });
    };

    const handleRoomError = ({ error }) => {
      setError(error || "Failed to join room");
      if (addToastRef.current) {
        addToastRef.current(error || "Failed to join room", "error");
      }
      setTimeout(() => navigate("/"), 3000);
    };

    socket.on("ROOM_SYNC", handleRoomSync);
    socket.on("SONG_LIST", handleSongList);
    socket.on("ADD_SONG", handleAddSong);
    socket.on("PLAY", handlePlay);
    socket.on("PAUSE", handlePause);
    socket.on("SONG_CHANGED", handleSongChanged);
    socket.on("VOLUME_CHANGED", handleVolumeChanged);
    socket.on("UPDATE_QUEUE", handleUpdateQueue);
    socket.on("USER_JOINED", handleUserJoined);
    socket.on("USER_LEFT", handleUserLeft);
    socket.on("ROOM_ERROR", handleRoomError);

    return () => {
      hasJoinedRoom.current = false;
      socket.off("ROOM_SYNC", handleRoomSync);
      socket.off("SONG_LIST", handleSongList);
      socket.off("ADD_SONG", handleAddSong);
      socket.off("PLAY", handlePlay);
      socket.off("PAUSE", handlePause);
      socket.off("SONG_CHANGED", handleSongChanged);
      socket.off("VOLUME_CHANGED", handleVolumeChanged);
      socket.off("UPDATE_QUEUE", handleUpdateQueue);
      socket.off("USER_JOINED", handleUserJoined);
      socket.off("USER_LEFT", handleUserLeft);
      socket.off("ROOM_ERROR", handleRoomError);
    };
  }, [roomId, navigate]);

  // Effect to set audio src only when selectedSong changes
  useEffect(() => {
    if (!selectedSong || !audioRef.current) return;

    const src = `${SOCKET_URL}${selectedSong.url}`;
    if (audioRef.current.src !== src) {
      audioRef.current.src = src;
      audioRef.current.currentTime = 0;
      audioRef.current.volume = volume / 100;
      audioRef.current.pause();
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [selectedSong, volume]);

  // Seek handler
  const handleSeek = (e) => {
    if (!isHost || !audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    if (isPlaying) {
      socket.emit("HOST_PLAY", { roomId, time: newTime });
    } else {
      socket.emit("HOST_PAUSE", { roomId, time: newTime });
    }
    haptic.light();
  };

  return (
    <div className="room-container">
      <div className="room-header">
        <button className="btn-back" onClick={() => navigate("/")}>
          ← Back
        </button>
        <div className="room-info">
          <h1 className="room-title">🎵 Room</h1>
          <div className="room-id-section">
            <code className="room-id">{roomId}</code>
            <button 
              className="btn-share" 
              onClick={() => setShowShareModal(true)}
              title="Share Room"
            >
              📤 Share
            </button>
          </div>
          <div className="room-header-actions">
            {isHost && <span className="host-badge">👑 Host</span>}
            <UserList users={users} isHost={isHost} />
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div 
        className="player-section"
        ref={playerRef}
        {...swipeHandlers}
        onClick={() => setUserInteracted(true)}
      >
        {selectedSong ? (
          <>
            <div className="now-playing">
              <h2 className="song-title">{selectedSong.title}</h2>
              <div className="progress-container">
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="progress-bar"
                  disabled={!isHost}
                />
                <div className="time-display">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </div>

            {!isHost && (
              <p className="listener-note">
                {isPlaying ? "▶️ Playing..." : "⏸️ Paused"}
              </p>
            )}
          </>
        ) : (
          <div className="no-song">
            <p>No song selected. {isHost ? "Upload or select a song to start!" : "Waiting for host to select a song..."}</p>
          </div>
        )}

        <audio ref={audioRef} preload="auto" style={{ display: "none" }} />
      </div>

      {/* Mobile Bottom Controls */}
      <div className="mobile-controls">
        <div className="mobile-controls-row">
          <button
            className="mobile-control-btn"
            onClick={handlePrev}
            disabled={!isHost || queuePosition === 0}
            aria-label="Previous"
          >
            ⏮
          </button>
          {isPlaying ? (
            <button
              className="mobile-control-btn mobile-control-btn-primary"
              onClick={pause}
              disabled={!isHost || !selectedSong}
              aria-label="Pause"
            >
              ⏸
            </button>
          ) : (
            <button
              className="mobile-control-btn mobile-control-btn-primary"
              onClick={play}
              disabled={!isHost || !selectedSong}
              aria-label="Play"
            >
              ▶
            </button>
          )}
          <button
            className="mobile-control-btn"
            onClick={handleNext}
            disabled={!isHost || queuePosition >= queue.length - 1}
            aria-label="Next"
          >
            ⏭
          </button>
        </div>
        <div className="mobile-controls-row">
          <VolumeControl
            volume={volume}
            onChange={handleVolumeChange}
            disabled={!isHost}
          />
        </div>
        <button
          className="queue-toggle-btn"
          onClick={() => setShowQueueSheet(true)}
        >
          📋 Queue ({queue.length})
        </button>
      </div>

      <div className="songs-section">
        <h3 className="section-title">🎶 Songs</h3>
        {songs.length === 0 ? (
          <p className="empty-state">No songs yet. Upload one to get started!</p>
        ) : (
          <div className="songs-list">
            {songs.map((song) => (
              <div
                key={song.id}
                className={`song-item ${selectedSong?.id === song.id ? "active" : ""}`}
              >
                <button
                  className="song-button"
                  onClick={() => changeSong(song)}
                  disabled={!isHost}
                >
                  <span className="song-name">{song.title}</span>
                  {selectedSong?.id === song.id && (
                    <span className="current-badge">● Now Playing</span>
                  )}
                </button>
                <button
                  className="song-add-queue-btn"
                  onClick={() => addToQueue(song)}
                  title="Add to queue"
                >
                  ➕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="upload-section">
        <h3 className="section-title">📤 Upload Song</h3>
        <div className="upload-area">
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                uploadSong(file);
              }
            }}
            className="file-input"
            id="file-upload"
            disabled={isUploading}
          />
          <label htmlFor="file-upload" className="file-label">
            {isUploading ? "Uploading..." : "Choose Audio File"}
          </label>
        </div>
      </div>

      {/* Modals */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        roomId={roomId}
      />

      <BottomSheet
        isOpen={showQueueSheet}
        onClose={() => setShowQueueSheet(false)}
        title="Queue"
      >
        <QueueManager
          queue={queue}
          songs={songs}
          currentSongId={selectedSong?.id}
          isHost={isHost}
          onRemove={removeFromQueue}
          onReorder={reorderQueue}
        />
      </BottomSheet>

      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
