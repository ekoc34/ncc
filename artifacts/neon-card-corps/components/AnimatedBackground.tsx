import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');

const PARTICLES = [
  { x: 0.08, y: 0.12, size: 2.5, color: '#00f5ff', dur: 9000, amp: 35, phase: 0 },
  { x: 0.92, y: 0.22, size: 2, color: '#ff00ff', dur: 11500, amp: 42, phase: 1200 },
  { x: 0.48, y: 0.08, size: 3, color: '#7b2fff', dur: 8500, amp: 28, phase: 600 },
  { x: 0.18, y: 0.62, size: 2, color: '#00f5ff', dur: 13000, amp: 38, phase: 2000 },
  { x: 0.82, y: 0.72, size: 2.5, color: '#ff00ff', dur: 7500, amp: 46, phase: 400 },
  { x: 0.62, y: 0.38, size: 2, color: '#00ff88', dur: 15000, amp: 22, phase: 800 },
  { x: 0.28, y: 0.82, size: 2, color: '#7b2fff', dur: 10500, amp: 32, phase: 1600 },
  { x: 0.74, y: 0.52, size: 2.5, color: '#00f5ff', dur: 12000, amp: 26, phase: 300 },
  { x: 0.12, y: 0.44, size: 3, color: '#ff00ff', dur: 9800, amp: 38, phase: 1800 },
  { x: 0.88, y: 0.32, size: 2, color: '#7b2fff', dur: 14000, amp: 30, phase: 700 },
  { x: 0.35, y: 0.18, size: 2, color: '#00f5ff', dur: 11000, amp: 24, phase: 1400 },
  { x: 0.65, y: 0.88, size: 2.5, color: '#ff00ff', dur: 8000, amp: 34, phase: 900 },
];

const GRID_H = Array.from({ length: 7 }, (_, i) => (i + 1) * (H / 8));
const GRID_V = Array.from({ length: 5 }, (_, i) => (i + 1) * (W / 6));

function FloatingParticle({ p }: { p: typeof PARTICLES[0] }) {
  const ty = useSharedValue(0);
  const tx = useSharedValue(0);
  const opacity = useSharedValue(0.2);

  useEffect(() => {
    const easing = Easing.inOut(Easing.sine);
    ty.value = withRepeat(
      withSequence(
        withTiming(-p.amp, { duration: p.dur / 2, easing }),
        withTiming(p.amp * 0.6, { duration: p.dur / 2, easing }),
      ),
      -1,
      true,
    );
    tx.value = withRepeat(
      withSequence(
        withTiming(p.amp * 0.4, { duration: p.dur * 0.7, easing }),
        withTiming(-p.amp * 0.3, { duration: p.dur * 0.7, easing }),
      ),
      -1,
      true,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: p.dur * 0.6, easing }),
        withTiming(0.1, { duration: p.dur * 0.6, easing }),
      ),
      -1,
      true,
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
    opacity: opacity.value,
  }));

  const s = p.size;

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: p.x * W - s,
          top: p.y * H - s,
          width: s * 2,
          height: s * 2,
          borderRadius: s,
          backgroundColor: p.color,
          shadowColor: p.color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: s * 4,
          elevation: 3,
        },
        style,
      ]}
    />
  );
}

function GlowOrb({
  top,
  left,
  right,
  bottom,
  color,
  size,
  dur,
  startOpacity = 0.06,
}: {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  color: string;
  size: number;
  dur: number;
  startOpacity?: number;
}) {
  const opacity = useSharedValue(startOpacity);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(startOpacity * 2.2, { duration: dur, easing: Easing.inOut(Easing.sine) }),
        withTiming(startOpacity * 0.5, { duration: dur, easing: Easing.inOut(Easing.sine) }),
      ),
      -1,
      true,
    );
  }, []);

  const orbStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top,
          left,
          right,
          bottom,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: size * 0.5,
        },
        orbStyle,
      ]}
    />
  );
}

export default function AnimatedBackground({ children }: { children?: React.ReactNode }) {
  return (
    <View style={styles.root}>
      <View style={StyleSheet.absoluteFill}>
        <GlowOrb top={-120} left={-80} color="#00f5ff" size={320} dur={3800} startOpacity={0.05} />
        <GlowOrb top={-80} right={-60} color="#ff00ff" size={280} dur={4600} startOpacity={0.04} />
        <GlowOrb bottom={-120} left={W / 2 - 160} color="#7b2fff" size={320} dur={5200} startOpacity={0.055} />

        {GRID_H.map((top, i) => (
          <View
            key={`h${i}`}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top,
              height: 0.5,
              backgroundColor: i % 2 === 0 ? '#7b2fff' : '#00f5ff',
              opacity: 0.06,
            }}
          />
        ))}
        {GRID_V.map((left, i) => (
          <View
            key={`v${i}`}
            style={{
              position: 'absolute',
              top: 0,
              bottom: 0,
              left,
              width: 0.5,
              backgroundColor: '#00f5ff',
              opacity: 0.05,
            }}
          />
        ))}

        {PARTICLES.map((p, i) => (
          <FloatingParticle key={i} p={p} />
        ))}

        <View style={styles.scanlines} pointerEvents="none" />
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07000f',
    overflow: 'hidden',
  },
  scanlines: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.025,
    backgroundColor: 'transparent',
  },
});
