import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
} from 'react-native-reanimated';

const TAG_COLORS: Record<string, string> = {
  lightning: '#ffee00',
  fire: '#ff6030',
  ice: '#80e8ff',
  void: '#aa60ff',
  tech: '#00ff88',
  damage: '#ff3060',
  shield: '#00f5ff',
  heal: '#00ff88',
};

const PARTICLE_COUNT = 6;

interface ParticleProps {
  color: string;
  angle: number;
  delay: number;
  size?: number;
  distance?: number;
}

function Particle({ color, angle, delay, size = 6, distance = 45 }: ParticleProps) {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;

    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 80 }),
      withTiming(0, { duration: 420 }),
    ));
    scale.value = withDelay(delay, withSequence(
      withTiming(1.4, { duration: 80 }),
      withTiming(0.2, { duration: 420 }),
    ));
    tx.value = withDelay(delay, withTiming(dx, { duration: 500 }));
    ty.value = withDelay(delay, withTiming(dy, { duration: 500 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 4,
        },
        style,
      ]}
    />
  );
}

interface Props {
  type?: string;
  onComplete: () => void;
}

export default function ParticleBurst({ type = 'damage', onComplete }: Props) {
  const color = TAG_COLORS[type] ?? '#ffffff';
  const isLightning = type === 'lightning';
  const isVoid = type === 'void';
  const count = isLightning ? 8 : PARTICLE_COUNT;

  useEffect(() => {
    const timer = setTimeout(onComplete, 650);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <View style={[styles.container, { pointerEvents: 'none' }]}>
      {Array.from({ length: count }).map((_, i) => {
        const baseAngle = (i / count) * Math.PI * 2;
        const jitter = (Math.random() - 0.5) * 0.4;
        const distance = isVoid ? 30 + Math.random() * 20 : 35 + Math.random() * 30;
        return (
          <Particle
            key={i}
            color={isVoid ? `rgba(170,96,255,${0.5 + Math.random() * 0.5})` : color}
            angle={baseAngle + jitter}
            delay={i * 15}
            size={isLightning ? 4 : 6}
            distance={distance}
          />
        );
      })}
      {/* Center flash */}
      <FlashCore color={color} />
    </View>
  );
}

function FlashCore({ color }: { color: string }) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSequence(withTiming(2.5, { duration: 80 }), withTiming(0, { duration: 250 }));
    opacity.value = withSequence(withTiming(1, { duration: 60 }), withTiming(0, { duration: 270 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 1,
          shadowRadius: 8,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 1,
    height: 1,
  },
});
