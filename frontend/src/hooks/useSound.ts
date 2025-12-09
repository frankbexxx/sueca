import { useRef, useCallback } from 'react';

// Simple sound system using Web Audio API
export const useSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  const playTone = useCallback((frequency: number, duration: number = 200, type: OscillatorType = 'sine') => {
    try {
      initAudio();
      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      // Silently fail if audio is not available
      console.debug('Audio not available:', error);
    }
  }, [initAudio]);

  const playCardSound = useCallback(() => {
    // Play a short "whoosh" sound
    playTone(300, 150, 'sine');
    setTimeout(() => playTone(400, 100, 'sine'), 50);
  }, [playTone]);

  const playTrickWonSound = useCallback(() => {
    // Play a victory sound
    playTone(523, 200, 'sine'); // C
    setTimeout(() => playTone(659, 200, 'sine'), 150); // E
    setTimeout(() => playTone(784, 300, 'sine'), 300); // G
  }, [playTone]);

  const playErrorSound = useCallback(() => {
    // Play an error sound
    playTone(200, 300, 'sawtooth');
  }, [playTone]);

  return {
    playCardSound,
    playTrickWonSound,
    playErrorSound
  };
};

