import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { getSynergyById } from '@/game/synergies';
import { SynergyType } from '@/game/types';

interface Props {
  synergy: SynergyType;
}

export default function SynergyBadge({ synergy }: Props) {
  const s = getSynergyById(synergy);
  return (
    <View style={[styles.badge, { borderColor: s.color }]}>
      <Text style={[styles.name, { color: s.color }]}>{s.name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    backgroundColor: '#0d001e',
  },
  name: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
