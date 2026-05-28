import {
  Card, CardInstance, CombatEnemy, CombatPlayer, CombatState, CombatPhase,
  StatusEffect, SynergyType, CardEffect,
} from './types';
import { ENEMY_TEMPLATES, BOSS_TEMPLATE, WAVE_CONFIGS, createCombatEnemy } from './enemies';
import { STARTER_DECK_IDS, ALL_CARDS, getRewardCards, createInstanceId } from './cards';
import { computeActiveSynergies } from './synergies';

export type CombatAction =
  | { type: 'PLAY_CARD'; cardIndex: number }
  | { type: 'END_TURN' }
  | { type: 'START_NEXT_WAVE' }
  | { type: 'ADD_CARD'; card: Card }
  | { type: 'SKIP_CARD' }
  | { type: 'DISMISS_BOSS_INTRO' };

// ─── Helpers ───────────────────────────────────────────────────────────────

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function drawCards(
  amount: number,
  deck: CardInstance[],
  discard: CardInstance[],
  hand: CardInstance[],
): { hand: CardInstance[]; deck: CardInstance[]; discard: CardInstance[] } {
  let d = [...deck];
  let disc = [...discard];
  let h = [...hand];
  for (let i = 0; i < amount; i++) {
    if (d.length === 0) {
      d = shuffle(disc);
      disc = [];
    }
    if (d.length === 0) break;
    h.push(d.shift()!);
  }
  return { hand: h, deck: d, discard: disc };
}

function applyStatusDot(enemies: CombatEnemy[], synergies: SynergyType[]): { enemies: CombatEnemy[]; log: string[] } {
  const burnDmg = synergies.includes('fire') ? 2 : 1;
  const log: string[] = [];
  const newEnemies = enemies.map((e) => {
    if (e.hp <= 0) return e;
    let hp = e.hp;
    const newEffects: StatusEffect[] = [];
    for (const eff of e.statusEffects) {
      if (eff.kind === 'burn') {
        const dmg = burnDmg * eff.stacks;
        hp = Math.max(0, hp - dmg);
        log.push(`${e.name} takes ${dmg} burn damage.`);
        if (eff.stacks > 1) newEffects.push({ kind: 'burn', stacks: eff.stacks - 1 });
      } else if (eff.kind === 'freeze') {
        if (eff.turns > 1) newEffects.push({ kind: 'freeze', turns: eff.turns - 1 });
        else log.push(`${e.name} is no longer frozen.`);
      } else {
        newEffects.push(eff);
      }
    }
    return { ...e, hp, statusEffects: newEffects };
  });
  return { enemies: newEnemies, log };
}

function getEnemyEffectiveArmor(enemy: CombatEnemy): number {
  return enemy.armor;
}

function applyDamageToEnemy(
  enemy: CombatEnemy,
  rawDmg: number,
  synergies: SynergyType[],
  bypassArmor = false,
): { enemy: CombatEnemy; actualDmg: number } {
  if (enemy.hp <= 0) return { enemy, actualDmg: 0 };

  // Dodge chance (wraith)
  if (enemy.dodgeChance > 0 && Math.random() < enemy.dodgeChance) {
    return { enemy, actualDmg: -1 }; // -1 = dodged
  }

  // Ice synergy: frozen enemy takes 50% more dmg
  const isFrozen = enemy.statusEffects.some((e) => e.kind === 'freeze');
  const dmgMult = (synergies.includes('ice') && isFrozen) ? 1.5 : 1;
  let dmg = Math.round(rawDmg * dmgMult);

  let shield = enemy.shield;
  let armor = bypassArmor ? 0 : getEnemyEffectiveArmor(enemy);
  let hp = enemy.hp;

  if (shield > 0) {
    const blocked = Math.min(shield, dmg);
    dmg -= blocked;
    shield -= blocked;
  }
  dmg = Math.max(0, dmg - armor);
  hp = Math.max(0, hp - dmg);

  return { enemy: { ...enemy, hp, shield }, actualDmg: dmg };
}

