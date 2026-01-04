export const useHaptic = () => {
  const trigger = (pattern = [10]) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (err) {
        // Vibration not supported or blocked
        console.warn('Haptic feedback not available:', err);
      }
    }
  };

  return {
    light: () => trigger([10]),
    medium: () => trigger([20]),
    heavy: () => trigger([30]),
    success: () => trigger([10, 50, 10]),
    error: () => trigger([20, 50, 20, 50, 20]),
    custom: trigger
  };
};

