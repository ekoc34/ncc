import { Card } from './types';

export const ALL_CARDS: Card[] = [
  // === BASIC ===
  {
    id: 'slash',
    name: 'Neon Slash',
    cost: 1,
    type: 'attack',
    tags: [],
    effects: [{ kind: 'damage', amount: 6 }],
    description: 'Deal 6 damage.',
    rarity: 'common',
  },
  {
    id: 'block',
    name: 'Data Shield',
    cost: 1,
    type: 'shield',
    tags: [],
    effects: [{ kind: 'shield', amount: 8 }],
    description: 'Gain 8 shield.',
    rarity: 'common',
  },
  {
    id: 'draw',
    name: 'Draw Protocol',
    cost: 1,
    type: 'skill',
    tags: [],
    effects: [{ kind: 'draw', amount: 2 }],
    description: 'Draw 2 cards.',
    rarity: 'common',
  },

  // === LIGHTNING ===
  {
    id: 'volt_strike',
    name: 'Volt Strike',
    cost: 2,
    type: 'attack',
    tags: ['lightning'],
    effects: [{ kind: 'damage', amount: 10 }],
    description: 'Deal 10 damage. [LIGHTNING]',
    rarity: 'common',
  },
  {
    id: 'chain_lightning',
    name: 'Chain Lightning',
    cost: 3,
    type: 'attack',
    tags: ['lightning'],
    effects: [{ kind: 'aoe_damage', amount: 6 }],
    description: 'Deal 6 damage to ALL enemies. [LIGHTNING]',
    rarity: 'uncommon',
  },
  {
    id: 'arc_discharge',
    name: 'Arc Discharge',
    cost: 1,
    type: 'attack',
    tags: ['lightning'],
    effects: [{ kind: 'damage', amount: 4 }, { kind: 'burn', amount: 2 }],
    description: 'Deal 4 damage. Apply 2 Burn. [LIGHTNING]',
    rarity: 'common',
  },
  {
    id: 'storm_surge',
    name: 'Storm Surge',
    cost: 2,
    type: 'skill',
    tags: ['lightning'],
    effects: [{ kind: 'energy_next', amount: 2 }, { kind: 'draw', amount: 1 }],
    description: 'Gain 2 extra energy next turn. Draw 1. [LIGHTNING]',
    rarity: 'uncommon',
  },

  // === VOID ===
  {
    id: 'void_slash',
    name: 'Void Slash',
    cost: 2,
    type: 'attack',
    tags: ['void'],
    effects: [{ kind: 'damage', amount: 7 }, { kind: 'drain_heal', amount: 3 }],
    description: 'Deal 7 damage. Heal 3 HP. [VOID]',
    rarity: 'common',
  },
  {
    id: 'shadow_form',
    name: 'Shadow Form',
    cost: 2,
    type: 'skill',
    tags: ['void'],
    effects: [{ kind: 'shield', amount: 10 }, { kind: 'draw', amount: 2 }],
    description: 'Gain 10 shield. Draw 2 cards. [VOID]',
    rarity: 'uncommon',
  },
  {
    id: 'entropy',
    name: 'Entropy',
    cost: 3,
    type: 'skill',
    tags: ['void'],
    effects: [{ kind: 'weaken', amount: 4 }, { kind: 'damage', amount: 5 }],
    description: 'Weaken enemy: -4 damage. Deal 5 damage. [VOID]',
    rarity: 'rare',
  },

  // === FIRE ===
  {
    id: 'flame_strike',
    name: 'Flame Strike',
    cost: 2,
    type: 'attack',
    tags: ['fire'],
    effects: [{ kind: 'damage', amount: 6 }, { kind: 'burn', amount: 3 }],
    description: 'Deal 6 damage. Apply 3 Burn. [FIRE]',
    rarity: 'common',
  },
  {
    id: 'inferno',
    name: 'Inferno Blast',
    cost: 3,
    type: 'attack',
    tags: ['fire'],
    effects: [{ kind: 'damage', amount: 16 }],
    description: 'Deal 16 damage. [FIRE]',
    rarity: 'uncommon',
  },
  {
    id: 'combustion',
    name: 'Combustion',
    cost: 1,
    type: 'skill',
    tags: ['fire'],
    effects: [{ kind: 'burn', amount: 3 }],
    description: 'Apply 3 Burn to all enemies. [FIRE]',
    rarity: 'common',
  },

  // === ICE ===
  {
    id: 'cryo_shot',
    name: 'Cryo Shot',
    cost: 2,
    type: 'attack',
    tags: ['ice'],
    effects: [{ kind: 'damage', amount: 8 }, { kind: 'freeze', turns: 1 }],
    description: 'Deal 8 damage. Freeze enemy for 1 turn. [ICE]',
    rarity: 'common',
  },
  {
    id: 'ice_wall',
    name: 'Ice Wall',
    cost: 2,
    type: 'shield',
    tags: ['ice'],
    effects: [{ kind: 'shield', amount: 14 }],
    description: 'Gain 14 shield. [ICE]',
    rarity: 'uncommon',
  },
  {
    id: 'glacial_spike',
    name: 'Glacial Spike',
    cost: 3,
    type: 'attack',
    tags: ['ice'],
    effects: [{ kind: 'damage', amount: 12 }, { kind: 'freeze', turns: 2 }],
    description: 'Deal 12 damage. Freeze enemy for 2 turns. [ICE]',
    rarity: 'rare',
  },

  // === TECH ===
  {
    id: 'nano_strike',
    name: 'Nano Strike',
    cost: 1,
    type: 'attack',
    tags: ['tech'],
    effects: [{ kind: 'damage', amount: 4 }],
    description: 'Deal 4 damage. [TECH]',
    rarity: 'common',
  },
  {
    id: 'deploy_bots',
    name: 'Deploy Bots',
    cost: 3,
    type: 'attack',
    tags: ['tech'],
    effects: [{ kind: 'multi_damage', hits: 3, amount: 3 }],
    description: 'Deal 3 damage 3 times. [TECH]',
    rarity: 'uncommon',
  },
  {
    id: 'system_boost',
    name: 'System Boost',
    cost: 2,
    type: 'skill',
    tags: ['tech'],
    effects: [{ kind: 'energy_next', amount: 3 }, { kind: 'shield', amount: 5 }],
    description: 'Gain 3 extra energy next turn. Gain 5 shield. [TECH]',
    rarity: 'uncommon',
  },
  {
    id: 'overclock',
    name: 'Overclock',
    cost: 0,
    type: 'skill',
    tags: ['tech'],
    effects: [{ kind: 'zero_cost_next' }],
    description: 'Your next card costs 0. [TECH]',
    rarity: 'rare',
  },
  {
    id: 'plasma_cannon',
    name: 'Plasma Cannon',
    cost: 3,
    type: 'attack',
    tags: [],
    effects: [{ kind: 'damage', amount: 20 }],
    description: 'Deal 20 damage.',
    rarity: 'rare',
  },
];

export const STARTER_DECK_IDS = [
  'slash', 'slash', 'slash',
  'block', 'block', 'block',
  'draw', 'draw',
  'nano_strike', 'volt_strike',
];

export function getCardById(id: string): Card | undefined {
  return ALL_CARDS.find((c) => c.id === id);
}

export function getRewardCards(wave: number, ownedCards: string[]): Card[] {
  const rarity = wave >= 3 ? ['uncommon', 'rare'] : wave >= 2 ? ['common', 'uncommon'] : ['common'];
  const pool = ALL_CARDS.filter((c) => rarity.includes(c.rarity));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

export function createInstanceId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}
