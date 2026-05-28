import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import { SynergyType } from '@/game/types';
import { getSynergyById } from '@/game/synergies';

interface Props {
  synergy: SynergyType | null;
}

export default function SynergyPopup({ synergy }: Props) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);
  const translateY = useSharedValue(20);

  useEffect(() => {
    if (!synergy) {
      opacity.value = withTiming(0, { duration: 200 });
      scale.value = withTiming(0.6, { duration: 200 });
      return;
    }

    // Animate in
    opacity.value = withSequence(
      withTiming(1, { duration: 180 }),
      withDelay(1000, withTiming(0, { duration: 350 })),
    );
    scale.value = withSpring(1, { damping: 10, stiffness: 220 });
    translateY.value = withSequence(
      withTiming(0, { duration: 180 }),
      withDelay(1000, withTiming(-10, { duration: 350 })),
    );
  }, [synergy]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  if (!synergy) return null;

  const s = getSynergyById(synergy);

  return (
    <Animated.View style={[styles.wrap, animStyle]} pointerEvents="none">
      <View style={[styles.pill, { borderColor: s.color }]}>
        <Text style={[styles.label, { color: s.color }]}>SYNERGY</Text>
        <Text style={[styles.name, { color: s.color }]}>{s.name}</Text>
        <Text style={styles.bonus} numberOfLines={1}>{s.bonusDescription}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 200,
  },
  pill: {
    backgroundColor: '#07000fee',
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    maxWidth: 280,
    shadowColor: '#00f5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 3,
    marginBottom: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 4,
  },
  bonus: {
    color: '#8888bb',
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
});
