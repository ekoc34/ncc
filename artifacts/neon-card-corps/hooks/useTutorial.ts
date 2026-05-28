import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@ncc:tutorial_v1';

interface UseTutorialResult {
  hasSeenTutorial: boolean;
  isLoaded: boolean;
  markSeen: () => Promise<void>;
  resetTutorial: () => Promise<void>;
}

export function useTutorial(): UseTutorialResult {
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((val) => {
        setHasSeenTutorial(val === 'done');
        setIsLoaded(true);
      })
      .catch(() => {
        setHasSeenTutorial(false);
        setIsLoaded(true);
      });
  }, []);

  const markSeen = useCallback(async () => {
    setHasSeenTutorial(true);
    await AsyncStorage.setItem(STORAGE_KEY, 'done');
  }, []);

  const resetTutorial = useCallback(async () => {
    setHasSeenTutorial(false);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  return { hasSeenTutorial, isLoaded, markSeen, resetTutorial };
}
