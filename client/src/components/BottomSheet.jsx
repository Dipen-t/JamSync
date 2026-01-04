import React, { useEffect } from 'react';
import './BottomSheet.css';

export default function BottomSheet({ isOpen, onClose, children, title }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="bottom-sheet-overlay" onClick={onClose} />
      <div className="bottom-sheet">
        <div className="bottom-sheet-handle" onClick={onClose} />
        {title && <div className="bottom-sheet-title">{title}</div>}
        <div className="bottom-sheet-content">{children}</div>
      </div>
    </>
  );
}

