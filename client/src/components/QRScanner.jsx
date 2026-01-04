import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import BottomSheet from './BottomSheet';
import { useHaptic } from '@/hooks/useHaptic';
import './QRScanner.css';

export default function QRScanner({ isOpen, onClose, onScanSuccess }) {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const scannerIdRef = useRef(`qr-scanner-${Date.now()}`);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const haptic = useHaptic();

  useEffect(() => {
    if (!isOpen || !scannerRef.current) return;

    let html5QrCode = null;
    let isMounted = true;

    const startScanning = async () => {
      try {
        if (!isMounted) return;
        setError('');
        setIsScanning(true);

        html5QrCode = new Html5Qrcode(scannerRef.current.id);
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          {
            facingMode: "environment" // Use back camera on mobile
          },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            // Success callback
            if (!isMounted) return;
            haptic.success();
            if (html5QrCode) {
              html5QrCode.stop().then(() => {
                html5QrCode.clear().catch(() => {});
                if (isMounted) {
                  setIsScanning(false);
                  onScanSuccess(decodedText);
                  onClose();
                }
              }).catch(() => {
                if (isMounted) {
                  setIsScanning(false);
                  onScanSuccess(decodedText);
                  onClose();
                }
              });
            }
          },
          () => {
            // Error callback - ignore, it's just scanning
          }
        );
      } catch (err) {
        console.error('QR Scanner error:', err);
        if (isMounted) {
          setError('Failed to start camera. Please check permissions.');
          setIsScanning(false);
          haptic.error();
        }
      }
    };

    startScanning();

    return () => {
      isMounted = false;
      if (html5QrCode) {
        html5QrCode.stop().catch(() => {});
        html5QrCode.clear().catch(() => {});
      }
      html5QrCodeRef.current = null;
    };
  }, [isOpen, retryKey, onScanSuccess, onClose, haptic]);

  const handleClose = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().catch(() => {});
      html5QrCodeRef.current.clear().catch(() => {});
    }
    setIsScanning(false);
    onClose();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Scan QR Code">
      <div className="qr-scanner-content">
        {error && (
          <div className="scanner-error">
            {error}
            <button 
              className="retry-btn"
              onClick={() => {
                setError('');
                setIsScanning(false);
                // Force restart by changing retry key
                setRetryKey(prev => prev + 1);
              }}
            >
              Retry
            </button>
          </div>
        )}
        
        <div className="scanner-container">
          <div 
            id={scannerIdRef.current}
            ref={scannerRef}
            className="qr-scanner-view"
          />
          {!isScanning && !error && (
            <div className="scanner-loading">
              <p>Starting camera...</p>
            </div>
          )}
        </div>

        <div className="scanner-hint">
          <p>Point your camera at a room QR code to join</p>
          <p className="scanner-hint-small">Make sure you have granted camera permissions</p>
        </div>
      </div>
    </BottomSheet>
  );
}

