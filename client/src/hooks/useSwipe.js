import { useRef, useEffect } from 'react';

export const useSwipe = (onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold = 50) => {
  const touchStart = useRef({ x: null, y: null });
  const touchEnd = useRef({ x: null, y: null });

  const minSwipeDistance = threshold;

  const onTouchStart = (e) => {
    touchEnd.current = { x: null, y: null };
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  };

  const onTouchMove = (e) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    };
  };

  const onTouchEnd = () => {
    if (!touchStart.current.x || !touchEnd.current.x) return;
    
    const deltaX = touchStart.current.x - touchEnd.current.x;
    const deltaY = touchStart.current.y - touchEnd.current.y;
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if horizontal or vertical swipe is dominant
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (absDeltaX > minSwipeDistance) {
        if (deltaX > 0 && onSwipeLeft) {
          onSwipeLeft();
        } else if (deltaX < 0 && onSwipeRight) {
          onSwipeRight();
        }
      }
    } else {
      // Vertical swipe
      if (absDeltaY > minSwipeDistance) {
        if (deltaY > 0 && onSwipeUp) {
          onSwipeUp();
        } else if (deltaY < 0 && onSwipeDown) {
          onSwipeDown();
        }
      }
    }
  };

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  };
};

