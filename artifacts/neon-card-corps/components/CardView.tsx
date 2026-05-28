import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CardInstance } from '@/game/types';

interface Props {
  card: CardInstance;
  onPress?: () => void;
  disabled?: boolean;
  small?: boolean;
  dimmed?: boolean;
}

const TYPE_COLORS: Record<string, string> = {
  attack: '#ff3060',
  shield: '#00f5ff',
  skill: '#7b2fff',
  power: '#ffee00',
};

const TAG_COLORS: Record<string, string> = {
  lightning: '#ffee00',
  void: '#7b2fff',
  fire: '#ff6030',
  ice: '#80e8ff',
  tech: '#00ff88',
};

export default function CardView({ card, onPress, disabled, small, dimmed }: Props) {
  const typeColor = TYPE_COLORS[card.type] ?? '#aaaaff';
  const isDisabled = disabled || dimmed;

  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePressIn = () => {
    if (isDisabled) return;
    scale.value = withTiming(0.92, { duration: 55 });
    glowOpacity.value = withTiming(0.55, { duration: 55 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 14, stiffness: 320 });
    glowOpacity.value = withTiming(0, { duration: 180 });
  };

  const handlePress = () => {
    if (isDisabled || !onPress) return;
    scale.value = withSequence(
      withTiming(1.16, { duration: 65 }),
      withSpring(1, { damping: 10, stiffness: 240 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={isDisabled}
    >
      <Animated.View
        style={[
          styles.card,
          small && styles.cardSmall,
          {
            borderColor: isDisabled ? '#1a0035' : typeColor,
            opacity: isDisabled ? 0.42 : 1,
          },
          animatedStyle,
        ]}
      >
        {/* Press glow overlay */}
        <Animated.View
          style={[StyleSheet.absoluteFill, styles.glowOverlay, { backgroundColor: typeColor }, glowStyle]}
          pointerEvents="none"
        />

        {/* Tag color accent bar */}
        {card.tags.length > 0 && !isDisabled && (
          <View style={[styles.accentBar, { backgroundColor: TAG_COLORS[card.tags[0]] ?? typeColor }]} />
        )}

        {/* Cost badge */}
        <View style={[styles.costBadge, { backgroundColor: isDisabled ? '#1a0035' : typeColor }]}>
          <Text style={[styles.costText, { color: isDisabled ? '#4444aa' : '#07000f' }]}>
            {card.cost}
          </Text>
        </View>

        {/* Type indicator */}
        <Text style={[styles.typeLabel, { color: isDisabled ? '#2a2060' : typeColor }]}>
          {card.type.toUpperCase()}
        </Text>

        {/* Card name */}
        <Text
          style={[styles.name, small && styles.nameSmall, { color: isDisabled ? '#3a3060' : '#e0e0ff' }]}
          numberOfLines={2}
        >
          {card.name}
        </Text>

        {/* Tags */}
        {card.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {card.tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: (TAG_COLORS[tag] ?? '#888') + '33' }]}>
                <Text style={[styles.tagText, { color: isDisabled ? '#2a2060' : (TAG_COLORS[tag] ?? '#888') }]}>
                  {tag.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Description */}
        {!small && (
          <Text style={[styles.desc, { color: isDisabled ? '#222050' : '#8888bb' }]} numberOfLines={3}>
            {card.description}
          </Text>
        )}

        {/* Rarity dot */}
        <View
          style={[
            styles.rarityDot,
            {
              backgroundColor:
                card.rarity === 'rare' ? '#ffee00' : card.rarity === 'uncommon' ? '#aa88ff' : '#555577',
            },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 112,
    height: 162,
    backgroundColor: '#0d001e',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 8,
    marginHorizontal: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  cardSmall: {
    width: 92,
    height: 132,
    padding: 6,
  },
  glowOverlay: {
    borderRadius: 11,
    opacity: 0,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.7,
  },
  costBadge: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  costText: {
    fontWeight: '800',
    fontSize: 13,
  },
  typeLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
    marginTop: 3,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 16,
    paddingRight: 22,
  },
  nameSmall: {
    fontSize: 10,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    marginBottom: 4,
  },
  tag: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  desc: {
    fontSize: 9,
    lineHeight: 13,
    marginTop: 2,
  },
  rarityDot: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
