import { EnemyTemplate, CombatEnemy } from './types';

export const ENEMY_TEMPLATES: EnemyTemplate[] = [
  {
    id: 'drone',
    name: 'Rogue Drone',
    maxHp: 22,
    armor: 0,
    description: 'A malfunctioning security drone.',
    attacks: [
      { name: 'Laser Shot', damage: 5 },
      { name: 'Laser Shot', damage: 5 },
      { name: 'Overcharge', damage: 9 },
    ],
  },
  {
    id: 'thug',
    name: 'Street Thug',
    maxHp: 32,
    armor: 0,
    description: 'Hired muscle from the undercity.',
    attacks: [
      { name: 'Punch', damage: 7 },
      { name: 'Block Up', damage: 3, effect: 'buff_armor', effectAmount: 4 },
      { name: 'Heavy Blow', damage: 11 },
    ],
  },
  {
    id: 'netrunner',
    name: 'Netrunner',
    maxHp: 24,
    armor: 0,
    description: 'A hacker who drains your systems.',
    attacks: [
      { name: 'Data Spike', damage: 5 },
      { name: 'Energy Drain', damage: 3, effect: 'drain_energy', effectAmount: 1 },
      { name: 'Neural Hack', damage: 8 },
    ],
  },
  {
    id: 'turret',
    name: 'Guard Turret',
    maxHp: 38,
    armor: 3,
    description: 'A stationary auto-turret that charges before firing.',
    attacks: [
      { name: 'Charging...', damage: 0, effect: 'charge', chargeFor: 2 },
      { name: 'Charging...', damage: 0, effect: 'charge', chargeFor: 2 },
      { name: 'Cannon Blast', damage: 16 },
    ],
  },
  {
    id: 'cyborg',
    name: 'Cyborg Enforcer',
    maxHp: 48,
    armor: 6,
    description: 'Half human, half machine. Heavily armored.',
    attacks: [
      { name: 'Blade Swipe', damage: 8 },
      { name: 'Blade Swipe', damage: 8 },
      { name: 'Power Slam', damage: 14 },
    ],
  },
  {
    id: 'wraith',
    name: 'Shadow Wraith',
    maxHp: 26,
    armor: 0,
    description: 'A ghost in the machine. Hard to hit.',
    attacks: [
      { name: 'Phase Strike', damage: 7 },
      { name: 'Phase Strike', damage: 7 },
      { name: 'Terror', damage: 5, effect: 'drain_energy', effectAmount: 1 },
    ],
  },
  {
    id: 'vampire',
    name: 'Data Vampire',
    maxHp: 34,
    armor: 0,
    description: 'Feeds on energy and regenerates HP.',
    attacks: [
      { name: 'Life Drain', damage: 6, effect: 'regen', effectAmount: 4 },
      { name: 'Life Drain', damage: 6, effect: 'regen', effectAmount: 4 },
      { name: 'Blood Feast', damage: 10, effect: 'regen', effectAmount: 8 },
    ],
  },
  {
    id: 'spider',
    name: 'Mech Spider',
    maxHp: 30,
    armor: 0,
    description: 'Fast and aggressive. Attacks twice.',
    attacks: [
      { name: 'Double Strike', damage: 5, effect: 'double_attack', effectAmount: 4 },
      { name: 'Double Strike', damage: 5, effect: 'double_attack', effectAmount: 4 },
      { name: 'Web Trap', damage: 3, effect: 'buff_armor', effectAmount: 0 },
    ],
  },
];

export const BOSS_TEMPLATE: EnemyTemplate = {
  id: 'nexus7',
  name: 'NEXUS-7',
  maxHp: 130,
  armor: 8,
  isBoss: true,
  description: 'The city\'s rogue AI overlord. Apex predator of the grid.',
  attacks: [
    { name: 'System Strike', damage: 12 },
    { name: 'Neural Overload', damage: 18, effect: 'drain_energy', effectAmount: 2 },
    { name: 'ENRAGE', damage: 8, effect: 'enrage', effectAmount: 10 },
    { name: 'Omega Blast', damage: 28 },
    { name: 'Omega Blast', damage: 28 },
    { name: 'System Strike', damage: 14 },
  ],
};

export const WAVE_CONFIGS: string[][] = [
  ['drone', 'thug'],
  ['netrunner', 'turret'],
  ['cyborg', 'wraith', 'spider'],
];

export function createCombatEnemy(template: EnemyTemplate, attackIndex = 0): CombatEnemy {
  return {
    templateId: template.id,
    name: template.name,
    hp: template.maxHp,
    maxHp: template.maxHp,
    armor: template.armor,
    shield: 0,
    statusEffects: [],
    attackIndex,
    chargeTurns: 0,
    isBoss: template.isBoss ?? false,
    nextAttack: template.attacks[attackIndex % template.attacks.length],
    dodgeChance: template.id === 'wraith' ? 0.3 : 0,
    regenAmount: 0,
    enraged: false,
  };
}

export function getEnemyTemplate(id: string): EnemyTemplate | undefined {
  if (id === 'nexus7') return BOSS_TEMPLATE;
  return ENEMY_TEMPLATES.find((e) => e.id === id);
}
