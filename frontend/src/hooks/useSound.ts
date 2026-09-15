import { useCallback, useEffect } from 'react';
import {
  playDealSound as playDealSfx,
  playErrorSound as playErrorSfx,
  playRandomCardPlay,
  playShuffleSound as playShuffleSfx,
  playTrickCollectSound as playTrickCollectSfx,
  playUiClick as playUiClickSfx,
  preloadSfx
} from '../services/audioService';

/**
 * Hook for playing game sound effects via audioService.
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

  const playDealSound = useCallback(() => {
    playDealSfx();
  }, []);

  const playTrickCollectSound = useCallback(() => {
    playTrickCollectSfx();
  }, []);

  const playUiClick = useCallback(() => {
    playUiClickSfx();
  }, []);

  return {
    playCardSound,
    playErrorSound,
    playShuffleSound,
    playDealSound,
    playTrickCollectSound,
    playUiClick
  };
};
