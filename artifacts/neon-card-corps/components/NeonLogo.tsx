import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

function GlowText({
  text,
  style,
  glowColor,
  animRadius,
}: {
  text: string;
  style: object;
  glowColor: string;
  animRadius: Animated.SharedValue<number>;
}) {
  const animStyle = useAnimatedStyle(() => ({
    textShadowRadius: animRadius.value,
    textShadowColor: glowColor,
    textShadowOffset: { width: 0, height: 0 },
  }));

  return <Animated.Text style={[style, animStyle]}>{text}</Animated.Text>;
}

export default function NeonLogo() {
  const cyanGlow = useSharedValue(18);
  const magentaGlow = useSharedValue(12);
  const caOffset = useSharedValue(1.5);
  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(16);

  useEffect(() => {
    const easing = Easing.inOut(Easing.sine);

    logoOpacity.value = withTiming(1, { duration: 700 });
    logoTranslateY.value = withTiming(0, { duration: 700, easing: Easing.out(Easing.cubic) });

    cyanGlow.value = withRepeat(
      withSequence(
        withTiming(38, { duration: 2200, easing }),
        withTiming(14, { duration: 2200, easing }),
      ),
      -1,
      true,
    );
    magentaGlow.value = withRepeat(
      withSequence(
        withTiming(22, { duration: 3100, easing }),
        withTiming(8, { duration: 3100, easing }),
      ),
      -1,
      true,
    );
    caOffset.value = withRepeat(
      withSequence(
        withTiming(2.5, { duration: 1800, easing }),
        withTiming(0.8, { duration: 1800, easing }),
      ),
      -1,
      true,
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const caLeftStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -caOffset.value }],
    opacity: 0.45,
  }));

  const caRightStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: caOffset.value }],
    opacity: 0.35,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.accentRow}>
        <View style={styles.accentLine} />
        <Text style={styles.accentText}>// CORP EDITION v1.0</Text>
        <View style={[styles.accentLine, { flex: 1 }]} />
      </View>

      <View style={styles.neonRow}>
        <Animated.Text style={[styles.neonCA, styles.neonCALeft, caLeftStyle]}>
          NEON
        </Animated.Text>
        <Animated.Text style={[styles.neonCA, styles.neonCARight, caRightStyle]}>
          NEON
        </Animated.Text>
        <GlowText
          text="NEON"
          style={styles.neonMain}
          glowColor="#00f5ff"
          animRadius={cyanGlow}
        />
      </View>

      <View style={styles.corpsRow}>
        <Animated.Text style={[styles.corpsCA, caLeftStyle]}>CARD CORPS</Animated.Text>
        <GlowText
          text="CARD CORPS"
          style={styles.corpsMain}
          glowColor="#ff00ff"
          animRadius={magentaGlow}
        />
      </View>

      <View style={styles.taglineRow}>
        <View style={styles.taglineDot} />
        <Text style={styles.tagline}>CYBERPUNK ROGUELIKE DECKBUILDER</Text>
        <View style={styles.taglineDot} />
      </View>
    </Animated.View>
  );
}

const BASE_FONT = Platform.OS === 'web' ? 'system-ui, sans-serif' : undefined;

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  accentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    alignSelf: 'stretch',
  },
  accentLine: {
    height: 1,
    width: 24,
    backgroundColor: '#00f5ff',
    opacity: 0.6,
  },
  accentText: {
    color: '#4488aa',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 2.5,
    fontFamily: BASE_FONT,
  },
  neonRow: {
    position: 'relative',
  },
  neonMain: {
    color: '#00f5ff',
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: 10,
    lineHeight: 62,
    fontFamily: BASE_FONT,
  },
  neonCA: {
    position: 'absolute',
    fontSize: 58,
    fontWeight: '900',
    letterSpacing: 10,
    lineHeight: 62,
    fontFamily: BASE_FONT,
  },
  neonCALeft: {
    color: '#ff00ff',
    left: 0,
  },
  neonCARight: {
    color: '#00f5ff',
    left: 0,
  },
  corpsRow: {
    position: 'relative',
    marginTop: 2,
    marginBottom: 10,
  },
  corpsMain: {
    color: '#e8e8ff',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 5,
    lineHeight: 36,
    fontFamily: BASE_FONT,
  },
  corpsCA: {
    position: 'absolute',
    color: '#ff00ff',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 5,
    lineHeight: 36,
    fontFamily: BASE_FONT,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taglineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7b2fff',
  },
  tagline: {
    color: '#7b2fff',
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 3,
    fontFamily: BASE_FONT,
  },
});