function applyCardEffect(
  effect: CardEffect,
  card: Card,
  player: CombatPlayer,
  enemies: CombatEnemy[],
  synergies: SynergyType[],
  logs: string[],
  isFirstLightning: boolean,
): { player: CombatPlayer; enemies: CombatEnemy[] } {
  let p = { ...player };
  let ens = [...enemies];
  const firstAlive = ens.findIndex((e) => e.hp > 0);

  const lightningBonus = synergies.includes('lightning') ? 3 : 0;
  const fireBonus = synergies.includes('fire') ? 3 : 0;
  const techBonus = synergies.includes('tech') ? 2 : 0;
  const isVoid = card.tags.includes('void');
  const isLightning = card.tags.includes('lightning');
  const isFire = card.tags.includes('fire');
  const isTech = card.tags.includes('tech');
  const bypassArmor = isVoid && synergies.includes('void');
  const extraHeal = isVoid && synergies.includes('void') ? 2 : 0;

  const baseDmgBonus = (isLightning ? lightningBonus : 0) + (isFire ? fireBonus : 0) + (isTech ? techBonus : 0);

  switch (effect.kind) {
    case 'damage': {
      let rawDmg = effect.amount + baseDmgBonus;
      // Lightning synergy: first lightning card hits all enemies
      if (isLightning && isFirstLightning && synergies.includes('lightning') && ens.filter((e) => e.hp > 0).length > 1) {
        for (let i = 0; i < ens.length; i++) {
          if (ens[i].hp <= 0) continue;
          const { enemy, actualDmg } = applyDamageToEnemy(ens[i], rawDmg, synergies, bypassArmor);
          ens[i] = enemy;
          if (actualDmg === -1) logs.push(`${ens[i].name} dodges!`);
          else logs.push(`Chain hits ${ens[i].name} for ${actualDmg} dmg.`);
        }
      } else if (firstAlive >= 0) {
        const { enemy, actualDmg } = applyDamageToEnemy(ens[firstAlive], rawDmg, synergies, bypassArmor);
        ens[firstAlive] = enemy;
        if (actualDmg === -1) logs.push(`${ens[firstAlive].name} dodges!`);
        else logs.push(`Deal ${actualDmg} damage to ${ens[firstAlive].name}.`);
      }
      break;
    }
    case 'aoe_damage': {
      const rawDmg = effect.amount + baseDmgBonus;
      for (let i = 0; i < ens.length; i++) {
        if (ens[i].hp <= 0) continue;
        const { enemy, actualDmg } = applyDamageToEnemy(ens[i], rawDmg, synergies, bypassArmor);
        ens[i] = enemy;
        if (actualDmg === -1) logs.push(`${ens[i].name} dodges!`);
        else logs.push(`${ens[i].name} takes ${actualDmg} dmg.`);
      }
      break;
    }
    case 'multi_damage': {
      const rawDmg = effect.amount + baseDmgBonus;
      if (firstAlive >= 0) {
        for (let h = 0; h < effect.hits; h++) {
          const { enemy, actualDmg } = applyDamageToEnemy(ens[firstAlive], rawDmg, synergies, bypassArmor);
          ens[firstAlive] = enemy;
          logs.push(`Hit ${h + 1}: ${actualDmg} dmg.`);
        }
      }
      break;
    }
    case 'shield': {
      p = { ...p, shield: p.shield + effect.amount };
      logs.push(`Gain ${effect.amount} shield.`);
      break;
    }
    case 'draw': {
      // Draw is handled outside this function
      logs.push(`Draw ${effect.amount} card(s).`);
      break;
    }
    case 'burn': {
      if (effect.kind === 'burn') {
        const isCombustion = card.id === 'combustion';
        const targets = isCombustion ? ens.filter((e) => e.hp > 0) : firstAlive >= 0 ? [ens[firstAlive]] : [];
        for (const t of targets) {
          const idx = ens.indexOf(t);
          const existing = t.statusEffects.find((e) => e.kind === 'burn') as { kind: 'burn'; stacks: number } | undefined;
          const newEffects: StatusEffect[] = t.statusEffects.filter((e) => e.kind !== 'burn');
          newEffects.push({ kind: 'burn', stacks: (existing?.stacks ?? 0) + effect.amount });
          ens[idx] = { ...t, statusEffects: newEffects };
          logs.push(`Apply ${effect.amount} Burn to ${t.name}.`);
        }
      }
      break;
    }
    case 'freeze': {
      if (firstAlive >= 0) {
        const e = ens[firstAlive];
        const newEffects: StatusEffect[] = e.statusEffects.filter((ef) => ef.kind !== 'freeze');
        newEffects.push({ kind: 'freeze', turns: effect.turns });
        ens[firstAlive] = { ...e, statusEffects: newEffects };
        logs.push(`${e.name} is frozen for ${effect.turns} turn(s)!`);
      }
      break;
    }
    case 'heal': {
      p = { ...p, hp: Math.min(p.maxHp, p.hp + effect.amount) };
      logs.push(`Heal ${effect.amount} HP.`);
      break;
    }
    case 'drain_heal': {
      const healAmt = effect.amount + extraHeal;
      p = { ...p, hp: Math.min(p.maxHp, p.hp + healAmt) };
      logs.push(`Drain heals ${healAmt} HP.`);
      break;
    }
    case 'energy_next': {
      p = { ...p, energyBoostNext: p.energyBoostNext + effect.amount };
      logs.push(`Gain ${effect.amount} bonus energy next turn.`);
      break;
    }
    case 'zero_cost_next': {
      p = { ...p, zeroCostNext: true };
      logs.push('Next card costs 0 energy!');
      break;
    }
    case 'weaken': {
      if (firstAlive >= 0) {
        const e = ens[firstAlive];
        const existing = e.statusEffects.find((ef) => ef.kind === 'weaken') as { kind: 'weaken'; amount: number } | undefined;
        const newEffects: StatusEffect[] = e.statusEffects.filter((ef) => ef.kind !== 'weaken');
        newEffects.push({ kind: 'weaken', amount: (existing?.amount ?? 0) + effect.amount });
        ens[firstAlive] = { ...e, statusEffects: newEffects };
        logs.push(`${e.name} weakened: -${effect.amount} damage.`);
      }
      break;
    }
  }

  return { player: p, enemies: ens };
}

