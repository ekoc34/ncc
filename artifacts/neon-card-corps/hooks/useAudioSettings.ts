import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateAudioSettings } from '@/game/audio';

const STORAGE_KEY = '@ncc:audio_v1';

export interface AudioSettings {
  sfxVolume: number;    // 0.0 – 1.0
  musicVolume: number;  // 0.0 – 1.0
  isMuted: boolean;
}

const DEFAULT: AudioSettings = { sfxVolume: 0.8, musicVolume: 0.5, isMuted: false };

interface UseAudioSettingsResult {
  settings: AudioSettings;
  isLoaded: boolean;
  setMuted: (v: boolean) => void;
  setSfxVolume: (v: number) => void;
  setMusicVolume: (v: number) => void;
}

export function useAudioSettings(): UseAudioSettingsResult {
  const [settings, setSettings] = useState<AudioSettings>(DEFAULT);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Partial<AudioSettings>;
            setSettings({ ...DEFAULT, ...parsed });
          } catch { /* use default */ }
        }
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    updateAudioSettings(settings.sfxVolume, settings.musicVolume, settings.isMuted);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {});
  }, [settings, isLoaded]);

  const setMuted = useCallback((v: boolean) => {
    setSettings((p) => ({ ...p, isMuted: v }));
  }, []);

  const setSfxVolume = useCallback((v: number) => {
    setSettings((p) => ({ ...p, sfxVolume: v }));
  }, []);

  const setMusicVolume = useCallback((v: number) => {
    setSettings((p) => ({ ...p, musicVolume: v }));
  }, []);

  return { settings, isLoaded, setMuted, setSfxVolume, setMusicVolume };
}
