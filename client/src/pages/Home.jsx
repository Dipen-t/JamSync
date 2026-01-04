import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { socket } from "@/socket";
import QRScanner from "@/components/QRScanner";
import { useHaptic } from "@/hooks/useHaptic";
import "./Home.css";

export default function Home() {
  const [joinId, setJoinId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const navigate = useNavigate();
  const haptic = useHaptic();

  const createRoom = () => {
    setIsCreating(true);
    setError("");
    socket.emit("CREATE_ROOM");
    socket.once("ROOM_CREATED", ({ roomId }) => {
      setIsCreating(false);
      navigate(`/room/${roomId}`);
    });
    socket.once("connect_error", () => {
      setIsCreating(false);
      setError("Failed to connect to server. Please try again.");
    });
  };

  const joinRoom = () => {
    setError("");
    const trimmedId = joinId.trim();
    if (!trimmedId) {
      setError("Please enter a Room ID");
      return;
    }
    navigate(`/room/${trimmedId}`);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      joinRoom();
    }
  };

  const handleScanSuccess = (scannedText) => {
    try {
      // Extract room ID from URL or use the text directly
      let roomId = scannedText;
      
      // If it's a URL, extract the room ID
      if (scannedText.includes('/room/')) {
        const urlParts = scannedText.split('/room/');
        if (urlParts.length > 1) {
          roomId = urlParts[1].split('?')[0].split('#')[0].trim();
        }
      }
      
      if (roomId) {
        haptic.success();
        navigate(`/room/${roomId}`);
      } else {
        setError("Invalid QR code. Please scan a valid room QR code.");
        haptic.error();
      }
    } catch (err) {
      console.error('Scan error:', err);
      setError("Failed to process QR code. Please try again.");
      haptic.error();
    }
  };

  return (
    <div className="home-container">
      <div className="home-card">
        <div className="home-header">
          <h1 className="home-title">🎵 JamSync</h1>
          <p className="home-subtitle">Synchronized music listening for everyone</p>
        </div>

        <div className="home-actions">
          <button 
            className="btn btn-primary btn-large" 
            onClick={createRoom}
            disabled={isCreating}
          >
            {isCreating ? "Creating..." : "🎵 Create New Room"}
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <div className="join-section">
            <input
              type="text"
              className="input-field"
              placeholder="Enter Room ID"
              value={joinId}
              onChange={(e) => {
                setJoinId(e.target.value);
                setError("");
              }}
              onKeyPress={handleKeyPress}
            />
            <div className="join-buttons">
              <button 
                className="btn btn-secondary" 
                onClick={joinRoom}
                disabled={!joinId.trim()}
              >
                Join Room
              </button>
              <button 
                className="btn btn-scanner" 
                onClick={() => {
                  setShowScanner(true);
                  setError("");
                  haptic.light();
                }}
                title="Scan QR Code"
              >
                📷 Scan QR
              </button>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}
          
          <QRScanner
            isOpen={showScanner}
            onClose={() => {
              setShowScanner(false);
              setError("");
            }}
            onScanSuccess={handleScanSuccess}
          />
        </div>
      </div>
    </div>
  );
}
