import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { getRunStats, RunStats, DEFAULT_RUN_STATS } from '@/game/runStats';
import { getSynergyById } from '@/game/synergies';

const { width: SCREEN_W } = Dimensions.get('window');

// ─── Count-up hook ───────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1100, delay = 0): number {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    if (target === 0) { setCurrent(0); return; }
    let rafId: number;
    const timer = setTimeout(() => {
      let startTime: number | null = null;
      const tick = (now: number) => {
        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCurrent(Math.round(eased * target));
        if (progress < 1) rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }, delay);
    return () => { clearTimeout(timer); cancelAnimationFrame(rafId); };
  }, [target, duration, delay]);
  return current;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  unit?: string;
  color?: string;
  delay?: number;
  isText?: boolean;
  textValue?: string;
}

function StatCard({ label, value, unit = '', color = '#00f5ff', delay = 0, isText, textValue }: StatCardProps) {
  const displayed = useCountUp(isText ? 0 : value, 1000, delay + 200);

  const opacity = useSharedValue(0);
  const ty = useSharedValue(18);
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 320 }));
    ty.value = withDelay(delay, withSpring(0, { damping: 14, stiffness: 180 }));
  }, []);

  return (
    <Animated.View style={[styles.statCard, style]}>
      <Text style={[styles.statValue, { color }]}>
        {isText ? textValue ?? '—' : displayed}
        {!isText && unit && <Text style={styles.statUnit}>{unit}</Text>}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Animated.View>
  );
}

// ─── Tag Bar ─────────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  lightning: '#ffee00',
  void: '#7b2fff',
  fire: '#ff6030',
  ice: '#80e8ff',
  tech: '#00ff88',
};

