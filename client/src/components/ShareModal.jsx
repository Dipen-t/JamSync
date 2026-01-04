import React, { useState, useEffect } from 'react';
import { generateQRCode } from '@/utils/qrcode';
import BottomSheet from './BottomSheet';
import { useHaptic } from '@/hooks/useHaptic';
import './ShareModal.css';

export default function ShareModal({ isOpen, onClose, roomId }) {
  const [qrCode, setQrCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const haptic = useHaptic();
  const roomUrl = `${window.location.origin}/room/${roomId}`;

  useEffect(() => {
    if (isOpen && roomId) {
      generateQRCode(roomUrl)
        .then(setQrCode)
        .catch(console.error);
    }
  }, [isOpen, roomId, roomUrl]);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    haptic.success();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join my JamSync room',
          text: `Join my synchronized music room: ${roomId}`,
          url: roomUrl,
        });
        haptic.success();
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      handleCopy();
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Share Room">
      <div className="share-modal-content">
        {qrCode && (
          <div className="qr-code-container">
            <img src={qrCode} alt="Room QR Code" className="qr-code-image" />
            <p className="qr-code-hint">Scan to join</p>
          </div>
        )}

        <div className="room-id-display">
          <code className="room-id-text">{roomId}</code>
        </div>

        <div className="share-actions">
          <button
            className="share-btn share-btn-primary"
            onClick={handleNativeShare}
          >
            {navigator.share ? '📤 Share' : '📋 Copy Link'}
          </button>
          <button
            className="share-btn share-btn-secondary"
            onClick={handleCopy}
          >
            {copied ? '✓ Copied!' : '📋 Copy ID'}
          </button>
        </div>

        <div className="share-hint">
          Share this room ID or scan the QR code to invite others
        </div>
      </div>
    </BottomSheet>
  );
}

