import React, { useReducer, useMemo, useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
  withRepeat,
  cancelAnimation,
} from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { combatReducer, buildInitialState } from '@/game/engine';
import { Card, SynergyType } from '@/game/types';
import { useMeta } from '@/context/MetaContext';
import { setRunStats } from '@/game/runStats';
import CardView from '@/components/CardView';
import EnemyView from '@/components/EnemyView';
import HealthBar from '@/components/HealthBar';
import SynergyBadge from '@/components/SynergyBadge';
import ParticleBurst from '@/components/ParticleBurst';
import SynergyPopup from '@/components/SynergyPopup';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ParticleBurstEntry {
  id: string;
  type: string;
}

// ─── Boss Intro Overlay ─────────────────────────────────────────────────────

function BossIntroOverlay({ onFight }: { onFight: () => void }) {
  const titleScale = useSharedValue(0.4);
  const titleOpacity = useSharedValue(0);
  const borderPulse = useSharedValue(0.3);

  useEffect(() => {
    titleOpacity.value = withSequence(
      withTiming(1, { duration: 300 }),
    );
    titleScale.value = withSpring(1, { damping: 7, stiffness: 100 });
    borderPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.3, { duration: 600 }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(borderPulse);
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderColor: `rgba(255,48,96,${borderPulse.value})`,
  }));

  return (
    <View style={overlay.bg}>
      <Animated.View style={[overlay.panel, borderStyle, { borderWidth: 2 }]}>
        <Text style={[overlay.title, { color: '#ff3060', fontSize: 11, letterSpacing: 4 }]}>
          ⚠ DANGER ⚠
        </Text>
        <Animated.View style={titleStyle}>
          <Text style={[overlay.title, { color: '#ff3060', fontSize: 34, marginTop: 6, letterSpacing: 2 }]}>
            NEXUS-7
          </Text>
        </Animated.View>
        <Text style={overlay.sub}>
          The city&apos;s rogue AI overlord awakens.{'\n'}Apex predator of the grid.
        </Text>
        <View style={bossStyles.statsRow}>
          <View style={bossStyles.stat}>
            <Text style={bossStyles.statVal}>130</Text>
            <Text style={bossStyles.statLabel}>HP</Text>
          </View>
          <View style={bossStyles.stat}>
            <Text style={bossStyles.statVal}>8</Text>
            <Text style={bossStyles.statLabel}>ARMOR</Text>
          </View>
          <View style={bossStyles.stat}>
            <Text style={[bossStyles.statVal, { color: '#ff3060', fontSize: 13 }]}>TURN 3</Text>
            <Text style={bossStyles.statLabel}>ENRAGES</Text>
          </View>
        </View>
        <TouchableOpacity
          style={bossStyles.fightBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            onFight();
          }}
        >
          <Text style={bossStyles.fightText}>ENGAGE NEXUS-7</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const bossStyles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    justifyContent: 'center',
    marginVertical: 20,
    backgroundColor: '#ff306022',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ff306050',
    width: '100%',
  },
  stat: { alignItems: 'center' },
  statVal: { color: '#ff8080', fontSize: 18, fontWeight: '800' },
  statLabel: { color: '#8888bb', fontSize: 9, letterSpacing: 1, fontWeight: '600' },
  fightBtn: {
    backgroundColor: '#ff3060',
    borderRadius: 10,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    width: '100%',
  },
  fightText: { color: '#07000f', fontSize: 16, fontWeight: '800', letterSpacing: 3 },
});

// ─── Card Select Overlay ────────────────────────────────────────────────────

function CardSelectOverlay({ cards, wave, onSelect, onSkip }: {
  cards: Card[];
  wave: number;
  onSelect: (c: Card) => void;
  onSkip: () => void;
}) {
  return (
    <View style={overlay.bg}>
      <View style={overlay.panel}>
        <View style={overlay.headerRow}>
          <Text style={overlay.title}>WAVE {wave} COMPLETE</Text>
          <View style={overlay.divider} />
        </View>
        <Text style={overlay.sub}>Choose a card to add to your deck</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={overlay.cardRow}
        >
          {cards.map((card) => (
            <CardView
              key={card.id}
              card={card}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                onSelect(card);
              }}
            />
          ))}
        </ScrollView>
        <TouchableOpacity style={overlay.skipBtn} onPress={onSkip}>
          <Text style={overlay.skipText}>SKIP — no card this wave</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Victory Overlay ────────────────────────────────────────────────────────

