import { useCallback, useEffect } from 'react';
import {
  playErrorSound as playErrorSfx,
  playRandomCardPlay,
  playShuffleSound as playShuffleSfx,
  playTrickWinSound as playTrickWinSfx,
  playUiClick as playUiClickSfx,
  preloadSfx
} from '../services/audioService';

/**
 * Hook for playing game sound effects from Kenney CC0 assets.
 */
export const useSound = () => {
  useEffect(() => {
    preloadSfx();
  }, []);

  const playCardSound = useCallback(() => {
    playRandomCardPlay();
  }, []);

  const playErrorSound = useCallback(() => {
    playErrorSfx();
  }, []);

  const playShuffleSound = useCallback(() => {
    playShuffleSfx();
  }, []);

  const playTrickWinSound = useCallback(() => {
    playTrickWinSfx();
  }, []);

  const playUiClick = useCallback(() => {
    playUiClickSfx();
  }, []);

  return {
    playCardSound,
    playErrorSound,
    playShuffleSound,
    playTrickWinSound,
    playUiClick
  };
};
