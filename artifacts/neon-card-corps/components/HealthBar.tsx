import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface Props {
  current: number;
  max: number;
  color?: string;
  label?: string;
  height?: number;
}

export default function HealthBar({ current, max, color = '#00ff88', label, height = 8 }: Props) {
  const pct = Math.max(0, Math.min(1, current / max));
  const barColor = label === 'HP'
    ? (pct > 0.6 ? '#00ff88' : pct > 0.3 ? '#ffee00' : '#ff3060')
    : color;

  return (
    <View style={styles.wrap}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <View style={[styles.bg, { height }]}>
        <View style={[styles.fill, { width: `${pct * 100}%` as any, backgroundColor: barColor, height }]} />
      </View>
      <Text style={styles.value}>{current}/{max}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    color: '#8888bb',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    width: 20,
  },
  bg: {
    flex: 1,
    backgroundColor: '#1a0035',
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    borderRadius: 4,
  },
  value: {
    color: '#8888bb',
    fontSize: 10,
    fontWeight: '600',
    minWidth: 50,
    textAlign: 'right',
  },
});