function VictoryOverlay({ goldEarned, onContinue }: { goldEarned: number; onContinue: () => void }) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    scale.value = withSpring(1, { damping: 9, stiffness: 150 });
  }, []);

  const panelStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={overlay.bg}>
      <Animated.View style={[overlay.panel, panelStyle]}>
        <Text style={[overlay.title, { color: '#ffee00', fontSize: 11, letterSpacing: 4 }]}>
          MISSION COMPLETE
        </Text>
        <Text style={[overlay.title, { color: '#00ff88', fontSize: 36, marginTop: 8 }]}>
          VICTORY
        </Text>
        <Text style={overlay.sub}>NEXUS-7 has been neutralized.</Text>
        <View style={victStyles.goldBox}>
          <Feather name="dollar-sign" size={28} color="#ffee00" />
          <Text style={victStyles.goldAmt}>{goldEarned}</Text>
          <Text style={victStyles.goldLabel}>GOLD EARNED</Text>
        </View>
        <TouchableOpacity
          style={victStyles.btn}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onContinue();
          }}
        >
          <Text style={victStyles.btnText}>CLAIM REWARDS →</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const victStyles = StyleSheet.create({
  goldBox: {
    alignItems: 'center',
    backgroundColor: '#ffee0022',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffee00',
    padding: 20,
    marginVertical: 24,
    width: '100%',
  },
  goldAmt: { color: '#ffee00', fontSize: 42, fontWeight: '800' },
  goldLabel: { color: '#8888bb', fontSize: 11, letterSpacing: 2, fontWeight: '600', marginTop: 4 },
  btn: {
    backgroundColor: '#00f5ff',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
  },
  btnText: { color: '#07000f', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
});

// ─── Game Over Overlay ──────────────────────────────────────────────────────

function GameOverOverlay({ goldEarned, wave, onRetry }: {
  goldEarned: number;
  wave: number;
  onRetry: () => void;
}) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 400 });
    scale.value = withSpring(1, { damping: 10, stiffness: 120 });
  }, []);

  const panelStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={overlay.bg}>
      <Animated.View style={[overlay.panel, panelStyle]}>
        <Text style={[overlay.title, { color: '#ff3060', fontSize: 11, letterSpacing: 4 }]}>
          SYSTEM FAILURE
        </Text>
        <Text style={[overlay.title, { color: '#ff3060', fontSize: 36, marginTop: 8 }]}>
          GAME OVER
        </Text>
        <Text style={overlay.sub}>You fell on Wave {wave}.</Text>
        <View style={goStyles.statsBox}>
          <Text style={goStyles.statsLabel}>Gold collected this run</Text>
          <Text style={goStyles.statsVal}>{goldEarned}</Text>
        </View>
        <TouchableOpacity
          style={goStyles.btn}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            onRetry();
          }}
        >
          <Text style={goStyles.btnText}>← BACK TO MENU</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const goStyles = StyleSheet.create({
  statsBox: {
    alignItems: 'center',
    backgroundColor: '#ff306022',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff306050',
    padding: 20,
    marginVertical: 24,
    width: '100%',
  },
  statsLabel: { color: '#8888bb', fontSize: 12, marginBottom: 6 },
  statsVal: { color: '#ff3060', fontSize: 36, fontWeight: '800' },
  btn: {
    backgroundColor: '#1a0035',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: '#2a0060',
  },
  btnText: { color: '#e0e0ff', fontSize: 15, fontWeight: '700', letterSpacing: 2 },
});

// ─── Shared overlay styles ──────────────────────────────────────────────────

