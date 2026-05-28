import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CombatEnemy } from '@/game/types';

interface Props {
  enemy: CombatEnemy;
  index: number;
}

export default function EnemyView({ enemy, index }: Props) {
  const isDead = enemy.hp <= 0;
  const hpPct = enemy.hp / enemy.maxHp;
  const hpColor = hpPct > 0.6 ? '#00ff88' : hpPct > 0.3 ? '#ffee00' : '#ff3060';
  const isFrozen = enemy.statusEffects.some((e) => e.kind === 'freeze');
  const burnStacks = (enemy.statusEffects.find((e) => e.kind === 'burn') as { kind: 'burn'; stacks: number } | undefined)?.stacks ?? 0;

  if (isDead) return null;

  return (
    <View style={[styles.container, enemy.isBoss && styles.bossContainer]}>
      {enemy.isBoss && (
        <Text style={styles.bossLabel}>⚠ BOSS</Text>
      )}

      <Text style={[styles.name, enemy.isBoss && styles.bossName]} numberOfLines={1}>
        {enemy.name}
      </Text>

      {/* HP bar */}
      <View style={styles.hpBarBg}>
        <View style={[styles.hpBarFill, { width: `${Math.max(0, hpPct * 100)}%` as any, backgroundColor: hpColor }]} />
      </View>
      <Text style={styles.hpText}>{enemy.hp}/{enemy.maxHp} HP</Text>

      {/* Stats row */}
      <View style={styles.statsRow}>
        {enemy.armor > 0 && (
          <View style={styles.statChip}>
            <Feather name="shield" size={10} color="#80e8ff" />
            <Text style={[styles.statText, { color: '#80e8ff' }]}>{enemy.armor}</Text>
          </View>
        )}
        {enemy.shield > 0 && (
          <View style={styles.statChip}>
            <Feather name="shield" size={10} color="#00f5ff" />
            <Text style={[styles.statText, { color: '#00f5ff' }]}>{enemy.shield}</Text>
          </View>
        )}
        {burnStacks > 0 && (
          <View style={styles.statChip}>
            <Text style={[styles.statText, { color: '#ff6030' }]}>🔥{burnStacks}</Text>
          </View>
        )}
        {isFrozen && (
          <View style={styles.statChip}>
            <Text style={[styles.statText, { color: '#80e8ff' }]}>❄ FROZEN</Text>
          </View>
        )}
        {enemy.enraged && (
          <View style={styles.statChip}>
            <Text style={[styles.statText, { color: '#ff3060' }]}>⚡ RAGE</Text>
          </View>
        )}
      </View>

      {/* Next attack preview */}
      <View style={styles.nextAttackBox}>
        <Text style={styles.nextAttackLabel}>NEXT:</Text>
        <Text style={styles.nextAttackName} numberOfLines={1}>{enemy.nextAttack.name}</Text>
        {enemy.nextAttack.damage > 0 && (
          <Text style={styles.nextAttackDmg}>{enemy.enraged ? enemy.nextAttack.damage + 5 : enemy.nextAttack.damage} DMG</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#120028',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a0060',
    padding: 10,
    marginHorizontal: 5,
    minWidth: 110,
    maxWidth: 140,
    flex: 1,
  },
  bossContainer: {
    borderColor: '#ff3060',
    borderWidth: 2,
    flex: 1,
    minWidth: 200,
    maxWidth: 320,
  },
  bossLabel: {
    color: '#ff3060',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 2,
  },
  name: {
    color: '#e0e0ff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  bossName: {
    fontSize: 15,
    color: '#ff3060',
  },
  hpBarBg: {
    height: 6,
    backgroundColor: '#2a0060',
    borderRadius: 3,
    marginBottom: 3,
    overflow: 'hidden',
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  hpText: {
    color: '#8888bb',
    fontSize: 9,
    textAlign: 'center',
    marginBottom: 5,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
    marginBottom: 5,
    minHeight: 16,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#1a0035',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  statText: {
    fontSize: 9,
    fontWeight: '700',
  },
  nextAttackBox: {
    backgroundColor: '#1a0035',
    borderRadius: 6,
    padding: 5,
    alignItems: 'center',
  },
  nextAttackLabel: {
    color: '#6060a0',
    fontSize: 8,
    letterSpacing: 1,
    fontWeight: '600',
  },
  nextAttackName: {
    color: '#e0e0ff',
    fontSize: 10,
    fontWeight: '600',
  },
  nextAttackDmg: {
    color: '#ff3060',
    fontSize: 11,
    fontWeight: '800',
  },
});
