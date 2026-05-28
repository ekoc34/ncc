import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  TouchableOpacity,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  withSpring,
  cancelAnimation,
} from 'react-native-reanimated';

// ─── Step definitions ────────────────────────────────────────────────────────

interface TutorialStep {
  title: string;
  desc: string;
  color: string;
  highlightFrac: number | null;
  tooltipFrac: number;
  arrowDir: 'up' | 'down' | null;
}

const STEPS: TutorialStep[] = [
  {
    title: 'Your Hand',
    desc: 'Tap a card to play it',
    color: '#00f5ff',
    highlightFrac: 0.77,
    tooltipFrac: 0.48,
    arrowDir: 'down',
  },
  {
    title: 'Energy',
    desc: 'Cards cost energy · refills each turn',
    color: '#00f5ff',
    highlightFrac: 0.60,
    tooltipFrac: 0.36,
    arrowDir: 'down',
  },
  {
    title: 'Enemy Intent',
    desc: 'They always show their next move',
    color: '#ff6080',
    highlightFrac: 0.24,
    tooltipFrac: 0.48,
    arrowDir: 'up',
  },
  {
    title: 'Synergies',
    desc: 'Stack matching tags for powerful combos',
    color: '#aa60ff',
    highlightFrac: null,
    tooltipFrac: 0.42,
    arrowDir: null,
  },
  {
    title: 'After Each Run',
    desc: 'Win → earn gold → upgrade your deck',
    color: '#ffee00',
    highlightFrac: null,
    tooltipFrac: 0.42,
    arrowDir: null,
  },
];

// ─── Components ──────────────────────────────────────────────────────────────

function HighlightRing({ y, color }: { y: number; color: string }) {
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 600 }),
        withTiming(0.4, { duration: 600 }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, []);

  const style = useAnimatedStyle(() => ({
    borderColor: color,
    opacity: pulse.value,
    shadowOpacity: pulse.value * 0.8,
  }));

  return (
    <Animated.View
      style={[
        styles.highlightRing,
        { top: y - 28, shadowColor: color },
        style,
      ]}
      pointerEvents="none"
    />
  );
}

function Arrow({ dir, color }: { dir: 'up' | 'down'; color: string }) {
  const bounce = useSharedValue(0);

  useEffect(() => {
    bounce.value = withRepeat(
      withSequence(
        withTiming(dir === 'down' ? 6 : -6, { duration: 450 }),
        withTiming(0, { duration: 450 }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(bounce);
  }, [dir]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: bounce.value }],
  }));

  return (
    <Animated.View style={style} pointerEvents="none">
      <Text style={[styles.arrowText, { color }]}>
        {dir === 'down' ? '▼' : '▲'}
      </Text>
    </Animated.View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface Props {
  step: number;
  totalSteps?: number;
  onNext: () => void;
  onSkip: () => void;
}

export default function TutorialOverlay({ step, totalSteps = 5, onNext, onSkip }: Props) {
  const { height: screenH, width: screenW } = useWindowDimensions();
  const config = STEPS[step] ?? STEPS[0];

  const fadeOpacity = useSharedValue(0);
  const tooltipScale = useSharedValue(0.85);

  useEffect(() => {
    fadeOpacity.value = withTiming(1, { duration: 220 });
    tooltipScale.value = withSpring(1, { damping: 14, stiffness: 200 });
    return () => {
      fadeOpacity.value = 0;
      tooltipScale.value = 0.85;
    };
  }, [step]);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: fadeOpacity.value }));
  const tooltipStyle = useAnimatedStyle(() => ({
    opacity: fadeOpacity.value,
    transform: [{ scale: tooltipScale.value }],
  }));

  const tooltipY = screenH * config.tooltipFrac;
  const highlightY = config.highlightFrac !== null ? screenH * config.highlightFrac : null;

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={onNext}>
      {/* Semi-transparent backdrop */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} pointerEvents="none" />

      {/* Highlight ring */}
      {highlightY !== null && (
        <HighlightRing y={highlightY} color={config.color} />
      )}

      {/* Arrow pointing toward highlight */}
      {config.arrowDir !== null && highlightY !== null && (
        <View
          style={[
            styles.arrowContainer,
            config.arrowDir === 'down'
              ? { top: tooltipY + 132 }
              : { top: tooltipY - 42 },
          ]}
          pointerEvents="none"
        >
          <Arrow dir={config.arrowDir} color={config.color} />
        </View>
      )}

      {/* Tooltip */}
      <Animated.View
        style={[
          styles.tooltip,
          {
            top: tooltipY,
            left: 24,
            right: 24,
            borderColor: config.color,
            shadowColor: config.color,
          },
          tooltipStyle,
        ]}
        pointerEvents="none"
      >
        {/* Step dots */}
        <View style={styles.dotsRow}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === step ? config.color : '#2a0060',
                  width: i === step ? 16 : 6,
                },
              ]}
            />
          ))}
        </View>

        <Text style={[styles.title, { color: config.color }]}>{config.title}</Text>
        <Text style={styles.desc}>{config.desc}</Text>

        <Text style={styles.tapHint}>
          {step < totalSteps - 1 ? 'tap anywhere · next' : 'tap to start playing'}
        </Text>
      </Animated.View>

      {/* Skip button */}
      <TouchableOpacity
        style={styles.skipBtn}
        onPress={(e) => {
          e.stopPropagation();
          onSkip();
        }}
        hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
      >
        <Text style={styles.skipText}>SKIP</Text>
      </TouchableOpacity>
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: '#07000f',
    opacity: 0.76,
  },
  highlightRing: {
    position: 'absolute',
    left: '10%',
    right: '10%',
    height: 56,
    borderRadius: 14,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
  },
  arrowContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 22,
    textAlign: 'center',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: '#0d001e',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    shadowOpacity: 0.6,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 6,
    textAlign: 'center',
  },
  desc: {
    color: '#c0c0e0',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 14,
  },
  tapHint: {
    color: '#4040a0',
    fontSize: 10,
    letterSpacing: 1.5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  skipBtn: {
    position: 'absolute',
    top: 16,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1a0035',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a0060',
  },
  skipText: {
    color: '#6060a0',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
