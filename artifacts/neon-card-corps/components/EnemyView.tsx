import React, { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  cancelAnimation,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { CombatEnemy } from '@/game/types';

interface Props {
  enemy: CombatEnemy;
  index: number;
  hitCount?: number;
}

export default function EnemyView({ enemy, index, hitCount = 0 }: Props) {
  const isDead = enemy.hp <= 0;
  const hpPct = enemy.hp / enemy.maxHp;
  const hpColor = hpPct > 0.6 ? '#00ff88' : hpPct > 0.3 ? '#ffee00' : '#ff3060';
  const isFrozen = enemy.statusEffects.some((e) => e.kind === 'freeze');
  const burnStacks = (
    enemy.statusEffects.find((e) => e.kind === 'burn') as
      | { kind: 'burn'; stacks: number }
      | undefined
  )?.stacks ?? 0;

  // Hit flash
  const flashOpacity = useSharedValue(0);
  const flashStyle = useAnimatedStyle(() => ({ opacity: flashOpacity.value }));

  // Boss enrage pulse
  const enragePulse = useSharedValue(1);
  const enrageStyle = useAnimatedStyle(() => ({ opacity: enragePulse.value }));
  const prevHitCount = useRef(0);

  useEffect(() => {
    if (hitCount > 0 && hitCount !== prevHitCount.current) {
      prevHitCount.current = hitCount;
      const isHeavy = enemy.isBoss || hpPct < 0.3;
      flashOpacity.value = withSequence(
        withTiming(isHeavy ? 0.85 : 0.65, { duration: 55 }),
        withTiming(isHeavy ? 0.3 : 0, { duration: isHeavy ? 60 : 0 }),
        withTiming(isHeavy ? 0.7 : 0, { duration: isHeavy ? 50 : 0 }),
        withTiming(0, { duration: 180 }),
      );
    }
  }, [hitCount]);

  useEffect(() => {
    if (enemy.enraged) {
      enragePulse.value = withRepeat(
        withSequence(
          withTiming(0.25, { duration: 450 }),
          withTiming(1, { duration: 450 }),
        ),
        -1,
        false,
      );
    } else {
      cancelAnimation(enragePulse);
      enragePulse.value = 1;
    }
    return () => cancelAnimation(enragePulse);
  }, [enemy.enraged]);

  if (isDead) return null;

  const borderColor = enemy.isBoss
    ? enemy.enraged
      ? '#ff3060'
      : '#ff306099'
    : '#2a0060';

  return (
    <View
      style={[
        styles.container,
        enemy.isBoss && styles.bossContainer,
        isFrozen && styles.frozenContainer,
        { borderColor },
      ]}
    >
      {/* Hit flash overlay */}
      <Animated.View
        style={[StyleSheet.absoluteFill, styles.flashOverlay, flashStyle]}
        pointerEvents="none"
      />

      {/* Boss enrage border pulse */}
      {enemy.isBoss && enemy.enraged && (
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.enrageOverlay, enrageStyle]}
          pointerEvents="none"
        />
      )}

      {enemy.isBoss && (
        <Text style={styles.bossLabel}>
          {enemy.enraged ? '⚡ ENRAGED' : '⚠ BOSS'}
        </Text>
      )}

      <Text style={[styles.name, enemy.isBoss && styles.bossName]} numberOfLines={1}>
        {enemy.name}
      </Text>

      {/* HP bar — boss gets special styling */}
      <View style={[styles.hpBarBg, enemy.isBoss && styles.bossHpBarBg]}>
        <Animated.View
          style={[
            styles.hpBarFill,
            {
              width: `${Math.max(0, hpPct * 100)}%` as any,
              backgroundColor: enemy.isBoss ? (hpPct > 0.5 ? '#ff3060' : '#ff0030') : hpColor,
            },
          ]}
        />
        {/* Boss HP segments */}
        {enemy.isBoss && (
          <>
            <View style={[styles.hpSegment, { left: '25%' }]} />
            <View style={[styles.hpSegment, { left: '50%' }]} />
            <View style={[styles.hpSegment, { left: '75%' }]} />
          </>
        )}
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
          <View style={[styles.statChip, { backgroundColor: '#80e8ff22' }]}>
            <Text style={[styles.statText, { color: '#80e8ff' }]}>❄ FROZEN</Text>
          </View>
        )}
        {enemy.enraged && (
          <View style={[styles.statChip, { backgroundColor: '#ff306022' }]}>
            <Text style={[styles.statText, { color: '#ff3060' }]}>⚡ RAGE</Text>
          </View>
        )}
      </View>

      {/* Next attack */}
      <View style={[styles.nextAttackBox, enemy.isBoss && styles.bossNextAttackBox]}>
        <Text style={styles.nextAttackLabel}>NEXT:</Text>
        <Text style={styles.nextAttackName} numberOfLines={1}>
          {enemy.nextAttack.name}
        </Text>
        {enemy.nextAttack.damage > 0 && (
          <Text
            style={[
              styles.nextAttackDmg,
              enemy.enraged && { color: '#ff0030', fontSize: 14 },
            ]}
          >
            {enemy.enraged ? enemy.nextAttack.damage + 5 : enemy.nextAttack.damage} DMG
          </Text>
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
    padding: 10,
    marginHorizontal: 5,
    minWidth: 110,
    maxWidth: 140,
    flex: 1,
    overflow: 'hidden',
  },
  bossContainer: {
    borderWidth: 2,
    flex: 1,
    minWidth: 200,
    maxWidth: 320,
  },
  frozenContainer: {
    borderColor: '#80e8ff',
    backgroundColor: '#080025',
  },
  flashOverlay: {
    backgroundColor: '#ffffff',
    borderRadius: 11,
  },
  enrageOverlay: {
    backgroundColor: '#ff3060',
    borderRadius: 11,
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
    fontSize: 16,
    color: '#ff6080',
  },
  hpBarBg: {
    height: 6,
    backgroundColor: '#2a0060',
    borderRadius: 3,
    marginBottom: 3,
    overflow: 'hidden',
    position: 'relative',
  },
  bossHpBarBg: {
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ff306050',
  },
  hpBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  hpSegment: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#0d001e',
    zIndex: 1,
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
  bossNextAttackBox: {
    borderWidth: 1,
    borderColor: '#ff306040',
    backgroundColor: '#1a0010',
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
