import { Synergy, SynergyType, CardInstance } from './types';

export const SYNERGIES: Synergy[] = [
  {
    id: 'lightning',
    name: 'CHAIN REACTION',
    description: '2+ Lightning cards in deck',
    requirement: 2,
    bonusDescription: '+3 dmg on lightning cards. First lightning card each turn hits all enemies.',
    color: '#ffee00',
  },
  {
    id: 'void',
    name: 'SOUL DRAIN',
    description: '2+ Void cards in deck',
    requirement: 2,
    bonusDescription: 'Void cards heal 2 extra HP. Void damage bypasses armor.',
    color: '#7b2fff',
  },
  {
    id: 'fire',
    name: 'INFERNO MODE',
    description: '2+ Fire cards in deck',
    requirement: 2,
    bonusDescription: 'Burn deals 2/turn (up from 1). Fire cards deal +3 damage.',
    color: '#ff6030',
  },
  {
    id: 'ice',
    name: 'DEEP FREEZE',
    description: '2+ Ice cards in deck',
    requirement: 2,
    bonusDescription: 'Frozen enemies take 50% more damage.',
    color: '#80e8ff',
  },
  {
    id: 'tech',
    name: 'OVERCLOCK PROTOCOL',
    description: '2+ Tech cards in deck',
    requirement: 2,
    bonusDescription: 'Start each turn with +1 energy. Tech cards deal +2 damage.',
    color: '#00ff88',
  },
];

export function computeActiveSynergies(deck: CardInstance[]): SynergyType[] {
  const tagCounts: Record<string, number> = {};
  for (const card of deck) {
    for (const tag of card.tags) {
      tagCounts[tag] = (tagCounts[tag] ?? 0) + 1;
    }
  }
  const active: SynergyType[] = [];
  for (const s of SYNERGIES) {
    if ((tagCounts[s.id] ?? 0) >= s.requirement) {
      active.push(s.id);
    }
  }
  return active;
}

export function getSynergyById(id: SynergyType): Synergy {
  return SYNERGIES.find((s) => s.id === id)!;
}