function TagBar({ tag, count, max, delay = 0 }: { tag: string; count: number; max: number; delay: number }) {
  const pct = max > 0 ? count / max : 0;
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withDelay(delay, withTiming(pct, { duration: 700 }));
  }, []);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%` as any,
  }));

  const color = TAG_COLORS[tag] ?? '#aaaaff';
  const barMaxW = SCREEN_W - 80;

  return (
    <View style={styles.tagBarRow}>
      <Text style={[styles.tagBarLabel, { color }]}>{tag.toUpperCase()}</Text>
      <View style={[styles.tagBarBg, { maxWidth: barMaxW - 100 }]}>
        <Animated.View style={[styles.tagBarFill, barStyle, { backgroundColor: color }]} />
      </View>
      <Text style={[styles.tagBarCount, { color }]}>{count}</Text>
    </View>
  );
}

// ─── Synergy Badge ────────────────────────────────────────────────────────────

function AnimatedSynergyBadge({ synergyId, delay }: { synergyId: string; delay: number }) {
  const s = getSynergyById(synergyId as any);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 250 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 9, stiffness: 220 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!s) return null;
  return (
    <Animated.View style={[styles.synergyBadge, { borderColor: s.color }, style]}>
      <Text style={[styles.synergyBadgeText, { color: s.color }]}>{s.name}</Text>
    </Animated.View>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ title, delay = 0 }: { title: string; delay?: number }) {
  const opacity = useSharedValue(0);
  useEffect(() => { opacity.value = withDelay(delay, withTiming(1, { duration: 300 })); }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View style={[styles.sectionHeader, style]}>
      <View style={styles.sectionLine} />
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionLine} />
    </Animated.View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function RunSummaryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === 'web' ? 60 : insets.top;
  const botPad = Platform.OS === 'web' ? 24 : insets.bottom;

  const stats: RunStats = getRunStats() ?? DEFAULT_RUN_STATS;

  // Derived stats
  const tagEntries = Object.entries(stats.tagUsage).sort((a, b) => b[1] - a[1]);
  const maxTagCount = tagEntries.length > 0 ? tagEntries[0][1] : 1;
  const mostUsedTag = tagEntries[0]?.[0] ?? '—';
  const tagColor = TAG_COLORS[mostUsedTag] ?? '#00f5ff';

  const cardEntries = Object.entries(stats.cardUsage).sort((a, b) => b[1].count - a[1].count);
  const topCard = cardEntries[0]?.[1];

  // Header animation
  const headerScale = useSharedValue(0.5);
  const headerOpacity = useSharedValue(0);
  const glowPulse = useSharedValue(0.4);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 350 });
    headerScale.value = withSpring(1, { damping: 8, stiffness: 130 });
    if (stats.won) {
      glowPulse.value = withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.5, { duration: 600 }),
        withTiming(1, { duration: 400 }),
        withTiming(0.6, { duration: 800 }),
      );
    }
    Haptics.notificationAsync(
      stats.won ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
    );
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ scale: headerScale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Background glow */}
      <Animated.View
        style={[
          styles.bgGlow,
          { backgroundColor: stats.won ? '#00ff88' : '#ff3060' },
          glowStyle,
        ]}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: botPad + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.headerBox, headerStyle]}>
          <Text style={[styles.statusTag, { color: stats.won ? '#00ff88' : '#ff3060' }]}>
            {stats.won ? '✓ MISSION COMPLETE' : '✕ SYSTEM FAILURE'}
          </Text>
          <Text style={[styles.headline, { color: stats.won ? '#00ff88' : '#ff3060' }]}>
            {stats.won ? 'VICTORY' : 'GAME OVER'}
          </Text>
          <Text style={styles.subheadline}>
            Wave {stats.wave} · {stats.turnsSurvived} turns · {stats.goldEarned} gold
          </Text>
        </Animated.View>

        {/* Stats Grid */}
        <SectionHeader title="RUN STATS" delay={100} />
        <View style={styles.statsGrid}>
          <StatCard label="TOTAL DAMAGE" value={stats.totalDamage} color="#ff3060" delay={120} />
          <StatCard label="HIGHEST HIT" value={stats.highestHit} color="#ff6030" delay={180} />
          <StatCard label="CARDS PLAYED" value={stats.cardsPlayed} color="#00f5ff" delay={240} />
          <StatCard label="TURNS" value={stats.turnsSurvived} color="#7b2fff" delay={300} />
          <StatCard label="BOSS DAMAGE" value={stats.bossDamage} color="#ff3060" delay={360} />
          <StatCard label="GOLD EARNED" value={stats.goldEarned} unit=" G" color="#ffee00" delay={420} />
          <StatCard
            label="SYNERGIES"
            value={stats.synergiesActivated.length}
            color="#00ff88"
            delay={480}
          />
          <StatCard
            label="MOST USED TAG"
            value={0}
            isText
            textValue={mostUsedTag !== '—' ? mostUsedTag.toUpperCase() : '—'}
            color={tagColor}
            delay={540}
          />
        </View>

        {/* Build Breakdown */}
        <SectionHeader title="BUILD BREAKDOWN" delay={600} />

        {/* Top card */}
        {topCard && (
          <Animated.View
            style={[
              styles.topCardBox,
              useAnimatedStyle(() => ({
                opacity: withDelay(620, withTiming(1, { duration: 300 })),
                transform: [{ translateY: withDelay(620, withSpring(0, { damping: 14, stiffness: 180 })) }],
              })),
            ]}
          >
            <Text style={styles.topCardLabel}>MOST PLAYED CARD</Text>
            <View style={styles.topCardRow}>
              <Text style={styles.topCardName}>{topCard.name}</Text>
              <View style={styles.topCardCountBox}>
                <Text style={styles.topCardCount}>{topCard.count}×</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Tag distribution */}
        {tagEntries.length > 0 && (
          <View style={styles.tagSection}>
            <Text style={styles.sectionSmallLabel}>TAG DISTRIBUTION</Text>
            {tagEntries.map(([tag, count], i) => (
              <TagBar key={tag} tag={tag} count={count} max={maxTagCount} delay={660 + i * 80} />
            ))}
          </View>
        )}

        {/* Active synergies */}
        {stats.activeSynergies.length > 0 && (
          <View style={styles.synergySection}>
            <Text style={styles.sectionSmallLabel}>ACTIVE SYNERGIES</Text>
            <View style={styles.synergyRow}>
              {stats.activeSynergies.map((s, i) => (
                <AnimatedSynergyBadge key={s} synergyId={s} delay={800 + i * 100} />
              ))}
            </View>
          </View>
        )}

        {/* All synergies activated during run */}
        {stats.synergiesActivated.length > stats.activeSynergies.length && (
          <View style={styles.synergySection}>
            <Text style={styles.sectionSmallLabel}>SYNERGIES SEEN THIS RUN</Text>
            <View style={styles.synergyRow}>
              {stats.synergiesActivated.map((s, i) => (
                <AnimatedSynergyBadge key={s} synergyId={s} delay={900 + i * 80} />
              ))}
            </View>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.buttonsSection}>
          {stats.won && (
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                router.replace('/upgrade');
              }}
            >
              <Feather name="trending-up" size={16} color="#07000f" />
              <Text style={styles.btnPrimaryText}>UPGRADE SHOP</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.btn, styles.btnSecondary]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.replace('/');
            }}
          >
            <Feather name="refresh-cw" size={14} color="#00f5ff" />
            <Text style={styles.btnSecondaryText}>RETRY RUN</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, styles.btnGhost]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.replace('/');
            }}
          >
            <Feather name="home" size={14} color="#6060a0" />
            <Text style={styles.btnGhostText}>MAIN MENU</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07000f',
  },
  bgGlow: {
    position: 'absolute',
    top: -100,
    left: '50%',
    width: 300,
    height: 300,
    borderRadius: 150,
    marginLeft: -150,
    opacity: 0.06,
    zIndex: 0,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 0,
  },

  // Header
  headerBox: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 4,
  },
  statusTag: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 6,
  },
  headline: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 8,
  },
  subheadline: {
    color: '#6060a0',
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '600',
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 14,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2a0060',
  },
  sectionTitle: {
    color: '#4040a0',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3,
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  statCard: {
    width: '47.5%',
    backgroundColor: '#0d001e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a0035',
    paddingHorizontal: 14,
    paddingVertical: 14,
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 36,
    marginBottom: 4,
  },
  statUnit: {
    fontSize: 18,
    fontWeight: '600',
  },
  statLabel: {
    color: '#4040a0',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
  },

  // Top card
  topCardBox: {
    backgroundColor: '#0d001e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a0060',
    padding: 16,
    marginBottom: 10,
  },
  topCardLabel: {
    color: '#4040a0',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 8,
  },
  topCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topCardName: {
    color: '#e0e0ff',
    fontSize: 18,
    fontWeight: '700',
  },
  topCardCountBox: {
    backgroundColor: '#00f5ff22',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#00f5ff50',
  },
  topCardCount: {
    color: '#00f5ff',
    fontSize: 16,
    fontWeight: '800',
  },

  // Tag bars
  tagSection: {
    backgroundColor: '#0d001e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a0035',
    padding: 14,
    marginBottom: 10,
  },
  sectionSmallLabel: {
    color: '#4040a0',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 12,
  },
  tagBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tagBarLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    width: 60,
  },
  tagBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#1a0035',
    borderRadius: 3,
    overflow: 'hidden',
  },
  tagBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  tagBarCount: {
    fontSize: 11,
    fontWeight: '700',
    width: 20,
    textAlign: 'right',
  },

  // Synergy section
  synergySection: {
    backgroundColor: '#0d001e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a0035',
    padding: 14,
    marginBottom: 10,
  },
  synergyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  synergyBadge: {
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0d001e',
  },
  synergyBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },

  // Buttons
  buttonsSection: {
    gap: 10,
    marginTop: 8,
  },
  btn: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  btnPrimary: {
    backgroundColor: '#00f5ff',
  },
  btnPrimaryText: {
    color: '#07000f',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 3,
  },
  btnSecondary: {
    backgroundColor: '#1a0035',
    borderWidth: 1.5,
    borderColor: '#00f5ff',
  },
  btnSecondaryText: {
    color: '#00f5ff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 2,
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#2a0060',
  },
  btnGhostText: {
    color: '#6060a0',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