const overlay = StyleSheet.create({
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#07000fdd',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 100,
  },
  panel: {
    backgroundColor: '#0d001e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a0060',
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  headerRow: { alignItems: 'center', width: '100%' },
  title: {
    color: '#e0e0ff',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 3,
    textAlign: 'center',
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: '#00f5ff',
    marginTop: 8,
    borderRadius: 1,
  },
  sub: {
    color: '#8888bb',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  cardRow: {
    paddingVertical: 16,
    paddingHorizontal: 4,
    gap: 4,
  },
  skipBtn: {
    marginTop: 4,
    padding: 12,
  },
  skipText: {
    color: '#6060a0',
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

// ─── Main Run Screen ────────────────────────────────────────────────────────

export default function RunScreen() {
  const params = useLocalSearchParams();
  const { addGold, recordRun } = useMeta();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const upgrades = useMemo<Record<string, number>>(() => {
    try { return JSON.parse((params.upgrades as string) ?? '{}'); } catch { return {}; }
  }, []);

  const [state, dispatch] = useReducer(combatReducer, upgrades, buildInitialState);

  // ── Animation state ────────────────────────────────────────────────────────
  const [enemyHitCounts, setEnemyHitCounts] = useState<number[]>([]);
  const [particleBursts, setParticleBursts] = useState<ParticleBurstEntry[]>([]);
  const [synergyPopup, setSynergyPopup] = useState<SynergyType | null>(null);

  const lastPlayedTagsRef = useRef<string[]>([]);
  const prevEnemyHPsRef = useRef<number[]>([]);
  const prevSynergiesRef = useRef<SynergyType[]>([]);
  const synergyPopupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Run stat tracking refs (no re-renders) ─────────────────────────────────
  const totalDamageRef = useRef(0);
  const highestHitRef = useRef(0);
  const cardsPlayedRef = useRef(0);
  const bossDamageRef = useRef(0);
  const tagUsageRef = useRef<Record<string, number>>({});
  const cardUsageRef = useRef<Record<string, { name: string; count: number }>>({});
  const synergyHistoryRef = useRef<Set<string>>(new Set());

  // Screenshake
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
    flex: 1,
  }));

  const triggerShake = useCallback((intensity: number = 8) => {
    shakeX.value = withSequence(
      withTiming(-intensity, { duration: 45 }),
      withTiming(intensity * 0.85, { duration: 45 }),
      withTiming(-intensity * 0.5, { duration: 40 }),
      withTiming(intensity * 0.25, { duration: 35 }),
      withTiming(0, { duration: 35 }),
    );
  }, [shakeX]);

  // ── Detect enemy HP drops → trigger hit animations ─────────────────────────
  useEffect(() => {
    const currentHPs = state.enemies.map((e) => e.hp);
    const prev = prevEnemyHPsRef.current;

    if (prev.length > 0) {
      let anyHit = false;
      let maxDmg = 0;

      const newCounts = [...enemyHitCounts];
      while (newCounts.length < state.enemies.length) newCounts.push(0);

      currentHPs.forEach((hp, i) => {
        if (prev[i] !== undefined && hp < prev[i]) {
          const dmg = prev[i] - hp;
          maxDmg = Math.max(maxDmg, dmg);
          newCounts[i] = (newCounts[i] ?? 0) + 1;
          anyHit = true;
          // Track stats
          totalDamageRef.current += dmg;
          if (dmg > highestHitRef.current) highestHitRef.current = dmg;
          if (state.enemies[i]?.isBoss) bossDamageRef.current += dmg;
        }
      });

      if (anyHit) {
        setEnemyHitCounts([...newCounts]);

        // Particles
        const burstType = lastPlayedTagsRef.current[0] ?? 'damage';
        const burstId = `${Date.now()}-${Math.random()}`;
        setParticleBursts((prev) => [...prev, { id: burstId, type: burstType }]);

        // Screenshake + haptics
        if (maxDmg >= 14) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          triggerShake(12);
        } else if (maxDmg >= 7) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          triggerShake(6);
        } else {
          triggerShake(3);
        }
      }
    }

    prevEnemyHPsRef.current = currentHPs;
  }, [state.enemies]);

  // ── Detect player HP drop → screen flash ──────────────────────────────────
  const playerHPRef = useRef(state.player.hp);
  const screenFlash = useSharedValue(0);
  const screenFlashStyle = useAnimatedStyle(() => ({
    opacity: screenFlash.value,
  }));

  useEffect(() => {
    const prev = playerHPRef.current;
    if (state.player.hp < prev) {
      const dmg = prev - state.player.hp;
      const intensity = dmg >= 15 ? 0.35 : dmg >= 8 ? 0.22 : 0.12;
      screenFlash.value = withSequence(
        withTiming(intensity, { duration: 60 }),
        withTiming(0, { duration: 300 }),
      );
      if (dmg >= 12) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        triggerShake(7);
      }
    }
    playerHPRef.current = state.player.hp;
  }, [state.player.hp]);

  // ── Detect new synergies ───────────────────────────────────────────────────
  useEffect(() => {
    const prev = prevSynergiesRef.current;
    const curr = state.activeSynergies;
    const newlyActive = curr.filter((s) => !prev.includes(s));

    if (newlyActive.length > 0) {
      if (synergyPopupTimer.current) clearTimeout(synergyPopupTimer.current);
      setSynergyPopup(newlyActive[0]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      synergyPopupTimer.current = setTimeout(() => setSynergyPopup(null), 2200);
      // Track synergy history
      newlyActive.forEach((s) => synergyHistoryRef.current.add(s));
    }

    prevSynergiesRef.current = curr;
  }, [state.activeSynergies]);

  useEffect(() => {
    return () => {
      if (synergyPopupTimer.current) clearTimeout(synergyPopupTimer.current);
    };
  }, []);

  // ── Layout ─────────────────────────────────────────────────────────────────
  const topPad = Platform.OS === 'web' ? 67 : insets.top;
  const botPad = Platform.OS === 'web' ? 34 : insets.bottom;

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handlePlayCard = useCallback((index: number) => {
    const card = state.hand[index];
    if (!card) return;
    const cost = state.player.zeroCostNext ? 0 : card.cost;
    if (state.player.energy < cost) return;
    // Store tags for particle type
    lastPlayedTagsRef.current = card.tags;
    // Track stats
    cardsPlayedRef.current++;
    card.tags.forEach((tag) => {
      tagUsageRef.current[tag] = (tagUsageRef.current[tag] ?? 0) + 1;
    });
    if (!cardUsageRef.current[card.id]) {
      cardUsageRef.current[card.id] = { name: card.name, count: 0 };
    }
    cardUsageRef.current[card.id].count++;
    dispatch({ type: 'PLAY_CARD', cardIndex: index });
  }, [state.hand, state.player.energy, state.player.zeroCostNext]);

  const handleEndTurn = useCallback(() => {
    if (state.phase !== 'player_turn') return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch({ type: 'END_TURN' });
  }, [state.phase]);

  const handleSelectCard = useCallback((card: Card) => {
    dispatch({ type: 'ADD_CARD', card });
  }, []);

  const handleSkipCard = useCallback(() => {
    dispatch({ type: 'SKIP_CARD' });
  }, []);

  const handleVictory = useCallback(async () => {
    await addGold(state.goldEarned);
    await recordRun(true, state.goldEarned * 10);
    setRunStats({
      won: true,
      wave: state.wave,
      totalDamage: totalDamageRef.current,
      highestHit: highestHitRef.current,
      cardsPlayed: cardsPlayedRef.current,
      synergiesActivated: Array.from(synergyHistoryRef.current),
      turnsSurvived: state.turn,
      tagUsage: { ...tagUsageRef.current },
      bossDamage: bossDamageRef.current,
      goldEarned: state.goldEarned,
      cardUsage: { ...cardUsageRef.current },
      activeSynergies: state.activeSynergies,
    });
    router.replace('/run-summary');
  }, [state.goldEarned, state.wave, state.turn, state.activeSynergies, addGold, recordRun, router]);

  const handleGameOver = useCallback(async () => {
    await recordRun(false, state.goldEarned * 10);
    setRunStats({
      won: false,
      wave: state.wave,
      totalDamage: totalDamageRef.current,
      highestHit: highestHitRef.current,
      cardsPlayed: cardsPlayedRef.current,
      synergiesActivated: Array.from(synergyHistoryRef.current),
      turnsSurvived: state.turn,
      tagUsage: { ...tagUsageRef.current },
      bossDamage: bossDamageRef.current,
      goldEarned: state.goldEarned,
      cardUsage: { ...cardUsageRef.current },
      activeSynergies: state.activeSynergies,
    });
    router.replace('/run-summary');
  }, [state.goldEarned, state.wave, state.turn, state.activeSynergies, recordRun, router]);

  const removeBurst = useCallback((id: string) => {
    setParticleBursts((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const livingEnemies = state.enemies.filter((e) => e.hp > 0);
  const recentLog = state.log.slice(-3);
  const isPlayerTurn = state.phase === 'player_turn';

  return (
    <View style={[styles.root, { paddingTop: topPad }]}>
      {/* Red screen flash when player is hit */}
      <Animated.View style={[styles.screenFlash, screenFlashStyle, { pointerEvents: 'none' }]} />

      <Animated.View style={shakeStyle}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.replace('/')} style={styles.exitBtn}>
            <Feather name="x" size={18} color="#6060a0" />
          </TouchableOpacity>
          <View style={styles.waveInfo}>
            <Text style={styles.waveLabel}>
              {state.wave >= state.maxWaves ? '⚠ BOSS' : `WAVE ${state.wave}/3`}
            </Text>
            <Text style={styles.turnLabel}>TURN {state.turn}</Text>
          </View>
          <View style={styles.goldRow}>
            <Feather name="dollar-sign" size={13} color="#ffee00" />
            <Text style={styles.goldText}>{state.player.gold}</Text>
          </View>
        </View>

        {/* Enemy zone */}
        <View style={styles.enemyZoneWrapper}>
          {/* Particle bursts - centered in enemy zone */}
          <View style={styles.particleAnchor} pointerEvents="none">
            {particleBursts.map((burst) => (
              <ParticleBurst
                key={burst.id}
                type={burst.type}
                onComplete={() => removeBurst(burst.id)}
              />
            ))}
          </View>

          <ScrollView
            horizontal
            style={styles.enemyZone}
            contentContainerStyle={styles.enemyContent}
            showsHorizontalScrollIndicator={false}
          >
            {livingEnemies.length === 0 ? (
              <View style={styles.noEnemies}>
                <Text style={styles.noEnemiesText}>Clearing wave...</Text>
              </View>
            ) : (
              livingEnemies.map((enemy, i) => (
                <EnemyView
                  key={enemy.templateId + i}
                  enemy={enemy}
                  index={i}
                  hitCount={enemyHitCounts[i] ?? 0}
                />
              ))
            )}
          </ScrollView>
        </View>

        {/* Player stats */}
        <View style={styles.playerSection}>
          <HealthBar current={state.player.hp} max={state.player.maxHp} label="HP" height={10} />
          {state.player.shield > 0 && (
            <View style={styles.shieldRow}>
              <Feather name="shield" size={12} color="#00f5ff" />
              <Text style={styles.shieldText}>{state.player.shield} SHIELD</Text>
            </View>
          )}

          {/* Energy */}
          <View style={styles.energyRow}>
            <Text style={styles.energyLabel}>ENERGY</Text>
            <View style={styles.energyDots}>
              {Array.from({ length: state.player.maxEnergy }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.energyDot,
                    {
                      backgroundColor: i < state.player.energy ? '#00f5ff' : '#1a0035',
                      borderColor: i < state.player.energy ? '#00f5ff' : '#2a0060',
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.energyCount}>{state.player.energy}/{state.player.maxEnergy}</Text>
          </View>

          {/* Active synergies */}
          {state.activeSynergies.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.synergyScroll}>
              {state.activeSynergies.map((s) => <SynergyBadge key={s} synergy={s} />)}
            </ScrollView>
          )}
        </View>

        {/* Combat log */}
        <View style={styles.logBox}>
          {recentLog.map((line, i) => (
            <Text
              key={i}
              style={[styles.logLine, { opacity: 0.5 + 0.5 * ((i + 1) / Math.max(1, recentLog.length)) }]}
              numberOfLines={1}
            >
              {line}
            </Text>
          ))}
        </View>

        {/* Hand section */}
        <View style={styles.handSection}>
          <View style={styles.deckRow}>
            <Text style={styles.deckInfo}>
              <Text style={{ color: '#00f5ff' }}>Hand: {state.hand.length}</Text>
              {'  '}
              <Text style={{ color: '#6060a0' }}>Deck: {state.deck.length}</Text>
              {'  '}
              <Text style={{ color: '#444466' }}>Disc: {state.discard.length}</Text>
            </Text>
            {state.player.zeroCostNext && (
              <View style={styles.zeroCostBadge}>
                <Text style={styles.zeroCostText}>NEXT FREE</Text>
              </View>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.handContent}
          >
            {state.hand.map((card, i) => {
              const cost = state.player.zeroCostNext ? 0 : card.cost;
              const canPlay = isPlayerTurn && state.player.energy >= cost;
              return (
                <CardView
                  key={card.instanceId}
                  card={card}
                  onPress={() => handlePlayCard(i)}
                  disabled={!canPlay}
                />
              );
            })}
            {state.hand.length === 0 && (
              <View style={styles.emptyHand}>
                <Text style={styles.emptyHandText}>No cards in hand</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* End Turn button */}
        <TouchableOpacity
          style={[
            styles.endTurnBtn,
            { marginBottom: botPad + 8 },
            !isPlayerTurn && styles.endTurnDisabled,
          ]}
          onPress={handleEndTurn}
          disabled={!isPlayerTurn}
        >
          <Text style={[styles.endTurnText, !isPlayerTurn && styles.endTurnTextDisabled]}>
            {isPlayerTurn ? 'END TURN →' : 'ENEMY TURN...'}
          </Text>
        </TouchableOpacity>

        {/* Synergy popup (over everything) */}
        <SynergyPopup synergy={synergyPopup} />

        {/* Overlays */}
        {state.phase === 'wave_complete' && (
          <CardSelectOverlay
            cards={state.pendingCards}
            wave={state.wave}
            onSelect={handleSelectCard}
            onSkip={handleSkipCard}
          />
        )}

        {state.phase === 'boss_intro' && (
          <BossIntroOverlay onFight={() => dispatch({ type: 'DISMISS_BOSS_INTRO' })} />
        )}

        {state.phase === 'victory' && (
          <VictoryOverlay goldEarned={state.goldEarned} onContinue={handleVictory} />
        )}

        {state.phase === 'game_over' && (
          <GameOverOverlay goldEarned={state.goldEarned} wave={state.wave} onRetry={handleGameOver} />
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07000f',
  },
  screenFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ff0030',
    zIndex: 999,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#2a0060',
    gap: 10,
  },
  exitBtn: { padding: 4 },
  waveInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  waveLabel: {
    color: '#e0e0ff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },
  turnLabel: {
    color: '#6060a0',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
  },
  goldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ffee0022',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#ffee0040',
  },
  goldText: {
    color: '#ffee00',
    fontSize: 13,
    fontWeight: '800',
  },
  enemyZoneWrapper: {
    maxHeight: 210,
    minHeight: 160,
    borderBottomWidth: 1,
    borderBottomColor: '#2a0060',
    position: 'relative',
  },
  particleAnchor: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    zIndex: 10,
  },
  enemyZone: {
    flex: 1,
  },
  enemyContent: {
    padding: 12,
    gap: 8,
    alignItems: 'flex-start',
  },
  noEnemies: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    minWidth: 200,
  },
  noEnemiesText: {
    color: '#6060a0',
    fontSize: 13,
  },
  playerSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2a0060',
  },
  shieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  shieldText: {
    color: '#00f5ff',
    fontSize: 11,
    fontWeight: '700',
  },
  energyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  energyLabel: {
    color: '#6060a0',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    width: 46,
  },
  energyDots: {
    flexDirection: 'row',
    gap: 4,
  },
  energyDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  energyCount: {
    color: '#00f5ff',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  synergyScroll: { marginTop: 2 },
  logBox: {
    backgroundColor: '#0d001e',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#2a0060',
    minHeight: 44,
  },
  logLine: {
    color: '#8888bb',
    fontSize: 10,
    lineHeight: 14,
  },
  handSection: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#2a0060',
  },
  deckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 4,
    justifyContent: 'space-between',
  },
  deckInfo: {
    fontSize: 10,
    fontWeight: '600',
  },
  zeroCostBadge: {
    backgroundColor: '#ffee0033',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#ffee00',
  },
  zeroCostText: {
    color: '#ffee00',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  handContent: {
    paddingHorizontal: 10,
    paddingBottom: 8,
    alignItems: 'center',
  },
  emptyHand: {
    width: 200,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyHandText: {
    color: '#2a0060',
    fontSize: 12,
  },
  endTurnBtn: {
    backgroundColor: '#00f5ff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  endTurnDisabled: {
    backgroundColor: '#1a0035',
    borderWidth: 1,
    borderColor: '#2a0060',
  },
  endTurnText: {
    color: '#07000f',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 3,
  },
  endTurnTextDisabled: {
    color: '#4040a0',
  },
});