// ─── Main Reducer ──────────────────────────────────────────────────────────

export function buildInitialState(upgrades: Record<string, number>): CombatState {
  const hpBonus = (upgrades['max_hp'] ?? 0) * 10;
  const energyBonus = (upgrades['max_energy'] ?? 0) * 1;
  const extraCard = upgrades['extra_card'] ?? 0;
  const startShield = (upgrades['start_shield'] ?? 0) * 5;

  const starterCardIds = [...STARTER_DECK_IDS];
  if (extraCard > 0) {
    for (let i = 0; i < Math.min(extraCard, 2); i++) starterCardIds.push('volt_strike');
  }

  const allCards: CardInstance[] = starterCardIds
    .map((id) => {
      const card = ALL_CARDS.find((c) => c.id === id);
      if (!card) return null;
      return { ...card, instanceId: createInstanceId() };
    })
    .filter(Boolean) as CardInstance[];

  const shuffledDeck = shuffle(allCards);

  const player: CombatPlayer = {
    hp: 70 + hpBonus,
    maxHp: 70 + hpBonus,
    shield: startShield,
    energy: 3 + energyBonus,
    maxEnergy: 3 + energyBonus,
    statusEffects: [],
    zeroCostNext: false,
    energyBoostNext: 0,
    gold: 0,
  };

  const { hand, deck, discard } = drawCards(5, shuffledDeck, [], []);
  const synergies = computeActiveSynergies([...hand, ...deck, ...discard]);
  const waveEnemies = WAVE_CONFIGS[0].map((id) => {
    const t = ENEMY_TEMPLATES.find((e) => e.id === id)!;
    return createCombatEnemy(t);
  });

  return {
    phase: 'player_turn',
    wave: 1,
    maxWaves: 4,
    turn: 1,
    player,
    enemies: waveEnemies,
    hand,
    deck,
    discard,
    log: ['Run started! Wave 1 of 3 + Boss.'],
    activeSynergies: synergies,
    cardsPlayedThisTurn: 0,
    pendingCards: [],
    goldEarned: 0,
  };
}

