import React, { useEffect, useCallback } from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Feather>['name'];
  style?: ViewStyle;
}

export function PrimaryButton({ label, onPress, icon, style }: PrimaryButtonProps) {
  const glowOpacity = useSharedValue(0.4);
  const glowScale = useSharedValue(1);

  useEffect(() => {
    const easing = Easing.inOut(Easing.sine);
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1400, easing }),
        withTiming(0.3, { duration: 1400, easing }),
      ),
      -1,
      true,
    );
    glowScale.value = withRepeat(
      withSequence(
        withTiming(1.015, { duration: 1400, easing }),
        withTiming(0.99, { duration: 1400, easing }),
      ),
      -1,
      true,
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: glowScale.value }],
  }));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={[styles.primaryWrap, style]}>
      <View style={styles.primaryInner}>
        {icon && <Feather name={icon} size={20} color="#07000f" />}
        <Text style={styles.primaryText}>{label}</Text>
      </View>
      <Animated.View style={[styles.primaryGlow, glowStyle]} pointerEvents="none" />
    </TouchableOpacity>
  );
}

interface SecondaryButtonProps {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Feather>['name'];
  badge?: string;
  style?: ViewStyle;
  accentColor?: string;
}

export function SecondaryButton({
  label,
  onPress,
  icon,
  badge,
  style,
  accentColor = '#7b2fff',
}: SecondaryButtonProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={[styles.secondaryWrap, { borderColor: accentColor + '55' }, style]}>
      {icon && (
        <View style={[styles.iconWrap, { backgroundColor: accentColor + '22' }]}>
          <Feather name={icon} size={16} color={accentColor} />
        </View>
      )}
      <Text style={styles.secondaryText}>{label}</Text>
      {badge && (
        <View style={[styles.badge, { borderColor: '#ffee00', backgroundColor: '#ffee0018' }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Feather name="chevron-right" size={14} color={accentColor + '80'} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primaryWrap: {
    borderRadius: 14,
    overflow: 'hidden',
    position: 'relative',
  },
  primaryInner: {
    backgroundColor: '#00f5ff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 19,
    gap: 12,
    borderRadius: 14,
  },
  primaryText: {
    color: '#07000f',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 4,
  },
  primaryGlow: {
    position: 'absolute',
    inset: -2,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#00f5ff',
    shadowColor: '#00f5ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  } as any,

  secondaryWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d001e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a006055',
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: {
    color: '#d0d0f0',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    flex: 1,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
  },
  badgeText: {
    color: '#ffee00',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
