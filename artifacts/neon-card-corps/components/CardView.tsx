import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CardInstance } from '@/game/types';
import { useColors } from '@/hooks/useColors';

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

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.card,
        small && styles.cardSmall,
        { borderColor: typeColor, opacity: isDisabled ? 0.45 : pressed ? 0.75 : 1 },
      ]}
    >
      {/* Cost badge */}
      <View style={[styles.costBadge, { backgroundColor: typeColor }]}>
        <Text style={styles.costText}>{card.cost}</Text>
      </View>

      {/* Type indicator */}
      <Text style={[styles.typeLabel, { color: typeColor }]}>
        {card.type.toUpperCase()}
      </Text>

      {/* Card name */}
      <Text style={[styles.name, small && styles.nameSmall]} numberOfLines={2}>
        {card.name}
      </Text>

      {/* Tags */}
      {card.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {card.tags.map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: TAG_COLORS[tag] + '33' }]}>
              <Text style={[styles.tagText, { color: TAG_COLORS[tag] }]}>
                {tag.toUpperCase()}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Description */}
      {!small && (
        <Text style={styles.desc} numberOfLines={3}>
          {card.description}
        </Text>
      )}

      {/* Rarity dot */}
      <View style={[styles.rarityDot, { backgroundColor: card.rarity === 'rare' ? '#ffee00' : card.rarity === 'uncommon' ? '#aa88ff' : '#555577' }]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 110,
    height: 160,
    backgroundColor: '#0d001e',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 8,
    marginHorizontal: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  cardSmall: {
    width: 90,
    height: 130,
    padding: 6,
  },
  costBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  costText: {
    color: '#07000f',
    fontWeight: '800',
    fontSize: 13,
  },
  typeLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  name: {
    color: '#e0e0ff',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 16,
    paddingRight: 20,
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
    color: '#8888bb',
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