export function combatReducer(state: CombatState, action: CombatAction): CombatState {
  switch (action.type) {
    case 'PLAY_CARD': {
      if (state.phase !== 'player_turn') return state;
      const cardInst = state.hand[action.cardIndex];
      if (!cardInst) return state;

      const cost = state.player.zeroCostNext ? 0 : cardInst.cost;
      if (state.player.energy < cost) return state;

      let player = { ...state.player, energy: state.player.energy - cost, zeroCostNext: false };
      let enemies = [...state.enemies];
      const logs: string[] = [`▶ ${cardInst.name}`];
      let drawCount = 0;
      const isFirstLightning = cardInst.tags.includes('lightning') && state.cardsPlayedThisTurn === 0;

      for (const eff of cardInst.effects) {
        if (eff.kind === 'draw') {
          drawCount += eff.amount;
        }
        const result = applyCardEffect(eff, cardInst, player, enemies, state.activeSynergies, logs, isFirstLightning);
        player = result.player;
        enemies = result.enemies;
      }

      const newHand = state.hand.filter((_, i) => i !== action.cardIndex);
      const newDiscard = [...state.discard, cardInst];

      let { hand: finalHand, deck: finalDeck, discard: finalDiscard } = { hand: newHand, deck: state.deck, discard: newDiscard };
      if (drawCount > 0) {
        const drawn = drawCards(drawCount, finalDeck, finalDiscard, finalHand);
        finalHand = drawn.hand;
        finalDeck = drawn.deck;
        finalDiscard = drawn.discard;
      }

      const allDead = enemies.every((e) => e.hp <= 0);
      const synergies = computeActiveSynergies([...finalHand, ...finalDeck, ...finalDiscard]);

      if (allDead) {
        const goldGain = state.wave === 4 ? 25 : 10 + state.wave * 3;
        logs.push(`💀 All enemies defeated! +${goldGain} gold!`);
        const rewardCards = getRewardCards(state.wave, []);
        return {
          ...state,
          player: { ...player, gold: player.gold + goldGain },
          enemies,
          hand: finalHand,
          deck: finalDeck,
          discard: finalDiscard,
          log: [...state.log, ...logs],
          activeSynergies: synergies,
          cardsPlayedThisTurn: state.cardsPlayedThisTurn + 1,
          phase: state.wave >= state.maxWaves ? 'victory' : 'wave_complete',
          goldEarned: state.goldEarned + goldGain,
          pendingCards: rewardCards,
        };
      }

      return {
        ...state,
        player,
        enemies,
        hand: finalHand,
        deck: finalDeck,
        discard: finalDiscard,
        log: [...state.log, ...logs],
        activeSynergies: synergies,
        cardsPlayedThisTurn: state.cardsPlayedThisTurn + 1,
      };
    }

    case 'END_TURN': {
      if (state.phase !== 'player_turn') return state;
      const logs: string[] = ['--- Enemy Turn ---'];
      let player = { ...state.player, shield: 0 };
      let enemies = [...state.enemies];

      // Apply burn/freeze dots
      const { enemies: dotEnemies, log: dotLog } = applyStatusDot(enemies, state.activeSynergies);
      enemies = dotEnemies;
      logs.push(...dotLog);

      // Check if enemies died from dots
      const allDeadAfterDot = enemies.every((e) => e.hp <= 0);
      if (allDeadAfterDot) {
        const goldGain = 10 + state.wave * 3;
        logs.push(`All enemies burned to death! +${goldGain} gold!`);
        const rewardCards = getRewardCards(state.wave, []);
        const drawn = drawCards(5, state.deck, [...state.discard, ...state.hand], []);
        return {
          ...state,
          player: { ...player, gold: player.gold + goldGain, energy: player.maxEnergy + player.energyBoostNext, energyBoostNext: 0 },
          enemies,
          hand: drawn.hand,
          deck: drawn.deck,
          discard: drawn.discard,
          log: [...state.log, ...logs],
          phase: state.wave >= state.maxWaves ? 'victory' : 'wave_complete',
          goldEarned: state.goldEarned + goldGain,
          pendingCards: rewardCards,
          cardsPlayedThisTurn: 0,
        };
      }

      // Enemies attack
      for (let i = 0; i < enemies.length; i++) {
        const e = enemies[i];
        if (e.hp <= 0) continue;
        const isFrozen = e.statusEffects.some((ef) => ef.kind === 'freeze');
        if (isFrozen) {
          logs.push(`${e.name} is frozen — skips attack!`);
          continue;
        }

        const atk = e.nextAttack;
        let baseDmg = atk.damage + (e.enraged ? 5 : 0);
        const weakenEffect = e.statusEffects.find((ef) => ef.kind === 'weaken') as { kind: 'weaken'; amount: number } | undefined;
        if (weakenEffect) baseDmg = Math.max(0, baseDmg - weakenEffect.amount);

        if (atk.effect === 'charge') {
          logs.push(`${e.name} is charging...`);
        } else if (atk.effect === 'double_attack') {
          // Two hits
          let dmg1 = Math.max(0, baseDmg - player.shield);
          player = { ...player, shield: Math.max(0, player.shield - baseDmg), hp: Math.max(0, player.hp - dmg1) };
          let dmg2 = Math.max(0, atk.effectAmount! - player.shield);
          player = { ...player, shield: Math.max(0, player.shield - (atk.effectAmount ?? 0)), hp: Math.max(0, player.hp - dmg2) };
          logs.push(`${e.name} double strikes! ${dmg1} + ${dmg2} dmg.`);
        } else if (atk.effect === 'buff_armor') {
          enemies[i] = { ...e, armor: e.armor + (atk.effectAmount ?? 3) };
          logs.push(`${e.name} gains ${atk.effectAmount ?? 3} armor.`);
        } else if (atk.effect === 'drain_energy') {
          const drain = atk.effectAmount ?? 1;
          player = { ...player, energy: Math.max(0, player.energy - drain) };
          let dmg = Math.max(0, baseDmg - player.shield);
          player = { ...player, shield: Math.max(0, player.shield - baseDmg), hp: Math.max(0, player.hp - dmg) };
          logs.push(`${e.name} drains ${drain} energy and deals ${dmg} dmg.`);
        } else if (atk.effect === 'regen') {
          const heal = atk.effectAmount ?? 4;
          enemies[i] = { ...e, hp: Math.min(e.maxHp, e.hp + heal) };
          let dmg = Math.max(0, baseDmg - player.shield);
          player = { ...player, shield: Math.max(0, player.shield - baseDmg), hp: Math.max(0, player.hp - dmg) };
          logs.push(`${e.name} regens ${heal} HP and deals ${dmg} dmg.`);
        } else if (atk.effect === 'enrage') {
          enemies[i] = { ...e, enraged: true, armor: e.armor + (atk.effectAmount ?? 5) };
          logs.push(`${e.name} ENRAGES! +${atk.effectAmount ?? 5} atk, +armor.`);
          let dmg = Math.max(0, baseDmg - player.shield);
          player = { ...player, shield: Math.max(0, player.shield - baseDmg), hp: Math.max(0, player.hp - dmg) };
          logs.push(`${e.name} deals ${dmg} dmg.`);
        } else {
          let dmg = Math.max(0, baseDmg - player.shield);
          player = { ...player, shield: Math.max(0, player.shield - baseDmg), hp: Math.max(0, player.hp - dmg) };
          if (dmg > 0) logs.push(`${e.name} attacks for ${dmg} dmg.`);
          else logs.push(`${e.name} attacks — blocked!`);
        }

        // Advance attack pattern
        const template = e.isBoss ? BOSS_TEMPLATE : ENEMY_TEMPLATES.find((et) => et.id === e.templateId)!;
        const nextIdx = (e.attackIndex + 1) % template.attacks.length;
        enemies[i] = { ...enemies[i], attackIndex: nextIdx, nextAttack: template.attacks[nextIdx] };
      }

      // Check player death
      if (player.hp <= 0) {
        return {
          ...state,
          player: { ...player, hp: 0 },
          enemies,
          log: [...state.log, ...logs, '☠ You have been defeated...'],
          phase: 'game_over',
          cardsPlayedThisTurn: 0,
        };
      }

      // Draw new hand
      const newEnergy = player.maxEnergy + player.energyBoostNext;
      const drawn = drawCards(5, state.deck, [...state.discard, ...state.hand], []);
      logs.push(`--- Your Turn (Energy: ${newEnergy}) ---`);

      return {
        ...state,
        player: { ...player, energy: newEnergy, energyBoostNext: 0 },
        enemies,
        hand: drawn.hand,
        deck: drawn.deck,
        discard: drawn.discard,
        log: [...state.log, ...logs],
        turn: state.turn + 1,
        cardsPlayedThisTurn: 0,
      };
    }

    case 'ADD_CARD': {
      const newInst: CardInstance = { ...action.card, instanceId: createInstanceId() };
      const allCards = [...state.hand, ...state.deck, ...state.discard, newInst];
      const synergies = computeActiveSynergies(allCards);
      const newDiscard = [...state.discard, newInst];

      // Start next wave
      const nextWave = state.wave + 1;
      let newEnemies: CombatEnemy[];
      let phaseAfter: CombatPhase = 'player_turn';
      let waveLog = '';

      if (nextWave >= state.maxWaves) {
        // Boss wave
        newEnemies = [createCombatEnemy(BOSS_TEMPLATE)];
        waveLog = '⚠ BOSS INCOMING: NEXUS-7!';
        phaseAfter = 'boss_intro';
      } else {
        const waveConfig = WAVE_CONFIGS[nextWave - 1];
        newEnemies = waveConfig.map((id) => {
          const t = ENEMY_TEMPLATES.find((e) => e.id === id)!;
          return createCombatEnemy(t);
        });
        waveLog = `Wave ${nextWave} begins!`;
      }

      const drawn = drawCards(5, state.deck, newDiscard, []);
      const goldBonus = state.player.gold;

      return {
        ...state,
        phase: phaseAfter,
        wave: nextWave,
        turn: state.turn + 1,
        player: { ...state.player, shield: 0, energy: state.player.maxEnergy + state.player.energyBoostNext, energyBoostNext: 0 },
        enemies: newEnemies,
        hand: drawn.hand,
        deck: drawn.deck,
        discard: drawn.discard,
        log: [...state.log, waveLog],
        activeSynergies: synergies,
        cardsPlayedThisTurn: 0,
        pendingCards: [],
      };
    }

    case 'SKIP_CARD': {
      // Start next wave without adding card
      const nextWave = state.wave + 1;
      let newEnemies: CombatEnemy[];
      let phaseAfter: CombatPhase = 'player_turn';
      let waveLog = '';

      if (nextWave >= state.maxWaves) {
        newEnemies = [createCombatEnemy(BOSS_TEMPLATE)];
        waveLog = '⚠ BOSS INCOMING: NEXUS-7!';
        phaseAfter = 'boss_intro';
      } else {
        const waveConfig = WAVE_CONFIGS[nextWave - 1];
        newEnemies = waveConfig.map((id) => {
          const t = ENEMY_TEMPLATES.find((e) => e.id === id)!;
          return createCombatEnemy(t);
        });
        waveLog = `Wave ${nextWave} begins!`;
      }

      const drawn = drawCards(5, state.deck, [...state.discard, ...state.hand], []);

      return {
        ...state,
        phase: phaseAfter,
        wave: nextWave,
        turn: state.turn + 1,
        player: { ...state.player, shield: 0, energy: state.player.maxEnergy, energyBoostNext: 0 },
        enemies: newEnemies,
        hand: drawn.hand,
        deck: drawn.deck,
        discard: drawn.discard,
        log: [...state.log, waveLog],
        cardsPlayedThisTurn: 0,
        pendingCards: [],
      };
    }

    case 'DISMISS_BOSS_INTRO': {
      if (state.phase !== 'boss_intro') return state;
      return { ...state, phase: 'player_turn' };
    }

    case 'START_NEXT_WAVE': {
      return state;
    }

    default:
      return state;
  }
}
