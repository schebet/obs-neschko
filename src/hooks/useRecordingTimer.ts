import { useState, useRef, useCallback, useEffect } from 'react';

interface UseRecordingTimerReturn {
  timerEnabled: boolean;
  timerDuration: number;
  remainingTime: number;
  setTimerEnabled: (enabled: boolean) => void;
  setTimerDuration: (duration: number) => void;
  startCountdown: () => void;
  stopCountdown: () => void;
  resetCountdown: () => void;
}

export const useRecordingTimer = (onTimerEnd: () => void): UseRecordingTimerReturn => {
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerDuration, setTimerDuration] = useState(30 * 60); // 30 minutes default
  const [remainingTime, setRemainingTime] = useState(timerDuration);
  
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setRemainingTime(timerDuration);
  }, [timerDuration]);

  const startCountdown = useCallback(() => {
    if (!timerEnabled) return;
    
    setRemainingTime(timerDuration);
    
    countdownRef.current = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          if (countdownRef.current) {
            clearInterval(countdownRef.current);
          }
          onTimerEnd();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [timerEnabled, timerDuration, onTimerEnd]);

  const stopCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, []);

  const resetCountdown = useCallback(() => {
    stopCountdown();
    setRemainingTime(timerDuration);
  }, [stopCountdown, timerDuration]);

  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  return {
    timerEnabled,
    timerDuration,
    remainingTime,
    setTimerEnabled,
    setTimerDuration,
    startCountdown,
    stopCountdown,
    resetCountdown,
  };
};
