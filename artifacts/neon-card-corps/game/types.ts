export type CardTag = 'lightning' | 'void' | 'fire' | 'ice' | 'tech';
export type CardType = 'attack' | 'shield' | 'skill' | 'power';

export type CardEffect =
  | { kind: 'damage'; amount: number }
  | { kind: 'shield'; amount: number }
  | { kind: 'draw'; amount: number }
  | { kind: 'discard'; amount: number }
  | { kind: 'burn'; amount: number }
  | { kind: 'freeze'; turns: number }
  | { kind: 'heal'; amount: number }
  | { kind: 'energy_next'; amount: number }
  | { kind: 'aoe_damage'; amount: number }
  | { kind: 'multi_damage'; hits: number; amount: number }
  | { kind: 'zero_cost_next' }
  | { kind: 'weaken'; amount: number }
  | { kind: 'drain_heal'; amount: number };

export interface Card {
  id: string;
  name: string;
  cost: number;
  type: CardType;
  tags: CardTag[];
  effects: CardEffect[];
  description: string;
  rarity: 'common' | 'uncommon' | 'rare';
}

export interface CardInstance extends Card {
  instanceId: string;
}

export type SynergyType = 'lightning' | 'void' | 'fire' | 'ice' | 'tech';

export interface Synergy {
  id: SynergyType;
  name: string;
  description: string;
  requirement: number;
  bonusDescription: string;
  color: string;
}

export type StatusEffect =
  | { kind: 'burn'; stacks: number }
  | { kind: 'freeze'; turns: number }
  | { kind: 'weaken'; amount: number };

export interface EnemyTemplate {
  id: string;
  name: string;
  maxHp: number;
  armor: number;
  attacks: EnemyAttack[];
  isBoss?: boolean;
  description: string;
}

export interface EnemyAttack {
  name: string;
  damage: number;
  effect?: 'drain_energy' | 'charge' | 'double_attack' | 'stun' | 'buff_armor' | 'enrage' | 'regen';
  effectAmount?: number;
  chargeFor?: number;
}

export interface CombatEnemy {
  templateId: string;
  name: string;
  hp: number;
  maxHp: number;
  armor: number;
  shield: number;
  statusEffects: StatusEffect[];
  attackIndex: number;
  chargeTurns: number;
  isBoss: boolean;
  nextAttack: EnemyAttack;
  dodgeChance: number;
  regenAmount: number;
  enraged: boolean;
}

export interface CombatPlayer {
  hp: number;
  maxHp: number;
  shield: number;
  energy: number;
  maxEnergy: number;
  statusEffects: StatusEffect[];
  zeroCostNext: boolean;
  energyBoostNext: number;
  gold: number;
}

export type CombatPhase =
  | 'player_turn'
  | 'enemy_turn'
  | 'wave_complete'
  | 'boss_intro'
  | 'game_over'
  | 'victory';

export interface CombatState {
  phase: CombatPhase;
  wave: number;
  maxWaves: number;
  turn: number;
  player: CombatPlayer;
  enemies: CombatEnemy[];
  hand: CardInstance[];
  deck: CardInstance[];
  discard: CardInstance[];
  log: string[];
  activeSynergies: SynergyType[];
  cardsPlayedThisTurn: number;
  pendingCards: Card[];
  goldEarned: number;
}

export interface MetaProgress {
  totalGold: number;
  totalRuns: number;
  totalWins: number;
  upgrades: Record<string, number>;
  unlockedCards: string[];
  highScore: number;
}

export const DEFAULT_META: MetaProgress = {
  totalGold: 0,
  totalRuns: 0,
  totalWins: 0,
  upgrades: {},
  unlockedCards: [],
  highScore: 0,
};

export interface UpgradeOption {
  id: string;
  name: string;
  description: string;
  maxLevel: number;
  costPerLevel: number;
  icon: string;
}
