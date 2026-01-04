import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import BottomSheet from './BottomSheet';
import { useHaptic } from '@/hooks/useHaptic';
import './QRScanner.css';

export default function QRScanner({ isOpen, onClose, onScanSuccess }) {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const scannerIdRef = useRef(`qr-scanner-${Date.now()}`);
  const isRunningRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [retryKey, setRetryKey] = useState(0);
  const haptic = useHaptic();

  // Safe stop function
  const safeStop = useCallback(async (scanner) => {
    if (!scanner || !isRunningRef.current) return;
    try {
      await scanner.stop();
      isRunningRef.current = false;
    } catch (err) {
      // Ignore errors if scanner is not running
      const errMsg = err?.message || String(err);
      if (errMsg && !errMsg.includes('not running') && !errMsg.includes('not paused')) {
        console.warn('Scanner stop error:', err);
      }
      isRunningRef.current = false;
    }
    try {
      await scanner.clear();
    } catch (err) {
      // Ignore clear errors
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    let html5QrCode = null;
    let isMounted = true;

    const startScanning = async () => {
      // Wait for DOM element to be ready
      await new Promise(resolve => setTimeout(resolve, 100));
      
      if (!isMounted || !scannerRef.current) return;

      try {
        setError('');
        setIsScanning(true);
        isRunningRef.current = false;

        // Clear any existing scanner
        if (html5QrCodeRef.current) {
          await safeStop(html5QrCodeRef.current);
        }

        const elementId = scannerRef.current.id;
        if (!elementId) {
          throw new Error('Scanner element ID not found');
        }

        html5QrCode = new Html5Qrcode(elementId);
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
            if (html5QrCode && isRunningRef.current) {
              safeStop(html5QrCode).then(() => {
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
        
        // Mark as running after successful start
        isRunningRef.current = true;
      } catch (err) {
        console.error('QR Scanner error:', err);
        if (isMounted) {
          setError('Failed to start camera. Please check permissions.');
          setIsScanning(false);
          isRunningRef.current = false;
          haptic.error();
        }
      }
    };

    startScanning();

    return () => {
      isMounted = false;
      if (html5QrCode) {
        safeStop(html5QrCode);
      }
      html5QrCodeRef.current = null;
    };
  }, [isOpen, retryKey, onScanSuccess, onClose, haptic, safeStop]);

  const handleClose = async () => {
    if (html5QrCodeRef.current) {
      await safeStop(html5QrCodeRef.current);
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

