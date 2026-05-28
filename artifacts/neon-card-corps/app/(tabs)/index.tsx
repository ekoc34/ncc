import React, { useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, Alert, Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useMeta } from '@/context/MetaContext';
import { playSound, resumeAudio } from '@/game/audio';
import AnimatedBackground from '@/components/AnimatedBackground';
import NeonLogo from '@/components/NeonLogo';
import { PrimaryButton, SecondaryButton } from '@/components/PremiumButton';

function StatsBar({ runs, wins, gold }: { runs: number; wins: number; gold: number }) {
  const opacity = useSharedValue(0);
  const ty = useSharedValue(10);

  useEffect(() => {
    opacity.value = withDelay(500, withTiming(1, { duration: 600 }));
    ty.value = withDelay(500, withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  const winRate = runs > 0 ? Math.round((wins / runs) * 100) : 0;

  return (
    <Animated.View style={[styles.statsContainer, style]}>
      <View style={styles.statsInner}>
        <StatItem value={runs} label="RUNS" color="#00f5ff" />
        <View style={styles.statsDivider} />
        <StatItem value={wins} label="WINS" color="#00ff88" />
        <View style={styles.statsDivider} />
        <StatItem value={`${winRate}%`} label="WIN RATE" color="#ff00ff" />
        <View style={styles.statsDivider} />
        <StatItem value={gold} label="GOLD" color="#ffee00" />
      </View>
    </Animated.View>
  );
}

function StatItem({ value, label, color }: { value: number | string; label: string; color: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function ButtonsSection({
  onStartRun,
  onUpgrades,
  onSettings,
  onCredits,
  gold,
}: {
  onStartRun: () => void;
  onUpgrades: () => void;
  onSettings: () => void;
  onCredits: () => void;
  gold: number;
}) {
  const opacity = useSharedValue(0);
  const ty = useSharedValue(20);

  useEffect(() => {
    opacity.value = withDelay(300, withTiming(1, { duration: 700 }));
    ty.value = withDelay(300, withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View style={[styles.btnSection, style]}>
      <PrimaryButton label="START RUN" onPress={onStartRun} icon="play" />

      <View style={styles.secondaryRow}>
        <SecondaryButton
          label="UPGRADES"
          onPress={onUpgrades}
          icon="trending-up"
          badge={gold > 0 ? `${gold}G` : undefined}
          accentColor="#7b2fff"
          style={{ flex: 1 }}
        />
        <SecondaryButton
          label="SETTINGS"
          onPress={onSettings}
          icon="settings"
          accentColor="#00f5ff"
          style={{ flex: 1 }}
        />
      </View>

      <SecondaryButton
        label="CREDITS"
        onPress={onCredits}
        icon="star"
        accentColor="#ff00ff"
      />
    </Animated.View>
  );
}

function BottomBar() {
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.sine) }),
        withTiming(0.3, { duration: 2500, easing: Easing.inOut(Easing.sine) }),
      ),
      -1,
      true,
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={styles.bottomBar}>
      <Animated.View style={[styles.bottomDot, dotStyle]} />
      <Text style={styles.bottomText}>SINGLE PLAYER  ·  ROGUELIKE  ·  DECKBUILDER</Text>
      <Animated.View style={[styles.bottomDot, dotStyle]} />
    </View>
  );
}

export default function MainMenu() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { meta, isLoaded } = useMeta();

  const topPad = Platform.OS === 'web' ? 52 : insets.top;
  const botPad = Platform.OS === 'web' ? 28 : insets.bottom;

  const startRun = useCallback(() => {
    resumeAudio();
    playSound('button_primary');
    router.push({
      pathname: '/run',
      params: { upgrades: JSON.stringify(meta.upgrades) },
    });
  }, [meta.upgrades, router]);

  const goUpgrades = useCallback(() => {
    playSound('button_click');
    router.push('/upgrade');
  }, [router]);

  const goSettings = useCallback(() => {
    playSound('button_click');
    router.push('/settings');
  }, [router]);

  const showCredits = useCallback(() => {
    playSound('button_click');
    Alert.alert(
      'NEON CARD CORPS',
      'A cyberpunk roguelike deckbuilder.\n\nDesign & Development\nCorp Edition v1.0\n\n"The net is dark and full of enemies."\n\n© 2026 Neon Card Corps',
      [{ text: 'CLOSE', style: 'cancel' }],
    );
  }, []);

  return (
    <AnimatedBackground>
      <View
        style={[
          styles.overlay,
          { paddingTop: topPad + 16, paddingBottom: botPad + 16 },
        ]}
      >
        <NeonLogo />

        <View style={styles.divider} />

        <ButtonsSection
          onStartRun={startRun}
          onUpgrades={goUpgrades}
          onSettings={goSettings}
          onCredits={showCredits}
          gold={isLoaded ? meta.totalGold : 0}
        />

        {isLoaded && (
          <StatsBar
            runs={meta.totalRuns}
            wins={meta.totalWins}
            gold={meta.totalGold}
          />
        )}

        <BottomBar />
      </View>
    </AnimatedBackground>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    backgroundColor: '#2a006055',
    marginVertical: 10,
  },
  btnSection: {
    gap: 10,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#2a0060aa',
  },
  statsInner: {
    backgroundColor: '#0d001ecc',
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 4,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statLabel: {
    color: '#555588',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  statsDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#2a0060',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  bottomDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3a0080',
  },
  bottomText: {
    color: '#3a0080',
    fontSize: 8.5,
    letterSpacing: 2,
    fontWeight: '600',
  },
});
