import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MetaProgress, UpgradeOption, DEFAULT_META } from '@/game/types';

const META_KEY = 'ncc_meta_v1';

export const UPGRADE_OPTIONS: UpgradeOption[] = [
  {
    id: 'max_hp',
    name: 'Reinforced Hull',
    description: '+10 max HP per level',
    maxLevel: 5,
    costPerLevel: 15,
    icon: 'heart',
  },
  {
    id: 'max_energy',
    name: 'Power Core',
    description: '+1 max energy per level',
    maxLevel: 2,
    costPerLevel: 25,
    icon: 'zap',
  },
  {
    id: 'extra_card',
    name: 'Combat AI',
    description: '+1 Volt Strike in starting deck',
    maxLevel: 2,
    costPerLevel: 20,
    icon: 'cpu',
  },
  {
    id: 'start_shield',
    name: 'Auto-Shield',
    description: 'Start each run with +5 shield',
    maxLevel: 3,
    costPerLevel: 18,
    icon: 'shield',
  },
];

interface MetaContextValue {
  meta: MetaProgress;
  isLoaded: boolean;
  addGold: (amount: number) => Promise<void>;
  spendGold: (amount: number) => Promise<boolean>;
  purchaseUpgrade: (upgradeId: string) => Promise<boolean>;
  recordRun: (won: boolean, score: number) => Promise<void>;
  resetMeta: () => Promise<void>;
}

const MetaContext = createContext<MetaContextValue | null>(null);

export function MetaProvider({ children }: { children: React.ReactNode }) {
  const [meta, setMeta] = useState<MetaProgress>(DEFAULT_META);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(META_KEY).then((raw) => {
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as MetaProgress;
          setMeta({ ...DEFAULT_META, ...parsed });
        } catch {}
      }
      setIsLoaded(true);
    });
  }, []);

  const save = useCallback(async (next: MetaProgress) => {
    setMeta(next);
    await AsyncStorage.setItem(META_KEY, JSON.stringify(next));
  }, []);

  const addGold = useCallback(async (amount: number) => {
    setMeta((prev) => {
      const next = { ...prev, totalGold: prev.totalGold + amount };
      AsyncStorage.setItem(META_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const spendGold = useCallback(async (amount: number): Promise<boolean> => {
    let success = false;
    setMeta((prev) => {
      if (prev.totalGold < amount) return prev;
      success = true;
      const next = { ...prev, totalGold: prev.totalGold - amount };
      AsyncStorage.setItem(META_KEY, JSON.stringify(next));
      return next;
    });
    await new Promise((r) => setTimeout(r, 50));
    return success;
  }, []);

  const purchaseUpgrade = useCallback(async (upgradeId: string): Promise<boolean> => {
    const option = UPGRADE_OPTIONS.find((u) => u.id === upgradeId);
    if (!option) return false;
    let success = false;
    setMeta((prev) => {
      const currentLevel = prev.upgrades[upgradeId] ?? 0;
      if (currentLevel >= option.maxLevel) return prev;
      const cost = option.costPerLevel;
      if (prev.totalGold < cost) return prev;
      success = true;
      const next: MetaProgress = {
        ...prev,
        totalGold: prev.totalGold - cost,
        upgrades: { ...prev.upgrades, [upgradeId]: currentLevel + 1 },
      };
      AsyncStorage.setItem(META_KEY, JSON.stringify(next));
      return next;
    });
    await new Promise((r) => setTimeout(r, 50));
    return success;
  }, []);

  const recordRun = useCallback(async (won: boolean, score: number) => {
    setMeta((prev) => {
      const next: MetaProgress = {
        ...prev,
        totalRuns: prev.totalRuns + 1,
        totalWins: prev.totalWins + (won ? 1 : 0),
        highScore: Math.max(prev.highScore, score),
      };
      AsyncStorage.setItem(META_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const resetMeta = useCallback(async () => {
    await save(DEFAULT_META);
  }, [save]);

  return (
    <MetaContext.Provider value={{ meta, isLoaded, addGold, spendGold, purchaseUpgrade, recordRun, resetMeta }}>
      {children}
    </MetaContext.Provider>
  );
}

export function useMeta() {
  const ctx = useContext(MetaContext);
  if (!ctx) throw new Error('useMeta must be used within MetaProvider');
  return ctx;
}
