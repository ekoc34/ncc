export interface RunStats {
  won: boolean;
  wave: number;
  totalDamage: number;
  highestHit: number;
  cardsPlayed: number;
  synergiesActivated: string[];
  turnsSurvived: number;
  tagUsage: Record<string, number>;
  bossDamage: number;
  goldEarned: number;
  cardUsage: Record<string, { name: string; count: number }>;
  activeSynergies: string[];
}

export const DEFAULT_RUN_STATS: RunStats = {
  won: false,
  wave: 1,
  totalDamage: 0,
  highestHit: 0,
  cardsPlayed: 0,
  synergiesActivated: [],
  turnsSurvived: 1,
  tagUsage: {},
  bossDamage: 0,
  goldEarned: 0,
  cardUsage: {},
  activeSynergies: [],
};

let _current: RunStats | null = null;

export function setRunStats(stats: RunStats): void {
  _current = { ...stats };
}

export function getRunStats(): RunStats | null {
  return _current;
}

export function clearRunStats(): void {
  _current = null;
}
