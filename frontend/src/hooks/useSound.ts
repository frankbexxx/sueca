import { useRef, useCallback } from 'react';

/**
 * Custom hook for playing sound effects using Web Audio API
 * Provides card play sounds and error sounds
 * Uses oscillator-based tones (no audio files required)
 */
export const useSound = () => {
  // Audio context singleton - initialized lazily on first use
  const audioContextRef = useRef<AudioContext | null>(null);

  /**
   * Initializes Web Audio API context if not already created
   * Handles browser compatibility (webkitAudioContext for older browsers)
   */
  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }, []);

  /**
   * Plays a single tone using Web Audio API oscillator
   * Creates a tone with fade-out effect using gain node
   * Silently fails if audio is unavailable (e.g., autoplay restrictions)
   */
  const playTone = useCallback((frequency: number, duration: number = 200, type: OscillatorType = 'sine') => {
    try {
      initAudio();
      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      // Create oscillator (sound source) and gain node (volume control)
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Configure tone
      oscillator.frequency.value = frequency;
      oscillator.type = type;

      // Fade out effect - start at 30% volume, fade to 1% over duration
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

      // Play and stop
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);
    } catch (error) {
      // Silently fail if audio is not available (autoplay restrictions, etc.)
      console.debug('Audio not available:', error);
    }
  }, [initAudio]);

  /**
   * Card play sound - two-tone "whoosh" effect
   * Plays ascending tones to simulate card movement
   */
  const playCardSound = useCallback(() => {
    // Play a short "whoosh" sound
    playTone(300, 150, 'sine');
    setTimeout(() => playTone(400, 100, 'sine'), 50);
  }, [playTone]);

  /**
   * Error sound - low harsh tone
   * Uses sawtooth wave for more aggressive sound
   */
  const playErrorSound = useCallback(() => {
    // Play an error sound
    playTone(200, 300, 'sawtooth');
  }, [playTone]);

  return {
    playCardSound,
    playErrorSound
  };
};

